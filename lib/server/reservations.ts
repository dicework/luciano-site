import { validateReservation, reservationMessage, type Reservation } from '../order.ts';
import { boundedText, notificationChannels, notifyOwner, type NotificationResult } from './notifications.ts';
import { json, sameOrigin, digest } from './http.ts';
import type { RestaurantEnv } from './env.ts';
import { requestReference } from './request-reference.ts';

type Saved = { id: string; number: number; payload_hash: string; notification_json: string };
const receipt = (row: Saved) => ({
  reference: requestReference('reservation', row.number),
  notified: (JSON.parse(row.notification_json) as NotificationResult[]).some((n) => n.status === 'accepted'),
});

export function reservationsEnabled(env: RestaurantEnv) {
  return (
    (env.RESERVATIONS_ENABLED ?? env.ORDERS_ENABLED) === 'true' && Boolean(env.DB) && notificationChannels(env).telegram
  );
}

export async function submitReservation(
  request: Request,
  env: RestaurantEnv,
  send: typeof fetch = fetch,
  now = new Date(),
) {
  if (request.method !== 'POST') return json({ error: 'invalid' }, 405);
  if (!sameOrigin(request)) return json({ error: 'invalid' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'invalid' }, 415);
  if (!reservationsEnabled(env) || !env.DB) return json({ error: 'unavailable' }, 503);
  try {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(await boundedText(request));
    } catch {
      return json({ error: 'invalid' }, 400);
    }
    if (
      !raw ||
      typeof raw !== 'object' ||
      !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(String(raw.requestId)) ||
      !['bg', 'en'].includes(String(raw.locale)) ||
      typeof raw.guests !== 'number' ||
      ['name', 'phone', 'address', 'date', 'time', 'notes'].some((key) => typeof raw[key] !== 'string')
    )
      return json({ error: 'invalid' }, 400);
    const input: Reservation = {
      name: (raw.name as string).trim(),
      phone: (raw.phone as string).trim(),
      address: (raw.address as string).trim(),
      date: raw.date as string,
      time: raw.time as string,
      guests: raw.guests,
      notes: (raw.notes as string).trim(),
    };
    if (
      input.name.length > 80 ||
      input.phone.length > 20 ||
      input.notes.length > 500 ||
      (raw.address as string).length > 300 ||
      // eslint-disable-next-line no-control-regex -- Reject control characters before trimming the address.
      /[\x00-\x1f\x7f]/.test(raw.address as string) ||
      /[\u0000-\u001f]/.test(input.name + input.phone)
    )
      return json({ error: 'invalid' }, 400);
    const hash = await digest(JSON.stringify({ ...input, locale: raw.locale }));
    const find = () =>
      env
        .DB!.prepare(
          `SELECT reservations.id, refs.number, reservations.payload_hash, reservations.notification_json
          FROM reservations JOIN request_references refs ON refs.kind = 'reservation' AND refs.request_id = reservations.id
          WHERE reservations.id = ?`,
        )
        .bind(raw.requestId)
        .first<Saved>();
    const existing = await find();
    if (existing) return existing.payload_hash === hash ? json(receipt(existing)) : json({ error: 'conflict' }, 409);
    const error = validateReservation(input, now, raw.locale as 'bg' | 'en');
    if (error) return json({ error: 'invalid', message: error }, 400);
    const createdAt = now.getTime();
    const abuseKey = await digest(
      request.headers.get('cf-connecting-ip') ?? request.headers.get('oai-authenticated-user-id') ?? 'local',
    );
    const phoneHash = await digest(input.phone.replace(/\D/g, ''));
    const inserted = await env.DB.prepare(
      `INSERT INTO reservations (id, payload_hash, created_at, abuse_key, phone_hash, reservation_json)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM reservations WHERE (abuse_key = ? OR phone_hash = ?) AND created_at > ?) < 3
      AND (SELECT COUNT(*) FROM reservations WHERE (abuse_key = ? OR phone_hash = ?) AND created_at > ?) < 10
      ON CONFLICT(id) DO NOTHING RETURNING id`,
    )
      .bind(
        raw.requestId,
        hash,
        createdAt,
        abuseKey,
        phoneHash,
        JSON.stringify({ ...input, locale: raw.locale, status: 'awaiting_confirmation' }),
        abuseKey,
        phoneHash,
        createdAt - 60000,
        abuseKey,
        phoneHash,
        createdAt - 3600000,
      )
      .first();
    if (!inserted) {
      const concurrent = await find();
      return (
        concurrent ?
          concurrent.payload_hash === hash ?
            json(receipt(concurrent))
          : json({ error: 'conflict' }, 409)
        : json({ error: 'limited' }, 429)
      );
    }
    const saved = await find();
    if (!saved) throw new Error('Saved reservation reference is missing');
    const reference = requestReference('reservation', saved.number);
    const notifications = await notifyOwner(
      { TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID },
      `Ново запитване за резервация · № ${reference}\n${reservationMessage(input, 'bg')}`,
      send,
    );
    await env.DB.prepare('UPDATE reservations SET notification_json = ? WHERE id = ?')
      .bind(JSON.stringify(notifications), raw.requestId)
      .run();
    return json({ reference, notified: notifications.some((n) => n.status === 'accepted') }, 201);
  } catch {
    console.error(JSON.stringify({ event: 'reservation_submission_failed' }));
    return json({ error: 'unavailable' }, 503);
  }
}
