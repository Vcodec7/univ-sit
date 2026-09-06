'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export type CoworkingGroupPayload = {
  id: string;
  seats: number;
  joinOpen: boolean;
  invitePath: string | null;
  dayKey: string;
  startTime: string;
  endTime: string;
  space: { title: string };
  organizer: { id: string; name: string | null };
  approvedCount: number;
  seatsLeft: number;
  full: boolean;
  recruiting: boolean;
  isHost: boolean;
  isMember: boolean;
  isPending: boolean;
  members: {
    id: string;
    userId: string;
    role: string;
    status: string;
    name: string | null;
  }[];
};

type Friend = { id: string; name: string | null };

type Props = {
  group: CoworkingGroupPayload;
  origin?: string;
  onUpdated?: (group: CoworkingGroupPayload) => void;
};

export default function CoworkingInviteScreen({ group, origin, onUpdated }: Props) {
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [current, setCurrent] = useState(group);

  useEffect(() => {
    setCurrent(group);
  }, [group]);

  const link = useMemo(() => {
    const path = current.invitePath || `/coworking/group/${current.id}`;
    if (origin) return `${origin}${path}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
    return path;
  }, [current, origin]);

  useEffect(() => {
    if (!inviteOpen) return;
    fetch('/api/friends', { credentials: 'same-origin' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        setFriends(Array.isArray(data.friends) ? data.friends : []);
      })
      .catch(() => setFriends([]));
  }, [inviteOpen]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setStatus('Скопируйте ссылку вручную');
    }
  }

  async function sendInvites() {
    if (selected.length === 0) {
      setStatus('Выберите друзей');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const r = await fetch('/api/coworking/groups/invite', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: current.id, friendIds: selected }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus(data.message || 'Не удалось отправить');
        return;
      }
      setStatus(`Приглашения отправлены: ${data.sent || selected.length}`);
      setSelected([]);
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch('/api/coworking/groups', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: current.id, ...body }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus(data.message || 'Не удалось обновить');
        return;
      }
      if (data.group) {
        setCurrent(data.group);
        onUpdated?.(data.group);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cw-invite">
      <header className="cw-invite__head">
        <p className="cw-eyebrow">Открытая группа</p>
        <h2>Пригласите участников</h2>
        <p>
          {current.space.title}: {current.approvedCount} из {current.seats} уже в группе
          {current.recruiting ? ' · набор открыт' : current.full ? ' · группа заполнена' : ' · набор закрыт'}.
        </p>
      </header>

      <button type="button" className="btn btn-primary" onClick={() => setInviteOpen((v) => !v)}>
        Пригласить участников
      </button>

      {inviteOpen ? (
        <div className="cw-invite__panel">
          <div className="cw-invite__link">
            <span>Приглашение по ссылке</span>
            <code>{link}</code>
            <button type="button" className="btn btn-secondary" onClick={() => void copyLink()}>
              {copied ? 'Скопировано' : 'Скопировать ссылку'}
            </button>
          </div>

          <div className="cw-invite__friends">
            <span>Друзья сайта</span>
            {friends.length === 0 ? (
              <p className="cw-field-hint">Пока нет друзей — добавьте их в разделе «Друзья».</p>
            ) : (
              <ul>
                {friends.map((f) => (
                  <li key={f.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected.includes(f.id)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                          )
                        }
                      />
                      {f.name || 'Друг'}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || selected.length === 0}
              onClick={() => void sendInvites()}
            >
              Отправить во внутренние сообщения
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p className="cw-ok">{status}</p> : null}

      {current.isHost ? (
        <div className="cw-invite__manage">
          <h3>Участники</h3>
          <ul>
            {current.members.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name || 'Участник'}
                  {m.role === 'HOST' ? ' · организатор' : ''}
                  {m.status === 'PENDING' ? ' · заявка' : ''}
                </span>
                {m.role !== 'HOST' && m.status === 'PENDING' ? (
                  <button type="button" disabled={busy} onClick={() => void patch({ acceptUserId: m.userId })}>
                    Принять
                  </button>
                ) : null}
                {m.role !== 'HOST' ? (
                  <button type="button" disabled={busy} onClick={() => void patch({ removeUserId: m.userId })}>
                    Удалить
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => void patch({ joinOpen: !current.joinOpen })}
          >
            {current.joinOpen ? 'Закрыть набор' : 'Открыть набор'}
          </button>
        </div>
      ) : null}

      <div className="cw-invite__footer">
        {current.invitePath ? (
          <Link href={current.invitePath} className="btn btn-secondary">
            Страница группы
          </Link>
        ) : null}
        <Link href="/dashboard?tab=coworking" className="btn btn-primary">
          В кабинет
        </Link>
      </div>
    </div>
  );
}
