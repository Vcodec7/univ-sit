'use client';

import CabinetSubpage from '@/components/CabinetSubpage';
import PortfolioEditor from '@/components/PortfolioEditor';

export default function DashboardPortfolioPage() {
  return (
    <CabinetSubpage
      title="Портфолио"
      lead="Витрина опыта, проектов и грамот. После проверки можно открыть страницу и скачать с подписью портала."
    >
      <PortfolioEditor />
    </CabinetSubpage>
  );
}
