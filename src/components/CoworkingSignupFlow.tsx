'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import {
  clampCoworkingSeats,
  COWORKING_MAX_SEATS,
  COWORKING_PERIODS,
  defaultCoworkingPeriodId,
  resolveCoworkingPeriod,
} from '@/lib/coworking';
import type { CoworkingSpaceAvailability } from '@/lib/coworking-availability';
import SvcDateField from '@/components/SvcDateField';
import ServiceSplitModal from '@/components/ServiceSplitModal';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import CoworkingInviteScreen, { type CoworkingGroupPayload } from '@/components/CoworkingInviteScreen';

type SpaceInfo = CoworkingSpaceAvailability;

const PURPOSES = ['Учёба', 'Проект', 'Встреча', 'Другое'];

function todayYmd() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatRuLong(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

type Props = {
  initialSpaceId?: string;
  initialDayKey?: string;
  initialSpaces?: SpaceInfo[];
};

export default function CoworkingSignupFlow({
  initialSpaceId,
  initialDayKey,
  initialSpaces = [],
}: Props) {
  const router = useRouter();
  const [dayKey, setDayKey] = useState(initialDayKey || todayYmd());
  const [spaces, setSpaces] = useState<SpaceInfo[]>(initialSpaces);
  const [spaceId, setSpaceId] = useState(() => {
    if (initialSpaceId && initialSpaces.some((s) => s.id === initialSpaceId)) return initialSpaceId;
    return initialSpaces[0]?.id || initialSpaceId || '';
  });
  const [period, setPeriod] = useState(() => defaultCoworkingPeriodId(initialDayKey || todayYmd()));
  const [mode, setMode] = useState<'SOLO' | 'GROUP'>('SOLO');
  const [seats, setSeats] = useState(2);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(initialSpaces.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMeta, setSuccessMeta] = useState<{
    title: string;
    day: string;
    start: string;
    end: string;
    waitlist: boolean;
  } | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [inviteGroup, setInviteGroup] = useState<CoworkingGroupPayload | null>(null);
  const spaceIdRef = useRef(spaceId);
  spaceIdRef.current = spaceId;
  const lastFetchedDay = useRef<string | null>(
    initialSpaces.length > 0 ? initialDayKey || todayYmd() : null
  );
  const spacesRef = useRef(spaces);
  spacesRef.current = spaces;

  useEffect(() => {
    let cancelled = false;

    if (lastFetchedDay.current === dayKey) return;

    const soft = spacesRef.current.length > 0;
    if (soft) setRefreshing(true);
    else setLoading(true);

    fetch(`/api/coworking?day=${encodeURIComponent(dayKey)}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Ошибка');
        if (cancelled) return;
        const next: SpaceInfo[] = data.spaces || [];
        setSpaces(next);
        setError(null);
        lastFetchedDay.current = dayKey;
        const current = spaceIdRef.current;
        if (!current || !next.some((s) => s.id === current)) {
          if (next[0]?.id) setSpaceId(next[0].id);
        }
        setPeriod((prev) => {
          const preferred = defaultCoworkingPeriodId(dayKey);
          if (next[0]?.periods.some((p) => p.id === prev)) return prev;
          return preferred;
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dayKey]);

  const space = useMemo(() => spaces.find((s) => s.id === spaceId) || null, [spaces, spaceId]);
  const periodInfo = space?.periods.find((p) => p.id === period) || null;
  const left = periodInfo?.left ?? 0;
  const cover = space?.image || '/brand/hero-cover.jpg';
  const periodDef = resolveCoworkingPeriod(period);
  const busy = loading && spaces.length === 0;
  const seatsMax = Math.max(
    2,
    Math.min(COWORKING_MAX_SEATS, left > 0 ? left : COWORKING_MAX_SEATS, space?.capacity || COWORKING_MAX_SEATS)
  );
  const participants = mode === 'SOLO' ? 1 : clampCoworkingSeats(seats, seatsMax);

  useEffect(() => {
    setSeats((prev) => clampCoworkingSeats(prev, seatsMax));
  }, [seatsMax]);

  async function submit(waitlist = false) {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const r = await fetch('/api/coworking', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          dayKey,
          period,
          kind: mode,
          seats: participants,
          purpose: purpose || null,
          waitlist,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.canWaitlist) {
          setError('Мест нет — можно встать в лист ожидания');
        } else {
          setError(data.message || 'Не удалось записаться');
        }
        return;
      }
      const wait = data.signup?.status === 'WAITLIST';
      setMessage(wait ? 'Вы в листе ожидания' : 'Запись подтверждена');
      setSuccessMeta({
        title: space?.title || 'Коворкинг',
        day: dayKey,
        start: periodDef.start || '',
        end: periodDef.end || '',
        waitlist: wait,
      });
      try {
        const qrRes = await fetch('/api/presence-qr', { credentials: 'same-origin' });
        const qrData = await qrRes.json();
        if (qrRes.ok) setQrUrl(qrData.qr?.url || '');
      } catch {
        /* optional */
      }
      if (mode === 'GROUP' && data.signup?.kind === 'GROUP' && !wait) {
        const signup = data.signup;
        setInviteGroup({
          id: signup.id,
          seats: signup.seats,
          joinOpen: signup.joinOpen !== false,
          invitePath: signup.inviteToken ? `/coworking/group/${signup.inviteToken}` : null,
          dayKey: signup.dayKey,
          startTime: signup.startTime,
          endTime: signup.endTime,
          space: { title: signup.space?.title || space?.title || 'Коворкинг' },
          organizer: signup.user || { id: signup.userId, name: 'Вы' },
          approvedCount: 1,
          seatsLeft: Math.max(0, signup.seats - 1),
          full: signup.seats <= 1,
          recruiting: true,
          isHost: true,
          isMember: true,
          isPending: false,
          members: (signup.members || []).map((m: { id: string; userId: string; role: string; status: string; user?: { name?: string | null } }) => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            status: m.status,
            name: m.user?.name || null,
          })),
        });
      } else {
        setSuccessOpen(true);
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (inviteGroup) {
    return (
      <div className="cw-layout">
        <CoworkingInviteScreen group={inviteGroup} />
      </div>
    );
  }

  return (
    <div className={`cw-layout${refreshing ? ' is-refreshing' : ''}`}>
      <aside className="cw-aside">
        <div className="cw-aside__photo" style={{ backgroundImage: `url(${cover})` }} />
        <div className="cw-aside__body">
          <h2>{space?.title || 'Площадка'}</h2>
          {space?.address ? (
            <p>
              <MapPin size={14} aria-hidden /> {space.address}
            </p>
          ) : null}
          <span className="cw-aside__seats">
            {busy
              ? 'Загрузка…'
              : left > 0
                ? `Свободно мест: ${left} из ${space?.capacity ?? 0}`
                : space
                  ? 'мест нет на этот час'
                  : 'Загрузка…'}
          </span>
        </div>
      </aside>

      <div className="cw-flow">
        <div className="cw-flow-steps">
          <fieldset className="cw-field">
            <legend>Как записываетесь</legend>
            <div className="cw-mode-switch" role="group" aria-label="Формат записи">
              <button
                type="button"
                className={mode === 'SOLO' ? 'is-active' : ''}
                aria-pressed={mode === 'SOLO'}
                onClick={() => setMode('SOLO')}
              >
                Для себя
              </button>
              <button
                type="button"
                className={mode === 'GROUP' ? 'is-active' : ''}
                aria-pressed={mode === 'GROUP'}
                onClick={() => setMode('GROUP')}
              >
                Группой
              </button>
            </div>
          </fieldset>

          <label className="cw-field">
            <span>Площадка</span>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              disabled={busy || spaces.length === 0}
            >
              {spaces.length === 0 ? <option value="">Загрузка…</option> : null}
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <SvcDateField value={dayKey} min={todayYmd()} onChange={setDayKey} />

          <div className="cw-field" role="group" aria-labelledby="cw-interval-label">
            <span id="cw-interval-label">Час</span>
            <p className="cw-field-hint">Выберите почасовой слот (Москва)</p>
            <div className="cw-periods cw-periods--hours">
              {COWORKING_PERIODS.map((p) => {
                const info = space?.periods.find((x) => x.id === p.id);
                const slotLeft = info?.left;
                const full = typeof slotLeft === 'number' && slotLeft <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`cw-period cw-period--hour${period === p.id ? ' is-active' : ''}${full ? ' is-full' : ''}`}
                    aria-pressed={period === p.id}
                    onClick={() => setPeriod(p.id)}
                  >
                    <strong>
                      {p.start}–{p.end}
                    </strong>
                    <em>
                      {typeof slotLeft === 'number'
                        ? slotLeft > 0
                          ? `Свободно мест: ${slotLeft}`
                          : 'нет мест'
                        : busy
                          ? '…'
                          : '—'}
                    </em>
                  </button>
                );
              })}
            </div>
          </div>

          {periodDef ? (
            <div className="cw-slot-summary" aria-live="polite">
              <strong>Выбрано</strong>
              <p>
                {periodDef.start}–{periodDef.end} · {mode === 'SOLO' ? 'для себя' : 'группой'} ·{' '}
                {participants} {participants === 1 ? 'участник' : participants < 5 ? 'участника' : 'участников'}
              </p>
            </div>
          ) : null}

          {mode === 'GROUP' ? (
            <div className="cw-field">
              <span>Количество участников</span>
              <div className="cw-stepper">
                <button
                  type="button"
                  aria-label="Меньше"
                  disabled={participants <= 2}
                  onClick={() => setSeats((n) => clampCoworkingSeats(n - 1, seatsMax))}
                >
                  −
                </button>
                <strong>{participants}</strong>
                <button
                  type="button"
                  aria-label="Больше"
                  disabled={participants >= seatsMax}
                  onClick={() => setSeats((n) => clampCoworkingSeats(n + 1, seatsMax))}
                >
                  +
                </button>
              </div>
              <span className="cw-field-hint">Организатор занимает 1 место. Можно пригласить ещё {Math.max(0, participants - 1)}.</span>
            </div>
          ) : null}

          <label className="cw-field">
            <span>Цель визита</span>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="">Необязательно</option>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {mode === 'GROUP' ? (
            <section className="cw-open-group" aria-label="Открытая группа">
              <h3>Открытая группа</h3>
              <ul className="cw-open-group__facts">
                <li>
                  <span>Организатор</span>
                  <strong>Вы</strong>
                </li>
                <li>
                  <span>Уже в группе</span>
                  <strong>1 из {participants}</strong>
                </li>
                <li>
                  <span>Останется мест</span>
                  <strong>{Math.max(0, participants - 1)}</strong>
                </li>
                <li>
                  <span>Набор</span>
                  <strong>откроется после записи</strong>
                </li>
              </ul>
            </section>
          ) : null}
        </div>

        {error ? <p className="cw-error">{error}</p> : null}
        {message && !successOpen ? <p className="cw-ok">{message}</p> : null}

        <div className="cw-actions">
          {left > 0 || busy ? (
            <button
              type="button"
              className="btn btn-primary cw-cta"
              disabled={submitting || !spaceId || busy || (mode === 'GROUP' && left < participants)}
              onClick={() => submit(false)}
            >
              {submitting ? 'Записываем…' : mode === 'GROUP' ? 'Создать группу' : 'Записаться'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary cw-cta"
              disabled={submitting || !spaceId}
              onClick={() => submit(true)}
            >
              {submitting ? 'Отправляем…' : 'В лист ожидания'}
            </button>
          )}
          <Link href="/spaces" className="cw-cta-link">
            К площадкам
          </Link>
        </div>
      </div>

      <ServiceSplitModal
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          router.push('/dashboard?tab=coworking');
        }}
        title={successMeta?.waitlist ? 'В листе ожидания' : 'Ты в коворкинге'}
        ariaLabel="Запись оформлена"
        aside={
          <div className="svc-modal__aside-inner">
            <div className="svc-modal__cover" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" />
            </div>
            {qrUrl && !successMeta?.waitlist ? (
              <div className="svc-modal__qr">
                <QRCodeDisplay value={qrUrl} size={200} />
              </div>
            ) : (
              <p className="svc-modal__aside-note">Покажите пропуск из кабинета на входе</p>
            )}
          </div>
        }
        footer={
          <>
            <Link href="/dashboard" className="btn btn-primary" onClick={() => setSuccessOpen(false)}>
              {qrUrl ? 'QR на входе' : 'В кабинет'}
            </Link>
            <button type="button" className="btn btn-secondary" onClick={() => setSuccessOpen(false)}>
              Закрыть
            </button>
          </>
        }
      >
        {successMeta ? (
          <p className="svc-modal__lead">
            {successMeta.waitlist ? 'Заявка в лист ожидания: ' : ''}
            «{successMeta.title}», {formatRuLong(successMeta.day)}
            {successMeta.start ? `, ${successMeta.start}–${successMeta.end}` : ''}.
          </p>
        ) : null}
      </ServiceSplitModal>
    </div>
  );
}
