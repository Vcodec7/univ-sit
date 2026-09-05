'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import AwardsPanel from '@/components/AwardsPanel';

export default function DashboardAwardsPage() {
  return (
    <CabinetSubpage
      title="Награды"
      lead="Официальные дипломы и грамоты за жизнь портала: конкурсы, волонтёрство, клуб, экоакции."
    >
      <AwardsPanel />
    </CabinetSubpage>
  );
}
