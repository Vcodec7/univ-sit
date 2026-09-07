'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import AwardsPanel from '@/components/AwardsPanel';
import { PROGRESS_TABS } from '@/lib/cabinet-nav';

export default function DashboardAwardsPage() {
  return (
    <CabinetSubpage
      title="Достижения и награды"
      lead="Официальные дипломы и грамоты: конкурсы, волонтёрство, клуб, экоакции."
      tabs={PROGRESS_TABS}
    >
      <AwardsPanel />
    </CabinetSubpage>
  );
}
