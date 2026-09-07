import { NextResponse } from 'next/server';
import { isLoopbackHealthRequest } from '@/lib/health-access';
import { buildHealthPayload, healthResponseHeaders } from '@/lib/health-payload';

export const dynamic = 'force-dynamic';

/** Public HTTPS: {ok, maintenanceMode}. Loopback: version + db. Docker uses r.ok. */
export async function GET(req: Request) {
  const detail = isLoopbackHealthRequest(req);
  const { status, body } = await buildHealthPayload(detail);
  return NextResponse.json(body, { status, headers: healthResponseHeaders(detail) });
}
