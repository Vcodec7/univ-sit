/**
 * Public HTTPS (and any proxied) health must not leak version/db.
 * Full payload: loopback without X-Forwarded-For, or HEALTH_MONITOR_TOKEN.
 */
export function isDetailedHealthRequest(req: { headers: { get(name: string): string | null } }) {
  const token = (process.env.HEALTH_MONITOR_TOKEN || process.env.CRON_SECRET || '').trim();
  const given = (
    req.headers.get('x-yp-health-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  ).trim();
  if (token && given && given === token) return true;

  const forwarded = Boolean(
    req.headers.get('x-forwarded-for') ||
      req.headers.get('x-forwarded-proto') ||
      req.headers.get('x-real-ip')
  );
  if (forwarded) return false;

  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/** @deprecated use isDetailedHealthRequest — public is the default */
export function isPublicHealthRequest(req: { headers: { get(name: string): string | null } }) {
  return !isDetailedHealthRequest(req);
}
