import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menu } from '../content/menu.ts';
import { lunchWeek } from '../content/lunch.ts';
import { orderingMenu } from '../lib/lunch.ts';
import { parseCheckout, priceCheckout, CheckoutValidationError } from '../lib/checkout.ts';
import { deliveryQuote } from '../lib/delivery.ts';
import { notifyOwner } from '../lib/server/notifications.ts';

export const checkoutFixture = () => ({
  requestId: crypto.randomUUID(),
  name: 'Test customer',
  phone: '+359 888 123 456',
  address: 'Варна, ул. Тестова 12, вх. А, ет. 2, ап. 3',
  notes: '',
  locale: 'en',
  lines: [{ itemId: 'pizza-1', variantId: '33', quantity: 2 }],
  // 2 × 7.80 € plus 1.50 € delivery.
  expectedTotalMinor: 1710,
});

void test('checkout uses current menu prices and rejects missing or changed dishes instead of silently dropping them', () => {
  const input = parseCheckout({ ...checkoutFixture(), recipient: '+123456789', priceMinor: 1 });
  assert.equal(input.phone, '+359888123456');
  assert.equal('recipient' in input, false);
  assert.equal(priceCheckout(input, menu)[0].priceMinor, 780);
  for (const candidate of [
    { ...input, expectedTotalMinor: 1 },
    { ...input, lines: [...input.lines, { itemId: 'missing', variantId: '33', quantity: 1 }] },
  ])
    assert.throws(
      () => priceCheckout(candidate, menu),
      (error) => error instanceof CheckoutValidationError && error.code === 'changed',
    );
});

void test('checkout validates contacts, quantities, duplicate lines, and size limits', () => {
  const input = checkoutFixture();
  for (const patch of [
    { name: 'x' },
    { name: 'Name\nInjected instruction' },
    { phone: 'bad' },
    { requestId: 'invalid' },
    { notes: 'x'.repeat(501) },
    { locale: 'fr' },
    { lines: [] },
    { lines: [...input.lines, ...input.lines] },
    { lines: [{ ...input.lines[0], quantity: 1.2 }] },
    { lines: [{ ...input.lines[0], quantity: 100 }] },
  ])
    assert.throws(() => parseCheckout({ ...input, ...patch }), CheckoutValidationError);
});

void test('checkout rejects items below 12 euro and accepts the exact minimum and higher totals', () => {
  for (const priceMinor of [1199, 1200, 1201]) {
    const pricedMenu = structuredClone(menu);
    const item = pricedMenu.flatMap((category) => category.items).find((dish) => dish.id === 'pizza-1')!;
    item.variants.find((variant) => variant.id === '33')!.priceMinor = priceMinor;
    const input = parseCheckout({
      ...checkoutFixture(),
      lines: [{ itemId: 'pizza-1', variantId: '33', quantity: 1 }],
      expectedTotalMinor: priceMinor + 150,
    });
    if (priceMinor < 1200)
      assert.throws(
        () => priceCheckout(input, pricedMenu),
        (error) => error instanceof CheckoutValidationError && error.code === 'minimum',
      );
    else assert.equal(priceCheckout(input, pricedMenu)[0].priceMinor, priceMinor);
  }
});

void test('checkout requires a bounded address and preserves Bulgarian delivery details', () => {
  const input = checkoutFixture();
  assert.equal(parseCheckout({ ...input, address: `  ${input.address}  ` }).address, input.address);
  assert.equal(parseCheckout({ ...input, address: 'x'.repeat(300) }).address.length, 300);
  for (const address of [
    undefined,
    null,
    12,
    '',
    '     ',
    '1234',
    'x'.repeat(301),
    'Street\nForged line',
    'Street\x00',
  ])
    assert.throws(
      () => parseCheckout({ ...input, address }),
      (error) => error instanceof CheckoutValidationError && error.code === 'address',
    );
});

