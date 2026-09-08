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

export function readSessionHint(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('has-session');
}

/** Cookie present — skip guest POSTs that would 401 in DevTools. */
export function hasAuthSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return document.cookie.split(';').some((part) => {
      const name = part.trim().split('=')[0];
      return (
        name === 'next-auth.session-token' ||
        name === '__Secure-next-auth.session-token' ||
        name === 'authjs.session-token' ||
        name === '__Secure-authjs.session-token'
      );
    });
  } catch {
    return false;
  }
}
