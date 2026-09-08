'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type LegalSearchItem = {
  id: string;
  title: string;
  legalText: string;
  simpleText: string;
};

type Ctx = {
  human: boolean;
  setHuman: (v: boolean) => void;
  query: string;
  setQuery: (v: string) => void;
  hitId: string | null;
  setHitId: (id: string | null) => void;
  items: LegalSearchItem[];
  register: (item: LegalSearchItem) => void;
};

const LegalHumanContext = createContext<Ctx | null>(null);

export function LegalHumanProvider({ children }: { children: ReactNode }) {
  const [human, setHuman] = useState(false);
  const [query, setQuery] = useState('');
  const [hitId, setHitId] = useState<string | null>(null);
  const [items, setItems] = useState<LegalSearchItem[]>([]);

  const register = useCallback((item: LegalSearchItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) {
        return prev.map((p) => (p.id === item.id ? item : p));
      }
      return [...prev, item];
    });
  }, []);

  const value = useMemo(
    () => ({ human, setHuman, query, setQuery, hitId, setHitId, items, register }),
    [human, query, hitId, items, register]
  );

  return <LegalHumanContext.Provider value={value}>{children}</LegalHumanContext.Provider>;
}

export function useLegalHuman() {
  const ctx = useContext(LegalHumanContext);
  if (!ctx) {
    throw new Error('useLegalHuman must be used inside LegalHumanProvider');
  }
  return ctx;
}
