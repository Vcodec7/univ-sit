'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, MessageCircle, Search, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from '@/components/UserAvatar';
import CabinetSubpage from '@/components/CabinetSubpage';
import '@/app/friends/friends.css';

type Trust = {
  score: number;
  label: string;
  sharedEvents: number;
  messages: number;
  friendDays: number;
};

type Person = {
  friendshipId: string;
  id: string;
  name: string | null;
  image: string | null;
  createdAt?: string;
  trust?: Trust;
  aliased?: boolean;
  presence?: { online: boolean; label: string } | null;
};

type SearchHit = {
  id: string;
  name: string | null;
  image: string | null;
  city: string | null;
  aliased?: boolean;
  friendship: {
    friendshipId: string;
    status: string;
    direction: 'incoming' | 'outgoing';
  } | null;
};

type FriendsData = {
  friends: Person[];
  incoming: Person[];
  outgoing: Person[];
};

const emptyData: FriendsData = { friends: [], incoming: [], outgoing: [] };

function Avatar({
  person,
  size = 40,
}: {
  person: {
    name: string | null;
    image: string | null;
    aliased?: boolean;
    presence?: { online: boolean; label: string } | null;
  };
  size?: number;
}) {
  return (
    <UserAvatar
      name={person.name}
      image={person.image}
      size={size}
      aliased={person.aliased}
      online={person.presence?.online ?? null}
      showStatus={person.presence != null}
    />
  );
}

