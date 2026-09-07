'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import ApplicationsCabinet from '@/components/ApplicationsCabinet';

export default function DashboardApplicationsPage() {
  return (
    <CabinetSubpage
      title="Заявки"
      lead="Проекты, клубы, программы, афиша и брони — без профиля и настроек."
      section="applications"
    >
      <ApplicationsCabinet />
    </CabinetSubpage>
  );
}
