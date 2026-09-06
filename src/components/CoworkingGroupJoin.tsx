'use client';

import { useState } from 'react';
import Link from 'next/link';
import CoworkingInviteScreen, { type CoworkingGroupPayload } from '@/components/CoworkingInviteScreen';

type Props = {
  initialGroup: CoworkingGroupPayload;
  loggedIn: boolean;
  loginHref: string;
};

export default function CoworkingGroupJoin({ initialGroup, loggedIn, loginHref }: Props) {
  const [group, setGroup] = useState(initialGroup);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const token = initialGroup.invitePath?.split('/').pop() || '';
      const r = await fetch('/api/coworking/groups/join', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.message || 'Не удалось присоединиться');
        if (data.code === 'FULL' && data.group) setGroup(data.group);
        return;
      }
      if (data.group) setGroup(data.group);
    } finally {
      setBusy(false);
    }
  }

  const when = `${new Date(group.startTime).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <div className="cw-group-page">
      <section className="cw-open-group" aria-label="Открытая группа">
        <h2>Открытая группа</h2>
        <ul className="cw-open-group__facts">
          <li>
            <span>Организатор</span>
            <strong>{group.organizer.name || 'Участник'}</strong>
          </li>
          <li>
            <span>Уже в группе</span>
            <strong>
              {group.approvedCount} из {group.seats}
            </strong>
          </li>
          <li>
            <span>Осталось мест</span>
            <strong>{group.seatsLeft}</strong>
          </li>
          <li>
            <span>Набор</span>
            <strong>{group.recruiting ? 'открыт' : group.full ? 'группа заполнена' : 'закрыт'}</strong>
          </li>
        </ul>
        <p className="cw-field-hint">
          {group.space.title} · {when}
        </p>
      </section>

      {group.isHost ? (
        <CoworkingInviteScreen group={group} onUpdated={setGroup} />
      ) : (
        <div className="cw-group-join">
          {group.isMember ? (
            <p className="cw-ok">Вы в группе</p>
          ) : group.full ? (
            <p className="cw-error">Группа заполнена</p>
          ) : !loggedIn ? (
            <Link href={loginHref} className="btn btn-primary">
              Войти, чтобы присоединиться
            </Link>
          ) : group.isPending ? (
            <p className="cw-ok">Заявка отправлена организатору</p>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy || !group.recruiting} onClick={() => void join()}>
              {busy ? 'Добавляем…' : group.recruiting ? 'Присоединиться' : 'Набор закрыт'}
            </button>
          )}
          {error ? <p className="cw-error">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
