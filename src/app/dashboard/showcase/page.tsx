'use client';

import { useEffect, useState } from 'react';
import CabinetSubpage from '@/components/CabinetSubpage';
import ShowcaseStudio from '@/components/ShowcaseStudio';
import CollectiblesPanel from '@/components/CollectiblesPanel';
import { fetchProfileCached } from '@/lib/user-data-client';

export default function DashboardShowcasePage() {
  const [codes, setCodes] = useState<string[] | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchProfileCached()
      .then((data) => {
        setCodes(Array.isArray(data?.showcaseBadges) ? data.showcaseBadges : []);
      })
      .finally(() => setReady(true));
  }, []);

  return (
    <CabinetSubpage
      title="Витрина профиля"
      lead="Значки и карты, которые видят на вашей странице."
    >
      {ready ? (
        <div className="dashboard-showcase">
          <ShowcaseStudio
            showcaseStored={codes}
            onSaved={(next) => setCodes(next)}
          />
          <CollectiblesPanel />
        </div>
      ) : (
        <div className="svc-skel" aria-busy="true">
          <div className="svc-skel__row" />
        </div>
      )}
    </CabinetSubpage>
  );
}
