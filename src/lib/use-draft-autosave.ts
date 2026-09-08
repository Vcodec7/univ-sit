'use client';

import { useEffect, useRef } from 'react';

/** Persist a JSON-serializable draft every second while it changes. */
export function useDraftAutosave<T>(key: string, value: T, enabled = true) {
  const first = useRef(true);

  useEffect(() => {
    if (!enabled || !key) return;
    if (first.current) {
      first.current = false;
    }
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: value }));
      } catch {
        /* quota */
      }
    }, 1000);
    return () => window.clearTimeout(t);
  }, [key, value, enabled]);
}

export function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
