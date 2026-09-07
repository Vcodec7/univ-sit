/** Loopback probes (Docker / SSH) may see version+db. Public HTTPS via nginx must not. */
export function isLoopbackHealthRequest(req: Request): boolean {
  const xfProto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  /* nginx terminates TLS and always sends X-Forwarded-Proto: https */
  if (xfProto === 'https') return false;

  const host = (req.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  const hostname = host
    .replace(/^\[/, '')
    .replace(/\]:\d+$/, '')
    .replace(/:\d+$/, '');
  if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1' || !hostname) return true;
  if (!xfProto) return true;
  return false;
}
