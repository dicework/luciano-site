import { env } from 'cloudflare:workers';
import { reservationsEnabled, submitReservation } from '@/lib/server/reservations';
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ available: reservationsEnabled(env) }, { headers: { 'Cache-Control': 'no-store' } });
}
export function POST(request: Request) {
  return submitReservation(request, env);
}
