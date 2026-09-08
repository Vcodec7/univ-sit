/**
 * Public HTTPS health must not leak version/db. Loopback (deploy scripts) still gets the full payload.
 */
export function isPublicHealthRequest(req: { headers: { get(name: string): string | null } }) {
  return req.headers.get('x-forwarded-proto') === 'https';
}
