import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { submitReservation } from '../lib/server/reservations.ts';

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
  const env: Cloudflare.Env = {
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
    const id = /[\da-f]{8}-[\da-f-]{27}/.exec(body.text)?.[0];
    assert.ok(id);
    const saved = await db
      .prepare('SELECT reservation_json FROM reservations WHERE id = ?')
      .bind(id)
      .first<{ reservation_json: string }>();
    assert.ok(saved, 'must persist before notification');
    assert.equal(JSON.parse(saved.reservation_json).status, 'awaiting_confirmation');
    return Response.json({ ok: true });
  };
  const data = fixture();
  const responses = await Promise.all(
    Array.from({ length: 3 }, () => submitReservation(request(data), env, send, now)),
  );
  assert.ok(responses.every((r) => r.ok));
  assert.equal(calls, 1);
  assert.deepEqual(await (await submitReservation(request(data), env, send, now)).json(), {
    reference: data.requestId,
    notified: true,
  });
  assert.equal((await submitReservation(request({ ...data, guests: 4 }), env, send, now)).status, 409);
  for (const changes of [
    { guests: 31 },
    { guests: '2' },
    { date: '2026-10-12' },
    { date: '2026-02-30' },
    { time: '23:00' },
    { name: 'x'.repeat(81) },
    { phone: 'invalid' },
    { notes: 'x'.repeat(501) },
  ]) {
    assert.equal((await submitReservation(request({ ...fixture(), ...changes }), env, send, now)).status, 400);
  }
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
    { reference: failed.requestId, notified: false },
  );
  await submitReservation(request(failed), env, send, now);
  assert.equal(calls, 1, 'no duplicate alert after ambiguous provider failure');
  assert.equal((await submitReservation(request(fixture()), env, send, now)).status, 201);
  assert.equal((await submitReservation(request(fixture()), env, send, now)).status, 429);
});
