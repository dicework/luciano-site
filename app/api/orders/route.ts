import { env } from 'cloudflare:workers';
import { ordersEnabled, submitOrder } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ available: ordersEnabled(env) }, { headers: { 'Cache-Control': 'no-store' } });
}

export function POST(request: Request) {
  return submitOrder(request, env);
}
