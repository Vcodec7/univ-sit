'use client';

import { useMemo, type ReactNode } from 'react';
import Fuse from 'fuse.js';
import { LegalHumanProvider, useLegalHuman } from '@/components/LegalHumanContext';

function Toolbar() {
  const { human, setHuman, query, setQuery, setHitId, items } = useLegalHuman();
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['title', 'legalText', 'simpleText'],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [items]
  );

  function onSearch(value: string) {
    setQuery(value);
    const needle = value.trim();
    if (needle.length < 2) {
      setHitId(null);
      return;
    }
    const found = fuse.search(needle)[0]?.item;
    if (!found) return;
    setHitId(found.id);
    document.getElementById(found.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="legal-toolbar">
      <label className="legal-toggle">
        <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} />
        <span>Человеческий язык</span>
      </label>
      <input
        type="search"
        className="legal-search"
        placeholder="Поиск по документу"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Поиск по документу"
      />
    </div>
  );
}

export default function LegalMdxShell({ children }: { children: ReactNode }) {
  return (
    <LegalHumanProvider>
      <div className="legal-interactive legal-prose">
        <Toolbar />
        {children}
      </div>
    </LegalHumanProvider>
  );
}
