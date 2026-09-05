'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import ProfileGuides from '@/components/ProfileGuides';

export default function DashboardGuidesPage() {
  return (
    <CabinetSubpage
      title="Инструктажи"
      lead="Как пользоваться порталом и обязательные инструкции."
    >
      <ProfileGuides />
    </CabinetSubpage>
  );
}