void test('delivery costs 1.50 euro below 20 euro, is free from 20 euro, and is part of the confirmed total', () => {
  assert.deepEqual(deliveryQuote(1199), {
    itemsMinor: 1199,
    deliveryMinor: 150,
    totalMinor: 1349,
    toMinimumMinor: 1,
    toFreeDeliveryMinor: 801,
  });
  assert.equal(deliveryQuote(1200).toMinimumMinor, 0);
  assert.equal(deliveryQuote(1999).totalMinor, 2149);
  assert.equal(deliveryQuote(2000).deliveryMinor, 0);
  assert.equal(deliveryQuote(2000).totalMinor, 2000);
  for (const [priceMinor, expectedTotalMinor] of [
    [1999, 2149],
    [2000, 2000],
    [2001, 2001],
  ]) {
    const pricedMenu = structuredClone(menu);
    const item = pricedMenu.flatMap((category) => category.items).find((dish) => dish.id === 'pizza-1')!;
    item.variants.find((variant) => variant.id === '33')!.priceMinor = priceMinor;
    const lines = [{ itemId: 'pizza-1', variantId: '33', quantity: 1 }];
    assert.equal(
      priceCheckout(parseCheckout({ ...checkoutFixture(), lines, expectedTotalMinor }), pricedMenu).length,
      1,
    );
    // A client that shows a different delivery fee must reload before ordering.
    if (priceMinor < 2000)
      assert.throws(
        () => priceCheckout(parseCheckout({ ...checkoutFixture(), lines, expectedTotalMinor: priceMinor }), pricedMenu),
        (error) => error instanceof CheckoutValidationError && error.code === 'changed',
      );
  }
});

void test('expired lunch cannot be submitted even when a client retains an old cart', () => {
  const input = parseCheckout({
    ...checkoutFixture(),
    lines: [{ itemId: lunchWeek!.items[0].id, variantId: 'regular', quantity: 5 }],
    expectedTotalMinor: 1850,
  });
  assert.equal(priceCheckout(input, orderingMenu(menu, lunchWeek, { date: '2026-10-08', time: '12:00' })).length, 1);
  assert.throws(
    () => priceCheckout(input, orderingMenu(menu, lunchWeek, { date: '2026-10-13', time: '12:00' })),
    CheckoutValidationError,
  );
});

void test('notifications use only fixed server destinations and preserve Unicode and special characters', async () => {
  const message = '2 × Пица & паста + бележка\nБез лук';
  let calls = 0;
  const send: typeof fetch = async (input, init) => {
    calls++;
    const url = new URL(String(input));
    if (url.hostname === 'api.callmebot.com') {
      assert.equal(url.searchParams.get('phone'), '+359888111222');
      assert.equal(url.searchParams.get('text'), message);
      assert.equal(init?.redirect, 'manual');
      return new Response('Message queued');
    }
    assert.equal(url.hostname, 'api.telegram.org');
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body, { chat_id: 'test-chat', text: message });
    return Response.json({ ok: true });
  };
  const results = await notifyOwner(
    {
      CALLMEBOT_PHONE: '+359888111222',
      CALLMEBOT_API_KEY: 'test-key',
      TELEGRAM_BOT_TOKEN: 'test-token',
      TELEGRAM_CHAT_ID: 'test-chat',
    },
    message,
    send,
  );
  assert.equal(calls, 2);
  assert.ok(results.every((result) => result.status === 'accepted'));
});

void test('provider failures and ambiguous success responses are never reported as delivery', async () => {
  const config = { CALLMEBOT_PHONE: '+359888111222', CALLMEBOT_API_KEY: 'test-key' };
  for (const [body, expected] of [
    ['ERROR: not activated', 'failed'],
    ['<html>maintenance</html>', 'unknown'],
    ['x'.repeat(17000), 'unknown'],
  ]) {
    const results = await notifyOwner(config, 'test', async () => new Response(body));
    assert.equal(results[0].status, expected);
  }
  assert.deepEqual(
    await notifyOwner({}, 'test', async () => {
      throw new Error('must not send');
    }),
    [],
  );
  assert.equal(
    (
      await notifyOwner(config, 'test', async () => {
        throw new Error('timeout');
      })
    )[0].status,
    'unknown',
  );
});
