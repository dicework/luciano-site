import { menu } from '../../content/menu.ts';
import { lunchWeek } from '../../content/lunch.ts';
import { CheckoutValidationError, parseCheckout, priceCheckout, type OrderReceipt } from '../checkout.ts';
import { orderingMenu } from '../lunch.ts';
import { money, orderTotal, sofiaDateTime } from '../order.ts';
import { boundedText, notificationChannels, notifyOwner, type NotificationResult } from './notifications.ts';

type SavedOrder = { id: string; payload_hash: string; notification_json: string };

export function ordersEnabled(env: Cloudflare.Env) {
  const channels = notificationChannels(env);
  return env.ORDERS_ENABLED === 'true' && Boolean(env.DB) && (channels.whatsapp || channels.telegram);
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
}
function receipt(row: SavedOrder): OrderReceipt {
  const notifications = JSON.parse(row.notification_json) as NotificationResult[];
  return { reference: row.id, notified: notifications.some((result) => result.status === 'accepted') };
}
async function digest(text: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Destinations and credentials are read only from runtime configuration.
export async function submitOrder(request: Request, env: Cloudflare.Env, send: typeof fetch = fetch, now = new Date()) {
  if (request.method !== 'POST') return json({ error: 'invalid' }, 405);
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return json({ error: 'invalid' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'invalid' }, 415);
  if (!ordersEnabled(env) || !env.DB) return json({ error: 'unavailable' }, 503);

  try {
    let raw: unknown;
    try {
      raw = JSON.parse(await boundedText(request));
    } catch {
      return json({ error: 'invalid' }, 400);
    }
    const input = parseCheckout(raw);
    const hash = await digest(JSON.stringify(input));
    const findOrder = () =>
      env
        .DB!.prepare('SELECT id, payload_hash, notification_json FROM orders WHERE id = ?')
        .bind(input.requestId)
        .first<SavedOrder>();
    const existing = await findOrder();
    if (existing) return existing.payload_hash === hash ? json(receipt(existing)) : json({ error: 'conflict' }, 409);

    // Validate against today's server-side menu, including Sofia lunch hours.
    const lines = priceCheckout(input, orderingMenu(menu, lunchWeek, sofiaDateTime(now)));
    const totalMinor = orderTotal(lines);
    const message = [
      `Нова поръчка · Лучиано · ${input.requestId}`,
      `Име: ${input.name}`,
      `Телефон: ${input.phone}`,
      ...lines.map(
        (line) => `${line.quantity} × ${line.name} (${line.variantLabel}) — ${money(line.quantity * line.priceMinor)}`,
      ),
      `Общо: ${money(totalMinor)}`,
      input.notes ? `Бележка: ${input.notes}` : '',
      'Моля, свържете се с клиента за потвърждение и получаване.',
    ]
      .filter(Boolean)
      .join('\n');
    if (message.length > 3900) return json({ error: 'items' }, 400);
    const createdAt = now.getTime();
    const abuseKey = await digest(
      request.headers.get('cf-connecting-ip') ?? request.headers.get('oai-authenticated-user-id') ?? 'local',
    );
    const phoneHash = await digest(input.phone.replace(/\D/g, ''));
    const data = JSON.stringify({
      name: input.name,
      phone: input.phone,
      notes: input.notes,
      locale: input.locale,
      lines,
      totalMinor,
      status: 'awaiting_confirmation',
    });

    // One atomic insert enforces idempotency and request limits across isolates.
    const inserted = await env.DB.prepare(
      `INSERT INTO orders (id, payload_hash, created_at, abuse_key, phone_hash, order_json)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM orders WHERE (abuse_key = ? OR phone_hash = ?) AND created_at > ?) < 5
        AND (SELECT COUNT(*) FROM orders WHERE (abuse_key = ? OR phone_hash = ?) AND created_at > ?) < 20
      ON CONFLICT(id) DO NOTHING RETURNING id`,
    )
      .bind(
        input.requestId,
        hash,
        createdAt,
        abuseKey,
        phoneHash,
        data,
        abuseKey,
        phoneHash,
        createdAt - 60_000,
        abuseKey,
        phoneHash,
        createdAt - 3_600_000,
      )
      .first<{ id: string }>();
    if (!inserted) {
      const concurrent = await findOrder();
      if (concurrent)
        return concurrent.payload_hash === hash ? json(receipt(concurrent)) : json({ error: 'conflict' }, 409);
      return json({ error: 'limited' }, 429);
    }

    // The order is durable before contacting providers. Never retry an ambiguous
    // provider response automatically: that can send duplicate order alerts.
    const notifications = await notifyOwner(env, message, send);
    await env.DB.prepare('UPDATE orders SET notification_json = ? WHERE id = ?')
      .bind(JSON.stringify(notifications), input.requestId)
      .run();
    return json(
      {
        reference: input.requestId,
        notified: notifications.some((result) => result.status === 'accepted'),
      } satisfies OrderReceipt,
      201,
    );
  } catch (error) {
    if (error instanceof CheckoutValidationError) return json({ error: error.code }, 400);
    console.error(JSON.stringify({ event: 'order_submission_failed' }));
    return json({ error: 'unavailable' }, 503);
  }
}
