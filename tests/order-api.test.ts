import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { submitOrder } from '../lib/server/orders.ts';

void test('order API saves before notifying, handles concurrent retries, validates prices, and limits requests', async (t) => {
  const runtime = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } };',
    d1Databases: ['DB'],
    cf: false,
  });
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database('DB');
  const migration = readFileSync(new URL('../drizzle/0000_outstanding_captain_universe.sql', import.meta.url), 'utf8');
  for (const sql of migration.split('--> statement-breakpoint')) await db.prepare(sql.trim()).run();
  const env: Cloudflare.Env = {
    DB: db,
    ORDERS_ENABLED: 'true',
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_CHAT_ID: 'test-owner',
  };
  const fixture = () => ({
    requestId: crypto.randomUUID(),
    name: 'Test Customer',
    phone: '+359888123456',
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
    const reference = /[\da-f]{8}-[\da-f-]{27}/.exec(body.text)?.[0];
    assert.ok(reference);
    const saved = await db
      .prepare('SELECT order_json FROM orders WHERE id = ?')
      .bind(reference)
      .first<{ order_json: string }>();
    assert.ok(saved, 'order must be saved before notification');
    assert.equal(JSON.parse(saved.order_json).totalMinor, 1560);
    return Response.json({ ok: true });
  };

  const data = fixture();
  const responses = await Promise.all(Array.from({ length: 3 }, () => submitOrder(request(data), env, send)));
  assert.equal(calls, 1, 'concurrent retries send once');
  assert.ok(responses.every((response) => response.ok));
  const replay = await submitOrder(request(data), env, send);
  assert.deepEqual(await replay.json(), { reference: data.requestId, notified: true });
  assert.equal(calls, 1);
  assert.equal((await submitOrder(request({ ...data, notes: 'changed' }), env, send)).status, 409);
  assert.equal((await submitOrder(request(fixture(), 'https://other.test'), env, send)).status, 403);
  assert.equal((await submitOrder(request(fixture()), { ...env, ORDERS_ENABLED: 'false' }, send)).status, 503);
  assert.equal((await submitOrder(request({ ...fixture(), expectedTotalMinor: 1 }), env, send)).status, 400);
  assert.equal(calls, 1);

  const failed = fixture();
  const failedResponse = await submitOrder(request(failed), env, async () => {
    throw new Error('simulated network failure');
  });
  assert.equal(failedResponse.status, 201);
  assert.deepEqual(await failedResponse.json(), { reference: failed.requestId, notified: false });
  await submitOrder(request(failed), env, send);
  assert.equal(calls, 1, 'an ambiguous provider failure must not be automatically resent');
  for (let index = 0; index < 3; index++) assert.equal((await submitOrder(request(fixture()), env, send)).status, 201);
  assert.equal((await submitOrder(request(fixture()), env, send)).status, 429);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM orders').first<{ count: number }>();
  assert.equal(count?.count, 5);
});
