import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { requestReference } from '../lib/server/request-reference.ts';

void test('number migration preserves existing requests and never reuses numbers after request deletion', async (t) => {
  const runtime = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } };',
    d1Databases: ['DB'],
    cf: false,
  });
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database('DB');
  const apply = async (file: string) => {
    for (const sql of readFileSync('drizzle/' + file, 'utf8').split('--> statement-breakpoint'))
      await db.prepare(sql.trim()).run();
  };
  const migration = '0004_short_request_numbers.sql';
  for (const file of readdirSync('drizzle')
    .filter((name) => name.endsWith('.sql') && name < migration)
    .sort())
    await apply(file);
  const sharedId = crypto.randomUUID();
  const payload = JSON.stringify({ name: 'Existing request', status: 'awaiting_confirmation' });
  const notification = JSON.stringify([{ channel: 'telegram', status: 'accepted' }]);
  const insertOrder = (id: string) =>
    db
      .prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, 'hash', 1, 'ip', 'phone', payload, notification)
      .run();
  await insertOrder(sharedId);
  await db
    .prepare('INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(sharedId, 'hash', 2, 'ip', 'phone', payload, notification)
    .run();
  const before = await db.prepare('SELECT * FROM orders').all();
  const reservationsBefore = await db.prepare('SELECT * FROM reservations').all();
  await apply(migration);
  assert.deepEqual((await db.prepare('SELECT * FROM orders').all()).results, before.results);
  assert.deepEqual((await db.prepare('SELECT * FROM reservations').all()).results, reservationsBefore.results);
  assert.deepEqual((await db.prepare('SELECT kind, number FROM request_references ORDER BY number').all()).results, [
    { kind: 'order', number: 1 },
    { kind: 'reservation', number: 2 },
  ]);
  await db.prepare('DELETE FROM orders').run();
  await db.prepare('DELETE FROM reservations').run();
  await Promise.all([insertOrder(crypto.randomUUID()), insertOrder(crypto.randomUUID())]);
  const numbers = (
    await db.prepare('SELECT number FROM request_references ORDER BY number').all<{ number: number }>()
  ).results.map((row) => row.number);
  assert.deepEqual(numbers, [1, 2, 3, 4]);
  assert.equal(requestReference('order', 1), 'P-000001');
  assert.equal(requestReference('reservation', 2), 'R-000002');
  assert.equal(requestReference('order', 1000000), 'P-1000000');
  assert.throws(() => requestReference('order', 0));
});
