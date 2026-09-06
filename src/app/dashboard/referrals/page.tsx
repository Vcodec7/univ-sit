'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import ReferralPanel from '@/components/ReferralPanel';

export default function DashboardReferralsPage() {
  return (
    <CabinetSubpage
      title="Рефералы"
      lead="Приглашайте друзей и получайте бонусы за регистрации и визиты."
    >
      <ReferralPanel />
    </CabinetSubpage>
  );
}
