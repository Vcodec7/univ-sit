'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import ProfileGameScores from '@/components/ProfileGameScores';

export default function DashboardGamesPage() {
  return (
    <CabinetSubpage title="Игры и рекорды" lead="Ваши результаты в мини-играх портала.">
      <ProfileGameScores />
    </CabinetSubpage>
  );
}
