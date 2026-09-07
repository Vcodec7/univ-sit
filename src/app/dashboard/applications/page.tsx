'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import ApplicationsCabinet from '@/components/ApplicationsCabinet';
import { BOOKING_TABS } from '@/lib/cabinet-nav';

export default function DashboardApplicationsPage() {
  return (
    <CabinetSubpage
      title="Билеты и заявки"
      lead="Проекты, клубы, программы, афиша и брони."
      tabs={BOOKING_TABS}
    >
      <ApplicationsCabinet />
    </CabinetSubpage>
  );
}
