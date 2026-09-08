import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { APP_VERSION } from '@/lib/app-version';
import { isDetailedHealthRequest } from '@/lib/health-access';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const started = Date.now();
  const detailed = isDetailedHealthRequest(req);
  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: { siteName: true, maintenanceMode: true },
    });
    const maintenanceMode = Boolean(settings?.maintenanceMode);
    if (!detailed) {
      return NextResponse.json(
        { status: 'ok' },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        status: 'ok',
        db: true,
        version: APP_VERSION,
        maintenanceMode,
        siteName: settings?.siteName || null,
        uptimeSec: Math.floor(process.uptime()),
        latencyMs: Date.now() - started,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    if (!detailed) {
      return NextResponse.json(
        { status: 'error' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        db: false,
        version: APP_VERSION,
        error: 'db_unavailable',
        latencyMs: Date.now() - started,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
