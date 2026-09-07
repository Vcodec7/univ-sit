/** Loopback probes (Docker / SSH) may see version+db. Public HTTPS via nginx must not. */
export function isLoopbackHealthRequest(req: Request): boolean {
  const xff = (req.headers.get('x-forwarded-for') || '').trim();
  if (xff) return false;
  const xfp = (req.headers.get('x-forwarded-proto') || '').trim();
  if (xfp) return false;
  const host = (req.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  const hostname = host.replace(/:\d+$/, '');
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}
