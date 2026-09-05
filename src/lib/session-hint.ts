/** First-paint hint so header/dock width matches auth before NextAuth hydrates. */

export const SESSION_HINT_KEY = 'yp-session';

export function persistSessionHint(on: boolean) {
  if (typeof document === 'undefined') return;
  try {
    if (on) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('has-session', on);
}
