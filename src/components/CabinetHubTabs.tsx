'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CabinetNavLeaf } from '@/lib/cabinet-nav';
import { cabinetLeafIdFromPath } from '@/lib/cabinet-nav';

export default function CabinetHubTabs({ tabs }: { tabs: CabinetNavLeaf[] }) {
  const pathname = usePathname() || '';
  const leaf = cabinetLeafIdFromPath(pathname);
  if (tabs.length < 2) return null;
  return (
    <nav className="cabinet-hub-tabs" aria-label="Разделы">
      {tabs.map((tab) => {
        const on = tab.id === leaf;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`cabinet-hub-tabs__btn${on ? ' is-on' : ''}`}
            aria-current={on ? 'page' : undefined}
            prefetch
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
