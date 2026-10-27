import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { submitOrder } from '../lib/server/orders.ts';
import type { RestaurantEnv } from '../lib/server/env.ts';

void test('order API saves before notifying, handles concurrent retries, validates prices, and limits requests', async (t) => {
  const runtime = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } };',
    d1Databases: ['DB'],
    cf: false,
  });
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database('DB');
  for (const file of readdirSync('drizzle')
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    for (const sql of readFileSync('drizzle/' + file, 'utf8').split('--> statement-breakpoint'))
      await db.prepare(sql.trim()).run();
  }
  const env: RestaurantEnv = {
    DB: db,
    ORDERS_ENABLED: 'true',
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: 'test-owner',
  };
  const fixture = () => ({
    requestId: crypto.randomUUID(),
    name: 'Test Customer',
    phone: '+359888123456',
    address: 'Варна, ул. Тестова 12, вх. А, ет. 2, ап. 3',
    notes: '',
    locale: 'en',
    lines: [{ itemId: 'pizza-1', variantId: '33', quantity: 2 }],
    expectedTotalMinor: 1560,
  });
  const request = (data: unknown, origin = 'https://restaurant.test') =>
    new Request('https://restaurant.test/api/orders/', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
      body: JSON.stringify(data),
    });
  let calls = 0;
  const send: typeof fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const reference = /\bP-(\d+)\b/.exec(body.text);
    assert.ok(reference);
    assert.doesNotMatch(body.text, /[\da-f]{8}-[\da-f-]{27}/i);
    const saved = await db
      .prepare(
        `SELECT order_json FROM orders JOIN request_references refs
        ON refs.kind = 'order' AND refs.request_id = orders.id WHERE refs.number = ?`,
      )
      .bind(Number(reference[1]))
      .first<{ order_json: string }>();
    assert.ok(saved, 'order must be saved before notification');
    assert.equal(JSON.parse(saved.order_json).totalMinor, 1560);
    assert.equal(JSON.parse(saved.order_json).address, fixture().address);
    assert.ok(body.text.includes(`Адрес за доставка: ${fixture().address}`));
    return Response.json({ ok: true });
  };

  const data = fixture();
  const responses = await Promise.all(Array.from({ length: 3 }, () => submitOrder(request(data), env, send)));
  assert.equal(calls, 1, 'concurrent retries send once');
  assert.ok(responses.every((response) => response.ok));
  const receipts = await Promise.all(responses.map((response) => response.json()));
  for (const receipt of receipts) {
    assert.ok(receipt && typeof receipt === 'object' && 'reference' in receipt);
    assert.equal(receipt.reference, 'P-000001');
  }
  const replay = await submitOrder(request(data), env, send);
  assert.deepEqual(await replay.json(), { reference: 'P-000001', notified: true });
  assert.equal(calls, 1);
  assert.equal((await submitOrder(request({ ...data, notes: 'changed' }), env, send)).status, 409);
  assert.equal((await submitOrder(request({ ...data, address: 'Different street 2' }), env, send)).status, 409);
  assert.equal((await submitOrder(request(fixture(), 'https://other.test'), env, send)).status, 403);
  assert.equal((await submitOrder(request(fixture()), { ...env, ORDERS_ENABLED: 'false' }, send)).status, 503);
  assert.equal((await submitOrder(request({ ...fixture(), expectedTotalMinor: 1 }), env, send)).status, 400);
  const missingAddress = await submitOrder(request({ ...fixture(), address: undefined }), env, send);
  assert.equal(missingAddress.status, 400);
  assert.deepEqual(await missingAddress.json(), { error: 'address' });
  for (const field of ['name', 'phone', 'address']) {
    for (const value of [undefined, null, 12, '', '       ']) {
      const invalid = await submitOrder(request({ ...fixture(), [field]: value }), env, send);
      assert.equal(invalid.status, 400, `${field} must contain a valid value`);
      assert.deepEqual(await invalid.json(), { error: field });
    }
  }
  assert.deepEqual(await db.prepare('SELECT COUNT(*) AS count FROM orders').first(), { count: 1 });
  assert.equal(calls, 1);

  const failed = fixture();
  const failedResponse = await submitOrder(request(failed), env, async () => {
    throw new Error('simulated network failure');
  });
  assert.equal(failedResponse.status, 201);
  assert.deepEqual(await failedResponse.json(), { reference: 'P-000002', notified: false });
  assert.deepEqual(await (await submitOrder(request(failed), env, send)).json(), {
    reference: 'P-000002',
    notified: false,
  });
  assert.equal(calls, 1, 'an ambiguous provider failure must not be automatically resent');
  for (let index = 0; index < 3; index++) assert.equal((await submitOrder(request(fixture()), env, send)).status, 201);
  assert.equal((await submitOrder(request(fixture()), env, send)).status, 429);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM orders').first<{ count: number }>();
  assert.equal(count?.count, 5);
  const references = await db
    .prepare('SELECT COUNT(*) AS count, COUNT(DISTINCT number) AS unique_count FROM request_references')
    .first<{ count: number; unique_count: number }>();
  assert.deepEqual(references, { count: 5, unique_count: 5 });
});
