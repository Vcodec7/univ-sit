'use client';

import { useState } from 'react';
import CabinetSubpage from '@/components/CabinetSubpage';
import EcoPointsPanel from '@/components/EcoPointsPanel';
import ShopCollectiblesLazy from '@/components/ShopCollectiblesLazy';

export default function DashboardShopPage() {
  const [eco, setEco] = useState<number | undefined>();
  return (
    <CabinetSubpage
      title="Магазин"
      lead="Соберите свой образ: рамки, ауры, темы и голос сразу видны в профиле. Карты — отдельная коллекция."
    >
      <div className="shop-stage">
        <EcoPointsPanel mode="shop" onBalanceChange={setEco} />
        <ShopCollectiblesLazy onBalanceChange={setEco} />
      </div>
    </CabinetSubpage>
  );
}
