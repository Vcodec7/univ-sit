'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function GamesShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/games';
  const hub = pathname === '/games' || pathname === '/games/';
  return <div className={`games-root${hub ? ' is-hub' : ' is-play'}`}>{children}</div>;
}
