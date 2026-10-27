import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { submitReservation } from '../lib/server/reservations.ts';
import type { RestaurantEnv } from '../lib/server/env.ts';

void test('reservations use the existing Telegram recipient, persist before delivery, deduplicate and validate', async (t) => {
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
    TELEGRAM_CHAT_ID: 'same-owner',
    CALLMEBOT_PHONE: '+359888123456',
    CALLMEBOT_API_KEY: 'unused',
  };
  const now = new Date('2026-10-13T12:00:00Z');
  const fixture = () => ({
    requestId: crypto.randomUUID(),
    name: 'Test Guest',
    phone: '+359888123456',
    address: 'Варна, ул. Тестова 12',
    date: '2026-10-14',
    time: '19:00',
    guests: 3,
    notes: 'Window table',
    locale: 'en',
  });
  const request = (data: unknown, origin = 'https://restaurant.test') =>
    new Request('https://restaurant.test/api/reservations/', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
      body: JSON.stringify(data),
    });
  let calls = 0;
  const send: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(String(url), 'https://api.telegram.org/bottest-token/sendMessage');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.chat_id, 'same-owner');
    assert.match(body.text, /Ново запитване за резервация/);
    assert.match(body.text, /19:00/);
    assert.ok(body.text.includes(`Адрес: ${fixture().address}`));
    const reference = /\bR-(\d+)\b/.exec(body.text);
    assert.ok(reference);
    assert.doesNotMatch(body.text, /[\da-f]{8}-[\da-f-]{27}/i);
    const saved = await db
      .prepare(
        `SELECT reservation_json FROM reservations JOIN request_references refs
        ON refs.kind = 'reservation' AND refs.request_id = reservations.id WHERE refs.number = ?`,
      )
      .bind(Number(reference[1]))
      .first<{ reservation_json: string }>();
    assert.ok(saved, 'must persist before notification');
    assert.equal(JSON.parse(saved.reservation_json).status, 'awaiting_confirmation');
    assert.equal(JSON.parse(saved.reservation_json).address, fixture().address);
    return Response.json({ ok: true });
  };
  const data = { ...fixture(), address: `  ${fixture().address}  ` };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () => submitReservation(request(data), env, send, now)),
  );
  assert.ok(responses.every((r) => r.ok));
  const receipts = await Promise.all(responses.map((response) => response.json()));
  for (const receipt of receipts) {
    assert.ok(receipt && typeof receipt === 'object' && 'reference' in receipt);
    assert.equal(receipt.reference, 'R-000001');
  }
  assert.equal(calls, 1);
  assert.deepEqual(await (await submitReservation(request(data), env, send, now)).json(), {
    reference: 'R-000001',
    notified: true,
  });
  assert.equal((await submitReservation(request({ ...data, guests: 4 }), env, send, now)).status, 409);
  assert.equal(
    (await submitReservation(request({ ...data, address: 'Different street 2' }), env, send, now)).status,
    409,
  );
  for (const field of ['name', 'phone', 'address']) {
    for (const value of [undefined, null, 12, '', '       ']) {
      assert.equal(
        (await submitReservation(request({ ...fixture(), [field]: value }), env, send, now)).status,
        400,
        `${field} must contain a valid value`,
      );
    }
  }
  for (const changes of [
    { guests: 31 },
    { guests: '2' },
    { date: '2026-10-12' },
    { date: '2026-02-30' },
    { time: '23:00' },
    { name: 'x'.repeat(81) },
    { phone: 'invalid' },
    { address: '1234' },
    { address: 'x'.repeat(301) },
    { address: 'Street\nForged line' },
    { address: 'Street\x00' },
    { address: '\nStreet 12' },
    { notes: 'x'.repeat(501) },
  ]) {
    assert.equal((await submitReservation(request({ ...fixture(), ...changes }), env, send, now)).status, 400);
  }
  assert.equal(calls, 1, 'invalid requests must not notify the owner');
  assert.deepEqual(await db.prepare('SELECT COUNT(*) AS count FROM reservations').first(), { count: 1 });
  assert.equal((await submitReservation(request(fixture(), 'https://evil.test'), env, send, now)).status, 403);
  assert.equal(
    (await submitReservation(request(fixture()), { ...env, TELEGRAM_CHAT_ID: undefined }, send, now)).status,
    503,
  );
  const failed = fixture();
  assert.deepEqual(
    await (
      await submitReservation(
        request(failed),
        env,
        async () => {
          throw new Error('timeout');
        },
        now,
      )
    ).json(),
    { reference: 'R-000002', notified: false },
  );
  await submitReservation(request(failed), env, send, now);
  assert.equal(calls, 1, 'no duplicate alert after ambiguous provider failure');
  assert.equal((await submitReservation(request(fixture()), env, send, now)).status, 201);
  assert.equal((await submitReservation(request(fixture()), env, send, now)).status, 429);
});
