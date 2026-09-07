/** Loopback probes (Docker / SSH) may see version+db. Public HTTPS via nginx must not. */
export function isLoopbackHealthRequest(req: Request): boolean {
  const host = (req.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  const hostname = host
    .replace(/^\[/, '')
    .replace(/\]:\d+$/, '')
    .replace(/:\d+$/, '');
  /* Host 127.0.0.1:3001 is the VPS probe even if a proxy adds X-Forwarded-*. */
  if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') return true;
  return false;
}
