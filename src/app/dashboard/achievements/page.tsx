'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import AchievementsPanel from '@/components/AchievementsPanel';
import { PROGRESS_TABS } from '@/lib/cabinet-nav';

export default function DashboardAchievementsPage() {
  return (
    <CabinetSubpage
      title="Достижения и награды"
      lead="Значки за активность на портале и официальные дипломы."
      tabs={PROGRESS_TABS}
    >
      <AchievementsPanel />
    </CabinetSubpage>
  );
}
