'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import DashboardSettingsPageClient from '@/components/DashboardSettingsPageClient';

export default function DashboardSettingsPage() {
  return (
    <CabinetSubpage
      title="Настройки"
      lead="Публичность, безопасность, уведомления и мессенджеры — каждый блок отдельно."
      section="settings"
    >
      <DashboardSettingsPageClient />
    </CabinetSubpage>
  );
}
