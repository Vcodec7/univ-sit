/**
 * Cron HTTP auth: header only. Query ?secret= is rejected (logs, Referer, history).
 */
export function cronSecretFromRequest(req: Request): string {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (bearer) return bearer;
  return (req.headers.get('x-cron-secret') || '').trim();
}

export function cronAuthorized(req: Request): boolean {
  const expected = (process.env.CRON_SECRET || '').trim();
  const given = cronSecretFromRequest(req);
  return Boolean(expected && given && given === expected);
}
