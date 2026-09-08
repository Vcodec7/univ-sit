'use client';

import { useEffect, useState } from 'react';
import { formatCountdown, parseEtaDeadline } from '@/lib/eta-countdown';

/** Live countdown when ETA is ISO datetime or minutes; otherwise shows raw label. */
export default function EtaCountdown({
  eta,
  prefix = 'Ориентир',
  doneLabel = 'Срок истёк',
}: {
  eta: string | null | undefined;
  prefix?: string;
  doneLabel?: string;
}) {
  const deadline = parseEtaDeadline(eta);
  /* Starts null so SSR and first client render match; the clock starts after mount. */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!eta) return null;

  if (!deadline) {
    return (
      <p className="maintenance-eta">
        {prefix}: {eta}
      </p>
    );
  }

  /* Both the countdown and the absolute date are locale/timezone dependent,
     so nothing is rendered until the client clock is available. */
  if (now === null) return null;

  const left = deadline.getTime() - now;
  if (left <= 0) {
    return <p className="maintenance-eta">{doneLabel}</p>;
  }

  return (
    <p className="maintenance-eta" aria-live="polite">
      {prefix}: <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCountdown(left)}</strong>
      <span style={{ display: 'block', fontSize: '0.85em', opacity: 0.85, marginTop: 4 }}>
        до {deadline.toLocaleString('ru-RU')}
      </span>
    </p>
  );
}
