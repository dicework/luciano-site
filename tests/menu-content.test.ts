import { test } from 'node:test';
import assert from 'node:assert/strict';
import menuContent from '../content/menu.json' with { type: 'json' };
import lunchContent from '../content/lunch.json' with { type: 'json' };
import { parseMenu, parseLunchWeek } from '../lib/menu-content.ts';
import { priceCheckout } from '../lib/checkout.ts';
import { localizeMenu } from '../i18n/content.ts';

void test('Pages CMS price, photo and translation edits feed the menu and checkout together', () => {
  const raw = structuredClone(menuContent);
  const item = { ...raw.categories[0].items[0], nameEn: 'Owner-edited pizza' };
  item.variants[1].price = '8.15';
  item.image = '/images/menu/new-photo.webp';
  raw.categories[0].items[0] = item;
  const menu = parseMenu(raw);
  assert.equal(menu[0].items[0].image, '/images/menu/new-photo.webp');
  assert.equal(localizeMenu(menu, 'en')[0].items[0].name, 'Owner-edited pizza');
  const input = {
    requestId: crypto.randomUUID(),
    name: 'Test Guest',
    phone: '+359888123456',
    address: 'Варна, ул. Тестова 12',
    notes: '',
    locale: 'bg' as const,
    lines: [{ itemId: item.id, variantId: item.variants[1].id, quantity: 1 }],
    expectedTotalMinor: 780,
  };
  assert.throws(() => priceCheckout(input, menu), /changed/);
  assert.equal(priceCheckout({ ...input, expectedTotalMinor: 815 }, menu)[0].priceMinor, 815);
  raw.categories[0].items[0].available = false;
  assert.throws(() => priceCheckout({ ...input, expectedTotalMinor: 815 }, parseMenu(raw)));
});

void test('invalid editable prices, photos, IDs and portions cannot enter the ordering menu', () => {
  for (const price of [0, -1, 1.001, NaN, Infinity, 1000.01]) {
    const raw = structuredClone(menuContent);
    Object.assign(raw.categories[0].items[0].variants[0], { price });
    assert.throws(() => parseMenu(raw));
  }
  for (const image of ['https://example.com/photo.jpg', '/images/menu/../secret.jpg', '/images/menu/file.svg']) {
    const raw = structuredClone(menuContent);
    raw.categories[0].items[0].image = image;
    assert.throws(() => parseMenu(raw));
  }
  const duplicate = structuredClone(menuContent);
  duplicate.categories[1].items[0].id = duplicate.categories[0].items[0].id;
  assert.throws(() => parseMenu(duplicate));
  const empty = structuredClone(menuContent);
  empty.categories[0].items[0].variants = [];
  assert.throws(() => parseMenu(empty));
});

void test('CMS decimal text supports dot and comma prices without accepting malformed amounts', () => {
  const withPrice = (price: unknown) => ({
    categories: [
      {
        ...menuContent.categories[0],
        items: [
          {
            ...menuContent.categories[0].items[0],
            variants: [{ ...menuContent.categories[0].items[0].variants[0], price }],
          },
        ],
      },
    ],
  });
  for (const price of ['7.80', '7,80', ' 7,80 '])
    assert.equal(parseMenu(withPrice(price))[0].items[0].variants[0].priceMinor, 780);
  for (const price of ['', ' ', '0', '0,00', '-1', '7.801', '7,801', '1e2', '0x10', '7,8.0', '1000,01', null, true])
    assert.throws(() => parseMenu(withPrice(price)));
});

void test('lunch schedule changes expire old cart identities and disabled menus are unavailable', () => {
  const raw = structuredClone(lunchContent);
  const first = parseLunchWeek(raw)!;
  raw.validFrom = '2026-10-19';
  raw.validUntil = '2026-10-23';
  const second = parseLunchWeek(raw)!;
  assert.notEqual(first.items[0].id, second.items[0].id);
  assert.deepEqual(second.weekdays, [1, 2, 3, 4, 5]);
  assert.equal(second.items[0].variants[0].priceMinor, 340);
  assert.equal(parseLunchWeek({ ...raw, enabled: false }), null);
  for (const changed of [
    { validFrom: '2026-02-30' },
    { validUntil: '2026-10-18' },
    { weekdays: [] },
    { weekdays: ['1', '1'] },
    { hours: { from: '15:00', until: '11:00' } },
    { hours: { from: '25:00', until: '26:00' } },
  ])
    assert.throws(() => parseLunchWeek({ ...raw, ...changed }));
});

void test('CMS-generated IDs support new entries while preserving imported cart identities', () => {
  const category = menuContent.categories[0];
  const item = category.items[0];
  const variant = item.variants[0];
  const cmsId = crypto.randomUUID();
  const raw = {
    categories: [{ ...category, cmsId, items: [{ ...item, cmsId, variants: [{ ...variant, cmsId }] }] }],
  };
  const imported = parseMenu(raw)[0];
  assert.equal(imported.id, category.id);
  assert.equal(imported.items[0].id, item.id);
  assert.equal(imported.items[0].variants[0].id, variant.id);
  raw.categories[0].id = '';
  raw.categories[0].items[0].id = '';
  raw.categories[0].items[0].variants[0].id = '';
  const added = parseMenu(raw)[0];
  assert.equal(added.id, cmsId);
  assert.equal(added.items[0].id, cmsId);
  assert.equal(added.items[0].variants[0].id, cmsId);
  raw.categories[0].items.push(structuredClone(raw.categories[0].items[0]));
  assert.throws(() => parseMenu(raw), /duplicate/);
});
