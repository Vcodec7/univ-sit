'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Ban,
  Building2,
  CalendarDays,
  ChevronRight,
  FolderKanban,
  HandHeart,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMskDate, formatMskTime } from '@/lib/booking-hours';
import { cabinetGet } from '@/lib/cabinet-fetch';
import { fetchPublicStatusCached } from '@/lib/public-status-client';

const QRCodeDisplay = dynamic(() => import('@/components/QRCodeDisplay'), { ssr: false });
const EditBookingDetails = dynamic(() => import('@/components/EditBookingDetails'), { ssr: false });

type AppsTab = 'projects' | 'clubs' | 'programs' | 'events' | 'spaces';

const VACANCY_STATUS: Record<string, string> = {
  PENDING: 'Черновик',
  SCREENING: 'Предотбор',
  PENDING_REVIEW: 'На рассмотрении',
  APPROVED: 'Принято',
  REJECTED: 'Отклонено',
  WITHDRAWN: 'Отозвано',
};

function statusBadge(status: string) {
  const pending = status === 'PENDING';
  const approved = status === 'APPROVED';
  return (
    <span
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: pending ? '#fef3c7' : approved ? '#dcfce7' : '#fee2e2',
        color: pending ? '#d97706' : approved ? '#166534' : '#991b1b',
      }}
    >
      {pending ? 'На модерации' : approved ? 'Одобрено' : 'Отклонено'}
    </span>
  );
}

function rejectNote(reason?: string | null) {
  if (!reason) return null;
  return (
    <p
      style={{
        margin: '0.65rem 0 0',
        padding: '0.55rem 0.7rem',
        borderRadius: 8,
        background: '#fef2f2',
        border: '1px solid rgba(153,27,27,0.15)',
        color: '#991b1b',
        fontSize: '0.85rem',
        lineHeight: 1.4,
      }}
    >
      <span style={{ fontWeight: 700 }}>Причина: </span>
      {reason}
    </p>
  );
}

