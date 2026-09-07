/** Phone, touch, save-data, or reduced-motion: skip GPU loops and autoplay video. */
export function isLiteMotionDevice(): boolean {
  if (typeof window === 'undefined') return true;
  const mq = (q: string) => window.matchMedia(q).matches;
  if (mq('(max-width: 900px)') || mq('(pointer: coarse)') || mq('(prefers-reduced-motion: reduce)')) {
    return true;
  }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}
