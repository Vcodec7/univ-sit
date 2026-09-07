import { NextResponse } from 'next/server';
import { isLoopbackHealthRequest } from '@/lib/health-access';
import { buildHealthPayload, healthResponseHeaders } from '@/lib/health-payload';

export const dynamic = 'force-dynamic';

/** Same as loopback /api/health. 404 when requested through nginx. */
export async function GET(req: Request) {
  if (!isLoopbackHealthRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const { status, body } = await buildHealthPayload(true);
  return NextResponse.json(body, { status, headers: healthResponseHeaders(true) });
}