export default function FriendsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<FriendsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  const [siteResults, setSiteResults] = useState<SearchHit[]>([]);
  const [siteSearching, setSiteSearching] = useState(false);
  const [siteSearched, setSiteSearched] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/friends');
    if (!response.ok) throw new Error('Не удалось загрузить друзей');
    setData(await response.json());
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=' + encodeURIComponent('/dashboard/friends'));
      return;
    }
    if (status === 'authenticated') {
      let cancelled = false;
      const initialize = async () => {
        try {
          const response = await fetch('/api/friends');
          if (!response.ok) throw new Error('Не удалось загрузить друзей');
          const result = await response.json();
          if (!cancelled) setData(result);
        } catch (error) {
          if (!cancelled) {
            toast.error(error instanceof Error ? error.message : 'Ошибка');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      initialize();
      return () => {
        cancelled = true;
      };
    }
  }, [load, router, status]);

  useEffect(() => {
    const needle = siteQuery.trim();
    if (needle.length < 2) {
      setSiteResults([]);
      setSiteSearched(false);
      setSiteSearching(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSiteSearching(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(needle)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Ошибка поиска');
        if (!cancelled) {
          setSiteResults(Array.isArray(result.users) ? result.users : []);
          setSiteSearched(true);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Ошибка поиска');
          setSiteResults([]);
          setSiteSearched(true);
        }
      } finally {
        if (!cancelled) setSiteSearching(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [siteQuery]);

  const act = async (friendshipId: string, action: 'accept' | 'decline' | 'cancel' | 'remove') => {
    setBusyId(friendshipId);
    try {
      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось выполнить действие');
      await load();
      toast.success(action === 'accept' ? 'Заявка принята' : 'Готово');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  };

  const sendRequest = async (userId: string) => {
    setBusyId(userId);
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Не удалось отправить заявку');
      await load();
      setSiteResults((prev) =>
        prev.map((hit) =>
          hit.id === userId
            ? {
                ...hit,
                friendship: {
                  friendshipId: result.friendship?.id || '',
                  status: 'PENDING',
                  direction: 'outgoing',
                },
              }
            : hit
        )
      );
      toast.success('Заявка отправлена');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  };

  const friends = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru');
    if (!needle) return data.friends;
    return data.friends.filter((friend) =>
      (friend.name || '').toLocaleLowerCase('ru').includes(needle)
    );
  }, [data.friends, query]);

  if (status === 'loading' || loading) {
    return (
      <CabinetSubpage title="Друзья" lead="Поиск участников и заявки.">
        <div className="friends-page friends-page--cabinet">
          <div className="svc-skel" aria-busy="true" aria-label="Загрузка">
            <div className="svc-skel__pill" />
            <div className="svc-skel__row" />
            <div className="svc-skel__row" />
          </div>
        </div>
      </CabinetSubpage>
    );
  }

  return (
    <CabinetSubpage title="Друзья" lead="Поиск участников и заявки. Закрытые профили скрыты.">
      <div className="friends-page friends-page--cabinet">
      <div className="friends-head friends-head--cabinet">
        <Link href="/dashboard/messages" className="friends-head__msg">
          <MessageCircle size={15} aria-hidden />
          Чаты
        </Link>
      </div>

      <section className="friends-card">
        <h2>Поиск по сайту</h2>
        <label className="friends-field">
          <Search size={15} aria-hidden />
          <input
            value={siteQuery}
            onChange={(event) => setSiteQuery(event.target.value)}
            placeholder="Имя (от 2 символов)"
            aria-label="Поиск друзей по сайту"
          />
        </label>
        {siteSearching && <p className="friends-hint">Ищем…</p>}
        {!siteSearching && siteSearched && siteResults.length === 0 && (
          <p className="friends-hint">Никого не найдено. Закрытые профили скрыты из поиска.</p>
        )}
        {siteResults.length > 0 && (
          <div className="friends-rows">
            {siteResults.map((hit) => (
              <div key={hit.id} className="friends-row">
                <Avatar person={hit} />
                <div className="friends-row__meta">
                  <Link href={`/u/${hit.id}`} className="friends-row__name">
                    {hit.name || 'Пользователь'}
                  </Link>
                  {(hit.aliased || hit.city) && (
                    <div className="friends-row__sub">
                      {hit.aliased ? 'Сказочный псевдоним' : hit.city}
                    </div>
                  )}
                </div>
                {!hit.friendship && (
                  <button
                    type="button"
                    className="friends-btn"
                    disabled={busyId === hit.id}
                    onClick={() => sendRequest(hit.id)}
                  >
                    <UserPlus size={14} />
                    Добавить
                  </button>
                )}
                {hit.friendship?.status === 'PENDING' && hit.friendship.direction === 'outgoing' && (
                  <span className="friends-btn is-wait">Отправлено</span>
                )}
                {hit.friendship?.status === 'PENDING' && hit.friendship.direction === 'incoming' && (
                  <Link href="/dashboard/friends" className="friends-btn">
                    Ответить
                  </Link>
                )}
                {hit.friendship?.status === 'ACCEPTED' && (
                  <Link href={`/dashboard/messages?with=${hit.id}`} className="friends-btn is-icon" aria-label="Написать">
                    <MessageCircle size={15} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {data.incoming.length > 0 && (
        <section className="friends-card">
          <h2>Входящие · {data.incoming.length}</h2>
          <div className="friends-rows is-flush">
            {data.incoming.map((person) => (
              <div key={person.friendshipId} className="friends-row">
                <Avatar person={person} />
                <div className="friends-row__meta">
                  <Link href={`/u/${person.id}`} className="friends-row__name">
                    {person.name || 'Пользователь'}
                  </Link>
                  {person.aliased && <div className="friends-row__sub">Сказочный псевдоним</div>}
                </div>
                <div className="friends-actions">
                  <button
                    type="button"
                    className="friends-btn"
                    disabled={busyId === person.friendshipId}
                    onClick={() => act(person.friendshipId, 'accept')}
                    aria-label="Принять заявку"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    className="friends-btn is-ghost is-icon"
                    disabled={busyId === person.friendshipId}
                    onClick={() => act(person.friendshipId, 'decline')}
                    aria-label="Отклонить заявку"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.outgoing.length > 0 && (
        <section className="friends-card">
          <h2>Отправленные · {data.outgoing.length}</h2>
          <div className="friends-rows is-flush">
            {data.outgoing.map((person) => (
              <div key={person.friendshipId} className="friends-row">
                <Avatar person={person} />
                <div className="friends-row__meta">
                  <Link href={`/u/${person.id}`} className="friends-row__name">
                    {person.name || 'Пользователь'}
                  </Link>
                  {person.aliased && <div className="friends-row__sub">Сказочный псевдоним</div>}
                </div>
                <button
                  type="button"
                  className="friends-btn is-ghost"
                  disabled={busyId === person.friendshipId}
                  onClick={() => act(person.friendshipId, 'cancel')}
                >
                  Отменить
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="friends-card">
        <div className="friends-card__title">
          <h2>Мои друзья · {data.friends.length}</h2>
          <label className="friends-field is-filter">
            <Search size={14} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Фильтр"
              aria-label="Фильтр среди друзей"
            />
          </label>
        </div>

        {friends.length === 0 ? (
          <div className="friends-empty">
            <UserPlus size={22} />
            <div>{query ? 'Никого не найдено' : 'Список друзей пока пуст'}</div>
          </div>
        ) : (
          <div className="friends-rows is-flush">
            {friends.map((friend) => (
              <div key={friend.friendshipId} className="friends-row">
                <Avatar person={friend} />
                <div className="friends-row__meta">
                  <Link href={`/u/${friend.id}`} className="friends-row__name">
                    {friend.name || 'Пользователь'}
                  </Link>
                  <div className={`friends-row__sub${friend.presence?.online ? ' is-online' : ''}`}>
                    {friend.presence?.label}
                    {friend.presence && friend.trust ? ' · ' : null}
                    {friend.trust ? `${friend.trust.label} · ${friend.trust.score}%` : null}
                  </div>
                </div>
                <Link
                  href={`/dashboard/messages?with=${friend.id}`}
                  className="friends-btn"
                  aria-label={`Написать ${friend.name || 'другу'}`}
                >
                  <MessageCircle size={14} />
                  Написать
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </CabinetSubpage>
  );
}
