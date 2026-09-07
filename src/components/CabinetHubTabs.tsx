'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CabinetNavLeaf } from '@/lib/cabinet-nav';
import { cabinetLeafIdFromPath, filterCabinetLeaves } from '@/lib/cabinet-nav';
import { fetchPublicStatusCached } from '@/lib/public-status-client';

export default function CabinetHubTabs({ tabs }: { tabs: CabinetNavLeaf[] }) {
  const pathname = usePathname() || '';
  const leaf = cabinetLeafIdFromPath(pathname);
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    fetchPublicStatusCached()
      .then((d) => {
        if (d?.modules && typeof d.modules === 'object') setModuleFlags(d.modules as Record<string, boolean>);
        else setModuleFlags({});
      })
      .catch(() => setModuleFlags({}));
  }, []);

  const visible = filterCabinetLeaves(tabs, moduleFlags);
  if (visible.length < 2) return null;
  return (
    <nav className="cabinet-hub-tabs" aria-label="Разделы">
      {visible.map((tab) => {
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
