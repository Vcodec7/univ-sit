'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cabinetGet } from '@/lib/cabinet-fetch';

type CwSignup = {
  id: string;
  status: string;
  kind?: string;
  startTime: string;
  endTime: string;
  inviteToken?: string | null;
  space: { id: string; title: string };
};

type EventPart = {
  id: string;
  booking: {
    id: string;
    title?: string | null;
    status?: string;
    startTime: string;
    endTime: string;
    space?: { title?: string | null } | null;
  };
};

type HallBooking = {
  id: string;
  title?: string | null;
  status: string;
  startTime: string;
  endTime: string;
  space?: { title?: string | null } | null;
};

type Row = {
  key: string;
  kind: 'cowork' | 'event' | 'hall';
  title: string;
  place: string;
  start: string;
  end: string;
  status: string;
  canCancel: boolean;
  cancelLabel: string;
  groupHref?: string | null;
};

function isPast(end: string) {
  return new Date(end).getTime() < Date.now();
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'short',
  });
}

function fmtSlot(start: string, end: string) {
  const a = new Date(start).toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  });
  const b = new Date(end).toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${a}–${b}`;
}

function kindRu(kind: Row['kind']) {
  if (kind === 'event') return 'афиша';
  if (kind === 'hall') return 'зал';
  return 'коворкинг';
}

function statusRu(kind: Row['kind'], s: string) {
  const u = String(s || '').toUpperCase();
  if (kind === 'event') {
    if (u === 'CHECKED_IN') return 'отмечен';
    if (u === 'NO_SHOW') return 'неявка';
    return 'запись';
  }
  switch (u) {
    case 'PENDING':
      return 'ожидает';
    case 'CONFIRMED':
    case 'APPROVED':
      return 'подтверждена';
    case 'CANCELLED':
    case 'REJECTED':
      return 'отменена';
    case 'ATTENDED':
      return 'визит';
    case 'NO_SHOW':
      return 'неявка';
    case 'WAITLIST':
      return 'лист ожидания';
    default:
      return s;
  }
}

export default function CoworkingCabinetList() {
  const [signups, setSignups] = useState<CwSignup[]>([]);
  const [events, setEvents] = useState<EventPart[]>([]);
  const [halls, setHalls] = useState<HallBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'now' | 'history'>('now');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) setLoading(true);
    try {
      const [cw, parts, books] = await Promise.all([
        fetch('/api/coworking?mine=1', { credentials: 'same-origin' }).then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.message || 'Ошибка коворкинга');
          return (data.signups || []) as CwSignup[];
        }),
        cabinetGet('/api/user/participations'),
        cabinetGet('/api/user/bookings'),
      ]);
      setSignups(Array.isArray(cw) ? cw : []);
      setEvents(Array.isArray(parts) ? parts : []);
      setHalls(Array.isArray(books) ? books : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const row of signups) {
      const live = ['PENDING', 'CONFIRMED', 'WAITLIST'].includes(row.status) && !isPast(row.endTime);
      out.push({
        key: `cw-${row.id}`,
        kind: 'cowork',
        title: row.space.title,
        place: row.space.title,
        start: row.startTime,
        end: row.endTime,
        status: row.status,
        canCancel: live,
        cancelLabel: 'Отменить',
        groupHref:
          row.kind === 'GROUP' && row.inviteToken ? `/coworking/group/${row.inviteToken}` : null,
      });
    }
    for (const part of events) {
      const b = part.booking;
      if (!b?.id) continue;
      const live = !isPast(b.endTime);
      out.push({
        key: `ev-${part.id}`,
        kind: 'event',
        title: b.title || 'Мероприятие',
        place: b.space?.title || 'Афиша',
        start: b.startTime,
        end: b.endTime,
        status: live ? 'CONFIRMED' : 'ATTENDED',
        canCancel: live,
        cancelLabel: 'Отменить участие',
      });
    }
    for (const booking of halls) {
      const live =
        booking.status !== 'REJECTED' && booking.status !== 'CANCELLED' && !isPast(booking.endTime);
      out.push({
        key: `hall-${booking.id}`,
        kind: 'hall',
        title: booking.title || booking.space?.title || 'Бронь зала',
        place: booking.space?.title || 'Зал',
        start: booking.startTime,
        end: booking.endTime,
        status: booking.status,
        canCancel: live,
        cancelLabel: 'Отменить бронь',
      });
    }
    out.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    return out;
  }, [signups, events, halls]);

  const nowRows = rows.filter((r) => r.canCancel || (!isPast(r.end) && !['CANCELLED', 'REJECTED'].includes(r.status)));
  const historyRows = rows.filter((r) => !nowRows.includes(r));
  const visible = tab === 'now' ? nowRows : historyRows;

  async function cancelRow(row: Row) {
    if (busy) return;
    const ok = window.confirm(
      row.kind === 'event'
        ? 'Отменить участие? Билет станет недействительным.'
        : row.kind === 'hall'
          ? 'Отменить бронь пространства?'
          : 'Отменить запись в коворкинг?'
    );
    if (!ok) return;
    setBusy(row.key);
    try {
      if (row.kind === 'cowork') {
        const id = row.key.slice(3);
        const r = await fetch(`/api/coworking?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Не удалось отменить');
      } else if (row.kind === 'event') {
        const part = events.find((p) => `ev-${p.id}` === row.key);
        const bookingId = part?.booking?.id;
        if (!bookingId) throw new Error('Не найдена запись');
        const r = await fetch(`/api/bookings/${bookingId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Не удалось отменить');
      } else {
        const id = row.key.slice(5);
        const r = await fetch(`/api/user/bookings/${id}/cancel`, { method: 'POST' });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Не удалось отменить');
      }
      toast.success('Отменено');
      await load({ soft: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="cw-cabinet" aria-label="Мои записи">
      <div className="cw-cabinet-head">
        <h2>Мои записи</h2>
        <Link href="/coworking" className="svc-pill svc-pill--brand">
          Записаться
        </Link>
      </div>
      <div className="cw-cabinet-tabs" role="tablist" aria-label="Активные и история">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'now'}
          className={`cw-cabinet-tab${tab === 'now' ? ' is-on' : ''}`}
          onClick={() => setTab('now')}
        >
          Сейчас <span>{nowRows.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={`cw-cabinet-tab${tab === 'history' ? ' is-on' : ''}`}
          onClick={() => setTab('history')}
        >
          История <span>{historyRows.length}</span>
        </button>
      </div>
      {error ? <p className="cw-error">{error}</p> : null}
      {loading && rows.length === 0 ? (
        <div className="svc-skel" aria-hidden>
          <div className="svc-skel__pill" />
          <div className="svc-skel__pill" />
        </div>
      ) : null}
      {!loading && visible.length === 0 ? (
        <p className="svc-empty-inline">
          {tab === 'now' ? 'Сейчас нет активных записей. ' : 'История пока пустая. '}
          <Link href="/coworking">Коворкинг</Link>
          {' · '}
          <Link href="/events">Афиша</Link>
          {' · '}
          <Link href="/spaces">Залы</Link>
          {tab === 'now' && historyRows.length > 0 ? (
            <>
              {' · '}
              <button type="button" className="cw-cabinet-history-link" onClick={() => setTab('history')}>
                Открыть историю
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      {visible.length > 0 ? (
        <ul className="cw-cabinet-pills">
          {visible.map((row) => (
            <li key={row.key} className={`cw-cabinet-pill${row.kind === 'cowork' ? '' : ` is-${row.kind}`}`}>
              <span className="cw-cabinet-pill__day">{fmtDay(row.start)}</span>
              <span className="cw-cabinet-pill__slot">{fmtSlot(row.start, row.end)}</span>
              <span className="cw-cabinet-pill__place">
                {kindRu(row.kind)} · {row.title}
                {row.place && row.place !== row.title ? ` · ${row.place}` : ''}
              </span>
              <span className={`cw-cabinet-pill__status status-${row.status.toLowerCase()}`}>
                {statusRu(row.kind, row.status)}
              </span>
              {row.groupHref || row.canCancel || row.kind === 'event' ? (
                <div className="cw-cabinet-pill__actions">
                  {row.groupHref ? (
                    <Link href={row.groupHref} className="cw-cabinet-pill__group">
                      Группа
                    </Link>
                  ) : null}
                  {row.kind === 'event' ? (
                    <Link href="/dashboard/tickets" className="cw-cabinet-pill__group">
                      Билет
                    </Link>
                  ) : null}
                  {row.canCancel ? (
                    <button
                      type="button"
                      className="cw-cabinet-pill__cancel"
                      disabled={busy === row.key}
                      onClick={() => cancelRow(row)}
                    >
                      {row.cancelLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
