'use client';

import { useState } from 'react';
import Link from 'next/link';
import CoworkingCabinetList from '@/components/CoworkingCabinetList';

export default function CabinetHubTabs({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const [tab, setTab] = useState<'records' | 'chat'>('records');
  return (
    <section className="cabinet-hub-tabs" aria-label="Контент профиля">
      <div className="cabinet-hub-tabs__nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'records'}
          className={tab === 'records' ? 'is-on' : ''}
          onClick={() => setTab('records')}
        >
          Мои записи
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={tab === 'chat' ? 'is-on' : ''}
          onClick={() => setTab('chat')}
        >
          Общение{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
        </button>
      </div>
      {tab === 'records' ? (
        <div role="tabpanel">
          <CoworkingCabinetList />
        </div>
      ) : (
        <div role="tabpanel" className="cabinet-hub-tabs__chat">
          <p>Чаты в стиле Telegram: на телефоне свайпните вправо, чтобы вернуться к списку.</p>
          <Link href="/dashboard/messages" className="btn btn-primary">
            Открыть общение
          </Link>
        </div>
      )}
    </section>
  );
}
