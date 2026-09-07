/** Touch, save-data, or reduced-motion: skip GPU loops. Do not use max-width —
 * shrinking a desktop window must not unmount the sky / moon. */
export function isLiteMotionDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = (q: string) => window.matchMedia(q).matches;
  if (mq('(pointer: coarse)') || mq('(prefers-reduced-motion: reduce)')) {
    return true;
  }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

/** Hero video: still poster on phones and narrow frames. */
export function preferStillHeroVideo(): boolean {
  if (typeof window === 'undefined') return true;
  if (isLiteMotionDevice()) return true;
  return window.matchMedia('(max-width: 900px)').matches;
}
