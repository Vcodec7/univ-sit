"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CollectiblesPanel = dynamic(() => import("@/components/CollectiblesPanel"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
      Загружаем коллекционные карты…
    </div>
  ),
});

type Props = {
  onBalanceChange?: (ecoPoints: number) => void;
};

/**
 * Lazy-mount collectibles only after the user opens the section.
 * Keeps shop equip/buy responsive by not competing for API bandwidth on load.
 */
export default function ShopCollectiblesLazy({ onBalanceChange }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
  }, [open]);

  return (
    <details
      className="shop-cards-fold"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="shop-cards-fold__title">Коллекционные карты</span>
        <span className="shop-cards-fold__hint">
          Паки, витрина профиля и инвентарь. Косметика выше работает отдельно.
        </span>
      </summary>
      <div className="shop-cards-fold__body">
        {mounted ? <CollectiblesPanel onBalanceChange={onBalanceChange} /> : null}
      </div>
    </details>
  );
}
