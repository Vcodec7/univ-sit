'use client';

import { useEffect } from 'react';

/**
 * Check for a new service worker in the background.
 * Do not skipWaiting/claim/reload here — that made the live page jump after deploys.
 * The waiting worker becomes active on the next full visit (no open clients).
 */
export default function PwaUpdateBanner() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (cancelled || !reg) return;
        /* update() during install/activate throws InvalidStateError on every page. */
        if (reg.installing || (reg.active && reg.active.state !== 'activated')) return;
        await reg.update();
      } catch {
        /* InvalidStateError / abort while a new worker is installing */
      }
    };
    const first = window.setTimeout(() => void check(), 20_000);
    const t = window.setInterval(() => void check(), 15 * 60_000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, []);

  return null;
}
