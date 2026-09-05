'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import PortfolioEditor from '@/components/PortfolioEditor';

export default function DashboardPortfolioPage() {
  return (
    <CabinetSubpage
      title="Портфолио"
      lead="Витрина опыта и грамот — часть профиля. После проверки модератором можно скачать с подписью портала."
    >
      <PortfolioEditor />
    </CabinetSubpage>
  );
}
