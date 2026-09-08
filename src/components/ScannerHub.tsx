'use client';

import { useState } from 'react';
import TicketScanner from '@/components/TicketScanner';
import PresenceScanner from '@/components/PresenceScanner';
import ScannerErrorBoundary from '@/components/ScannerErrorBoundary';

export default function ScannerHub({ initialTab = 'tickets' }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === 'pass' ? 'pass' : 'tickets');
  return (
    <div className="scanner-hub">
      <p className="scanner-hub__hint">
        Билет, коворкинг и личный пропуск читаются вместе. Зелёный экран — проход, красный — отказ.
      </p>
      <div className="scanner-hub__tabs" role="tablist" aria-label="Режим сканера">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tickets'}
          className={tab === 'tickets' ? 'is-on' : ''}
          onClick={() => setTab('tickets')}
        >
          Билеты и коворкинг
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pass'}
          className={tab === 'pass' ? 'is-on' : ''}
          onClick={() => setTab('pass')}
        >
          Пропуск
        </button>
      </div>
      {tab === 'tickets' ? (
        <ScannerErrorBoundary>
          <TicketScanner />
        </ScannerErrorBoundary>
      ) : (
        <PresenceScanner />
      )}
    </div>
  );
}
