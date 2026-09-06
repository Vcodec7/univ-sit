'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Non-suspending search params for static catalog pages.
 * Next's useSearchParams() forces a Suspense boundary whose fallback
 * ("Загрузка каталога…") can stick forever if the client chunk/hydrate lags.
 * This hook reads window.location and tracks history soft-navigations.
 */

const listeners = new Set<() => void>();
let patched = false;

function notify() {
  listeners.forEach((l) => l());
}

function ensureHistoryPatch() {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const wrap =
    (fn: History['pushState' | 'replaceState']) =>
    function (this: History, ...args: Parameters<History['pushState']>) {
      const ret = fn.apply(this, args);
      queueMicrotask(notify);
      return ret;
    };
  history.pushState = wrap(history.pushState.bind(history));
  history.replaceState = wrap(history.replaceState.bind(history));
  window.addEventListener('popstate', notify);
  const nav = (window as unknown as { navigation?: EventTarget }).navigation;
  if (nav) {
    nav.addEventListener('navigate', () => queueMicrotask(notify));
  }
}

function subscribe(onStoreChange: () => void) {
  ensureHistoryPatch();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSearchSnapshot() {
  return typeof window !== 'undefined' ? window.location.search : '';
}

function getServerSnapshot() {
  return '';
}

/** Client catalog navigations that Next's static Link would not re-render. */
export function pushCatalogUrl(href: string, { replace = false }: { replace?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  ensureHistoryPatch();
  const url = new URL(href, window.location.href);
  const next = `${url.pathname}${url.search}`;
  const cur = `${window.location.pathname}${window.location.search}`;
  if (next === cur) {
    notify();
    return;
  }
  if (replace) window.history.replaceState(window.history.state, '', next);
  else window.history.pushState(window.history.state, '', next);
}

export function useSafeSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSearchSnapshot, getServerSnapshot);
  return useMemo(() => {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    return new URLSearchParams(raw);
  }, [search]);
}
