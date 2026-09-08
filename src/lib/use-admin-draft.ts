'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const ADMIN_DRAFT_INTERVAL_MS = 2000;

export function adminDraftKey(path: string, entity: string) {
  return `yp-admin-draft:${path}:${entity}`;
}

export function readAdminDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function writeAdminDraft<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota */
  }
}

export function clearAdminDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function serializeNamedForm(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  const fd = new FormData(form);
  fd.forEach((value, name) => {
    if (typeof value === 'string' && name && name !== 'id') out[name] = value;
  });
  return out;
}

export function applyNamedForm(form: HTMLFormElement, data: Record<string, string>) {
  for (const [name, value] of Object.entries(data)) {
    const el = form.elements.namedItem(name);
    if (!el) continue;
    const target = el instanceof RadioNodeList ? el[0] : el;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      if (target.type === 'file') continue;
      target.value = value;
    }
  }
}

export function useAdminDraft<T>(
  path: string,
  entity: string,
  value: T,
  apply: (draft: T) => void,
  intervalMs = ADMIN_DRAFT_INTERVAL_MS
) {
  const key = adminDraftKey(path, entity);
  const initial = useRef(value);
  const [restored, setRestored] = useState(false);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const draft = readAdminDraft<T>(key);
    if (!draft) return;
    apply(draft);
    setRestored(true);
  }, [key, apply]);

  useEffect(() => {
    const t = window.setTimeout(() => writeAdminDraft(key, value), intervalMs);
    return () => window.clearTimeout(t);
  }, [key, value, intervalMs]);

  const discard = useCallback(() => {
    clearAdminDraft(key);
    apply(initial.current);
    setRestored(false);
  }, [key, apply]);

  const clear = useCallback(() => {
    clearAdminDraft(key);
    setRestored(false);
  }, [key]);

  return { key, restored, discard, clear };
}