function emptyBox(text: string, href?: string, linkLabel?: string) {
  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(0,0,0,0.02)',
        textAlign: 'center',
      }}
    >
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: href ? '0 0 0.85rem' : 0 }}>{text}</p>
      {href && linkLabel ? (
        <a href={href} className="btn btn-primary" style={{ display: 'inline-block' }}>
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}

export default function ApplicationsCabinet() {
  const router = useRouter();
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean> | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [vacancyApplications, setVacancyApplications] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [appsSubTab, setAppsSubTab] = useState<AppsTab>('projects');
  const [ticketBusy, setTicketBusy] = useState(false);
  const [bookingBusyId, setBookingBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicStatusCached()
      .then((d) => {
        if (d?.modules && typeof d.modules === 'object') setModuleFlags(d.modules as Record<string, boolean>);
        else setModuleFlags({});
      })
      .catch(() => setModuleFlags({}));
  }, []);

  useEffect(() => {
    if (!moduleFlags) return;
    if (moduleFlags.applications === false) {
      router.replace('/dashboard');
      return;
    }
    const on = (key: string) => moduleFlags[key] !== false;
    let cancelled = false;
    void (async () => {
      if (on('events')) {
        const data = await cabinetGet('/api/user/bookings');
        if (!cancelled && Array.isArray(data)) setBookings(data);
        const parts = await cabinetGet('/api/user/participations');
        if (!cancelled && Array.isArray(parts)) setParticipations(parts);
      }
      if (on('vacancies')) {
        const d = await cabinetGet('/api/vacancies/apply');
        if (!cancelled) setVacancyApplications(Array.isArray(d?.items) ? d.items : []);
      }
      if (on('applications')) {
        const data = await cabinetGet('/api/user/applications');
        if (!cancelled && Array.isArray(data)) setApplications(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleFlags, router]);

  const projectApplications = useMemo(() => applications.filter((app) => app.project), [applications]);
  const clubApplications = useMemo(
    () => applications.filter((app) => app.club && !app.project),
    [applications]
  );
  const programApplications = useMemo(() => applications.filter((app) => app.program), [applications]);

  const refreshParticipations = async () => {
    const data = await cabinetGet('/api/user/participations');
    if (Array.isArray(data)) setParticipations(data);
  };

  const refreshBookings = async () => {
    const data = await cabinetGet('/api/user/bookings');
    if (Array.isArray(data)) setBookings(data);
  };

  const cancelParticipation = async (bookingId: string) => {
    if (!bookingId || ticketBusy) return;
    if (!window.confirm('Отменить участие в мероприятии? Билет станет недействительным.')) return;
    setTicketBusy(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Не удалось отменить');
      toast.success(data.message || 'Участие отменено');
      await refreshParticipations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setTicketBusy(false);
    }
  };

  const cancelSpaceBooking = async (bookingId: string) => {
    if (!bookingId || bookingBusyId) return;
    if (!window.confirm('Отменить бронь пространства?')) return;
    setBookingBusyId(bookingId);
    try {
      const res = await fetch(`/api/user/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Не удалось отменить');
      toast.success(data.message || 'Бронь отменена');
      await refreshBookings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBookingBusyId(null);
    }
  };

  const subTabs = [
    { id: 'projects' as const, label: 'Проекты', icon: FolderKanban, count: projectApplications.length },
    { id: 'clubs' as const, label: 'Клубы', icon: Users, count: clubApplications.length },
    { id: 'programs' as const, label: 'Программы', icon: HandHeart, count: programApplications.length },
    { id: 'events' as const, label: 'Афиша', icon: CalendarDays, count: participations.length },
    { id: 'spaces' as const, label: 'Брони', icon: Building2, count: bookings.length },
  ];

  const cardStyle = {
    padding: '1.25rem',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'white',
    textDecoration: 'none',
    color: 'inherit',
  } as const;

  return (
    <div className="applications-cabinet">
      {vacancyApplications.length > 0 ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Мои отклики на вакансии</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {vacancyApplications.map((va: any) => (
              <li key={va.id} className="card-surface" style={{ padding: '0.75rem 1rem' }}>
                <a href={`/vacancies/${va.vacancy?.id}`} style={{ fontWeight: 700 }}>
                  {va.vacancy?.title || 'Вакансия'}
                </a>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {va.vacancy?.employer?.title} · {VACANCY_STATUS[va.status as string] || 'Неизвестно'}
                  {va.autoScore != null ? ` · предотбор ${va.autoScore}%` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div role="tablist" aria-label="Тип заявок" className="dashboard-apps-tabs">
        {subTabs.map((tab) => {
          const active = appsSubTab === tab.id;
          const Icon = tab.icon;
          const tip =
            tab.id === 'spaces'
              ? 'Бронирование пространств'
              : tab.id === 'events'
                ? 'Мероприятия афиши'
                : tab.id === 'programs'
                  ? 'Гранты, добро, самоуправление'
                  : tab.label;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tip}
              title={tip}
              onClick={() => setAppsSubTab(tab.id)}
              className={`dashboard-apps-tab is-icon-only${active ? ' is-active' : ''}`}
            >
              <span className="dashboard-apps-tab-icon">
                <Icon size={18} aria-hidden />
                {tab.count > 0 ? (
                  <span
                    className="dashboard-apps-tab-count"
                    style={{
                      background: active ? 'var(--primary)' : 'rgba(15,23,42,0.08)',
                      color: active ? '#fff' : '#475569',
                    }}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                ) : null}
              </span>
              <span className="dashboard-apps-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <p className="dashboard-apps-tabs-hint" aria-live="polite">
        {subTabs.find((t) => t.id === appsSubTab)?.label ?? 'Заявки'}
      </p>

      {appsSubTab === 'projects' &&
        (projectApplications.length === 0
          ? emptyBox('Пока нет заявок в проекты', '/projects', 'Смотреть проекты')
          : (
            <div className="dashboard-apps-grid">
              {projectApplications.map((app) => (
                <a key={app.id} href={`/projects/${encodeURIComponent(app.project.id)}`} style={cardStyle}>
                  <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{app.project.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {statusBadge(app.status)}
                  </div>
                  {app.status === 'REJECTED' ? rejectNote(app.rejectReason) : null}
                </a>
              ))}
            </div>
          ))}

      {appsSubTab === 'clubs' &&
        (clubApplications.length === 0
          ? emptyBox('Пока нет заявок в клубы', '/clubs', 'Смотреть клубы')
          : (
            <div className="dashboard-apps-grid">
              {clubApplications.map((app) => (
                <a key={app.id} href={`/clubs/${encodeURIComponent(app.club.id)}`} style={cardStyle}>
                  <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{app.club.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {statusBadge(app.status)}
                  </div>
                  {app.status === 'REJECTED' ? rejectNote(app.rejectReason) : null}
                </a>
              ))}
            </div>
          ))}

      {appsSubTab === 'programs' &&
        (programApplications.length === 0
          ? emptyBox('Пока нет заявок в гранты, добро и самоуправление', '/grants', 'Смотреть гранты')
          : (
            <div className="dashboard-apps-grid">
              {programApplications.map((app) => {
                const kind = app.program?.kind;
                const href =
                  kind === 'DOBRO'
                    ? `/dobro/${app.program.id}`
                    : kind === 'SELF_GOV'
                      ? `/self-gov/${app.program.id}`
                      : `/grants/${app.program.id}`;
                const kindLabel = kind === 'DOBRO' ? 'Добро' : kind === 'SELF_GOV' ? 'Самоуправление' : 'Грант';
                return (
                  <a key={app.id} href={href} style={cardStyle}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>{kindLabel}</div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{app.program.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      {statusBadge(app.status)}
                    </div>
                    {app.status === 'REJECTED' ? rejectNote(app.rejectReason) : null}
                  </a>
                );
              })}
            </div>
          ))}

      {appsSubTab === 'events' &&
        (participations.length === 0
          ? emptyBox('Пока нет записей на мероприятия', '/events', 'Открыть афишу')
          : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => router.push('/tickets')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                >
                  Открыть билеты
                </button>
              </div>
              <div className="dashboard-apps-grid">
                {participations.map((part: any) => {
                  const b = part.booking;
                  const ended = b?.endTime && new Date(b.endTime).getTime() < Date.now();
                  return (
                    <div
                      key={part.id}
                      style={{
                        padding: '1.25rem',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => router.push('/tickets')}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          font: 'inherit',
                          color: 'inherit',
                          width: '100%',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{b.title}</h4>
                          <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                            {b.space?.title || 'Без площадки'}
                          </p>
                          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            {formatMskDate(b.startTime, { day: 'numeric', month: 'short' })} {formatMskTime(b.startTime)} (МСК)
                          </span>
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Открыть билет <ChevronRight size={14} />
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          <QRCodeDisplay value={part.ticketCode || ''} />
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Билет</div>
                        </div>
                      </button>
                      {!ended ? (
                        <button
                          type="button"
                          onClick={() => cancelParticipation(b.id)}
                          disabled={ticketBusy}
                          style={{
                            alignSelf: 'flex-start',
                            border: '1px solid rgba(185,28,28,0.25)',
                            background: 'rgba(254,226,226,0.45)',
                            color: '#b91c1c',
                            borderRadius: 10,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ban size={14} />
                          Отменить запись
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

      {appsSubTab === 'spaces' &&
        (bookings.length === 0
          ? emptyBox('Пока нет бронирований пространств', '/spaces', 'Смотреть пространства')
          : (
            <div className="dashboard-apps-grid">
              {bookings.map((booking) => {
                const canCancel =
                  booking.status !== 'REJECTED' &&
                  booking.endTime &&
                  new Date(booking.endTime).getTime() >= Date.now();
                return (
                  <div
                    key={booking.id}
                    style={{
                      padding: '1.25rem',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'white',
                    }}
                  >
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{booking.title}</h4>
                    <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                      {booking.space?.title}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {formatMskDate(booking.startTime, { day: 'numeric', month: 'short' })} {formatMskTime(booking.startTime)}{' '}
                        (МСК)
                      </span>
                      {statusBadge(booking.status)}
                    </div>
                    {booking.status === 'REJECTED' ? rejectNote(booking.rejectReason) : null}
                    {booking.description ? (
                      <p
                        style={{
                          margin: '0.65rem 0 0',
                          fontSize: '0.82rem',
                          color: '#64748b',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {booking.description}
                      </p>
                    ) : (
                      <p style={{ margin: '0.65rem 0 0', fontSize: '0.78rem', color: '#b45309' }}>
                        Добавьте анонс — в афише пока только название
                      </p>
                    )}
                    {canCancel ? (
                      <>
                        <EditBookingDetails
                          booking={booking}
                          onSaved={(next) => {
                            setBookings((prev) => prev.map((b) => (b.id === next.id ? { ...b, ...next } : b)));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => cancelSpaceBooking(booking.id)}
                          disabled={bookingBusyId === booking.id}
                          style={{
                            marginTop: 8,
                            border: '1px solid rgba(185,28,28,0.25)',
                            background: 'rgba(254,226,226,0.45)',
                            color: '#b91c1c',
                            borderRadius: 10,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ban size={14} />
                          {bookingBusyId === booking.id ? 'Отмена…' : 'Отменить бронь'}
                        </button>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
    </div>
  );
}
