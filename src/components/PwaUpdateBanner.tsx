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
    const check = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        void reg?.update();
      });
    };
    check();
    const t = window.setInterval(check, 15 * 60_000);
    return () => window.clearInterval(t);
  }, []);

  return null;
}
