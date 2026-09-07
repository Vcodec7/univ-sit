'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import AchievementsPanel from '@/components/AchievementsPanel';

export default function DashboardAchievementsPage() {
  return (
    <CabinetSubpage
      title="Достижения"
      lead="Собирайте значки по разделам портала. Прогресс считается в фильтрах ниже."
    >
      <AchievementsPanel />
    </CabinetSubpage>
  );
}
