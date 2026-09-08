/** Edge-safe fixed window (middleware / proxy). Not shared across isolates. */
const buckets = new Map<string, { n: number; exp: number }>();

export function edgeRateAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 8000) {
    for (const [k, v] of buckets) {
      if (now > v.exp) buckets.delete(k);
    }
  }
  const row = buckets.get(key);
  if (!row || now > row.exp) {
    buckets.set(key, { n: 1, exp: now + windowMs });
    return true;
  }
  if (row.n >= max) return false;
  row.n += 1;
  return true;
}

export function clientIp(req: { headers: { get(name: string): string | null } }) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}
