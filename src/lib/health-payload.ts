import { prisma } from '@/lib/prisma';
import { APP_VERSION } from '@/lib/app-version';

export async function buildHealthPayload(detail: boolean) {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: { siteName: true, maintenanceMode: true },
    });
    const maintenanceMode = Boolean(settings?.maintenanceMode);
    if (!detail) {
      return { status: 200 as const, body: { ok: true as const, maintenanceMode } };
    }
    return {
      status: 200 as const,
      body: {
        ok: true as const,
        db: true,
        version: APP_VERSION,
        maintenanceMode,
        siteName: settings?.siteName || null,
        uptimeSec: Math.floor(process.uptime()),
        latencyMs: Date.now() - started,
      },
    };
  } catch {
    if (!detail) {
      return { status: 503 as const, body: { ok: false as const } };
    }
    return {
      status: 503 as const,
      body: {
        ok: false as const,
        db: false,
        version: APP_VERSION,
        error: 'db_unavailable',
        latencyMs: Date.now() - started,
      },
    };
  }
}

export function healthResponseHeaders(detail: boolean) {
  const h: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (detail) h['X-YP-Version'] = APP_VERSION;
  return h;
}
