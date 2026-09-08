import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DashboardCharts from '@/components/DashboardCharts';
import { CheckSquare, CalendarDays, BarChart3, ScanLine, ShieldAlert, Server } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission, parsePermissions } from '@/lib/acl';
import { redirect } from 'next/navigation';
import { formatMskTimeRange } from '@/lib/booking-hours';
import { updateBookingStatus } from '@/app/admin/bookings/actions';
import EmptyState from '@/components/ui/EmptyState';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin');
  const role = session.user.role || '';
  if (role !== 'ADMIN' && role !== 'MODERATOR') redirect('/dashboard');

  const perms = parsePermissions(session.user.permissions);
  const can = (key: Parameters<typeof hasPermission>[2]) => hasPermission(role, session.user.permissions, key);
  const isAdmin = role === 'ADMIN';

  const [
    pendingApplicationsCount,
    projectsCount,
    clubsCount,
    usersCount,
    spacesCount,
    pendingBookingsCount,
    recentApplications,
    todayEvents,
    applicationsGroup,
    modReviewers,
    openModerationCount,
    weekEventsCount,
    linkedMessengers,
  ] = await Promise.all([
    can('applications')
      ? prisma.application.count({ where: { status: 'PENDING' } })
      : Promise.resolve(0),
    can('projects') ? prisma.project.count() : Promise.resolve(0),
    can('clubs') ? prisma.club.count() : Promise.resolve(0),
    isAdmin ? prisma.user.count({ where: { deletedAt: null } }) : Promise.resolve(0),
    can('spaces') ? prisma.space.count() : Promise.resolve(0),
    can('bookings')
      ? prisma.booking.count({ where: { status: 'PENDING', endTime: { gte: new Date() } } })
      : Promise.resolve(0),
    can('applications')
      ? prisma.application.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
            project: true,
            club: true,
            program: true,
          },
        })
      : Promise.resolve([]),
    can('bookings')
      ? prisma.booking.findMany({
          where: {
            status: 'APPROVED',
            startTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
          include: {
            space: true,
            user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
            participants: true,
          },
        })
      : Promise.resolve([]),
    can('applications')
      ? prisma.application.groupBy({ by: ['status'], _count: true })
      : Promise.resolve([]),
    can('moderation')
      ? prisma.contentFlag.groupBy({
          by: ['reviewedById'],
          where: {
            reviewedById: { not: null },
            reviewedAt: { gte: new Date(Date.now() - 30 * 86400000) },
            status: { in: ['REVIEWED', 'ACTIONED', 'DISMISSED'] },
          },
          _count: { _all: true },
          orderBy: { _count: { reviewedById: 'desc' } },
          take: 5,
        })
      : Promise.resolve([]),
    can('moderation')
      ? prisma.contentFlag.count({ where: { status: 'OPEN' } })
      : Promise.resolve(0),
    can('bookings')
      ? prisma.booking.count({
          where: {
            status: 'APPROVED',
            startTime: {
              gte: new Date(Date.now() - 7 * 86400000),
              lte: new Date(Date.now() + 7 * 86400000),
            },
          },
        })
      : Promise.resolve(0),
    isAdmin
      ? prisma.user.count({
          where: {
            deletedAt: null,
            OR: [{ telegramChatId: { not: null } }, { maxUserId: { not: null } }],
          },
        })
      : Promise.resolve(0),
  ]);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  });

  let userStats = last7Days.map((date) => ({ date, count: 0 }));
  if (isAdmin) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, role: { not: 'TECH' } },
      select: { createdAt: true },
    });
    userStats = last7Days.map((dateStr) => {
      const count = recentUsers.filter(
        (u) =>
          u.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) === dateStr
      ).length;
      return { date: dateStr, count };
    });
  }

  const reviewerIds = modReviewers
    .map((r) => r.reviewedById)
    .filter((id): id is string => Boolean(id));
  const reviewerUsers = reviewerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true, nickname: true },
      })
    : [];
  const reviewerMap = new Map(reviewerUsers.map((u) => [u.id, u]));
  const hallOfFame = modReviewers.map((r, i) => {
    const u = r.reviewedById ? reviewerMap.get(r.reviewedById) : null;
    return {
      rank: i + 1,
      name: u?.nickname || u?.name || 'Модератор',
      count: r._count._all,
      userId: r.reviewedById,
    };
  });

  const appStats = applicationsGroup.map((group) => {
    let name = 'Ожидает';
    let color = '#f59e0b';
    if (group.status === 'APPROVED') {
      name = 'Одобрено';
      color = '#10b981';
    }
    if (group.status === 'REJECTED') {
      name = 'Отклонено';
      color = '#ef4444';
    }
    return { name, value: group._count, color };
  });

  const attention: Array<{
    href: string;
    label: string;
    hint: string;
    value: number;
    icon: typeof CheckSquare;
  }> = [];
  if (can('applications')) {
    attention.push({
      href: '/admin/applications?status=PENDING',
      label: 'Заявки',
      hint: 'ждут решения',
      value: pendingApplicationsCount,
      icon: CheckSquare,
    });
  }
  if (can('bookings')) {
    attention.push({
      href: '/admin/bookings?status=PENDING',
      label: 'Бронь',
      hint: 'на согласование',
      value: pendingBookingsCount,
      icon: CalendarDays,
    });
  }
  if (can('moderation')) {
    attention.push({
      href: '/admin/moderation',
      label: 'Модерация',
      hint: 'открытых флагов',
      value: openModerationCount,
      icon: ShieldAlert,
    });
  }

  const catalog: Array<{ href: string; label: string; value: number }> = [];
  if (isAdmin) catalog.push({ href: '/admin/users', label: 'Люди', value: usersCount });
  if (can('projects')) catalog.push({ href: '/admin/projects', label: 'Проекты', value: projectsCount });
  if (can('clubs')) catalog.push({ href: '/admin/clubs', label: 'Клубы', value: clubsCount });
  if (can('spaces')) catalog.push({ href: '/admin/spaces', label: 'Площадки', value: spacesCount });
  if (can('bookings')) catalog.push({ href: '/admin/bookings?status=APPROVED', label: 'Неделя', value: weekEventsCount });
  if (isAdmin) catalog.push({ href: '/admin/bots', label: 'Боты', value: linkedMessengers });

  const hotCount = attention.reduce((n, a) => n + a.value, 0);

  const nowTick = new Date();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);
  let hallLoadPct = 0;
  let pendingToday: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    space: { title: string } | null;
    user: { name: string | null; email: string | null } | null;
  }> = [];
  if (can('bookings')) {
    const [halls, busy, pending] = await Promise.all([
      prisma.space.count({ where: { status: 'ACTIVE', bookingMode: { in: ['HALL', 'BOTH'] } } }),
      prisma.booking.count({
        where: { status: 'APPROVED', startTime: { lte: nowTick }, endTime: { gte: nowTick } },
      }),
      prisma.booking.findMany({
        where: { status: 'PENDING', startTime: { gte: dayStart, lte: dayEnd } },
        orderBy: { startTime: 'asc' },
        take: 12,
        include: {
          space: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      }),
    ]);
    hallLoadPct = halls ? Math.min(100, Math.round((busy / halls) * 100)) : 0;
    pendingToday = pending;
  }

  return (
    <div className="admin-page-shell admin-dash">
      <header className="admin-dash__head">
        <div>
          <h1>Сегодня</h1>
          <p>
            {isAdmin
              ? hotCount
                ? `В очереди ${hotCount} — сначала это.`
                : 'Очередь пуста. Каталог и события ниже.'
              : `Модератор${perms.length ? ` · ${perms.join(', ')}` : ' · права назначит администратор'}`}
          </p>
        </div>
        <nav className="admin-dash__tools" aria-label="Сервисы">
          {isAdmin && (
            <Link href="/admin/system" prefetch>
              <Server size={15} /> Сервер
            </Link>
          )}
          {can(['stats', 'bookings']) && (
            <a href="#admin-analytics">
              <BarChart3 size={15} /> Графики
            </a>
          )}
          {can('scanner') && (
            <Link href="/admin/scanner" prefetch>
              <ScanLine size={15} /> Сканер
            </Link>
          )}
        </nav>
      </header>

      {can('bookings') ? (
        <section className="admin-kpi" aria-label="Показатели дня">
          <div className="admin-kpi__card">
            <strong>{hallLoadPct}%</strong>
            <span>Загрузка залов сейчас</span>
          </div>
          <div className="admin-kpi__card">
            <strong>{pendingBookingsCount}</strong>
            <span>Новых заявок на бронь</span>
          </div>
          <div className="admin-kpi__card">
            <strong>{todayEvents.reduce((n, e) => n + (e.participants?.length || 0), 0)}</strong>
            <span>Гостей на сегодня</span>
          </div>
        </section>
      ) : null}

      {attention.length ? (
        <section className="admin-dash__now" aria-label="Очередь">
          {attention.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-dash__now-card${item.value > 0 ? ' is-hot' : ''}`}
                prefetch
              >
                <Icon size={18} aria-hidden />
                <strong>{item.value}</strong>
                <span>
                  {item.label}
                  <small>{item.hint}</small>
                </span>
              </Link>
            );
          })}
        </section>
      ) : null}

      {catalog.length ? (
        <nav className="admin-dash__catalog" aria-label="Разделы">
          {catalog.map((item) => (
            <Link key={item.href} href={item.href} prefetch>
              <b>{item.value}</b>
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {can('bookings') ? (
        <section className="admin-dash__block">
          <div className="admin-dash__block-head">
            <h2>Бронь на сегодня — очередь</h2>
            <Link href="/admin/bookings?status=PENDING" prefetch>
              Все
            </Link>
          </div>
          {pendingToday.length ? (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Событие</th>
                    <th>Время</th>
                    <th>Площадка</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pendingToday.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.title}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                          {staffUserLabel(row.user)}
                        </div>
                      </td>
                      <td>{formatMskTimeRange(row.startTime, row.endTime)}</td>
                      <td>{row.space?.title || '—'}</td>
                      <td>
                        <form action={updateBookingStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <button type="submit" className="btn btn-primary yp-btn yp-btn--sm">
                            Одобрить
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Ожидающих броней на сегодня нет" hint="Новые заявки появятся в этой таблице." />
          )}
        </section>
      ) : null}

      {can('bookings') ? (
        <section className="admin-dash__block">
          <div className="admin-dash__block-head">
            <h2>События сегодня</h2>
            <Link href="/admin/bookings?status=APPROVED" prefetch>
              Все
            </Link>
          </div>
          {todayEvents.length ? (
            <ul className="admin-dash__events">
              {todayEvents.map((event) => (
                <li key={event.id}>
                  <Link href={`/admin/bookings?status=APPROVED&view=${event.id}`} prefetch>
                    <strong>{event.title}</strong>
                    <span>
                      {formatMskTimeRange(event.startTime, event.endTime)} · {event.space?.title}
                    </span>
                    <em>{event.participants?.length || 0} чел.</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="На сегодня ничего не стоит" />
          )}
        </section>
      ) : null}

      {can('applications') && (
        <section className="admin-dash__block">
          <div className="admin-dash__block-head">
            <h2>Последние заявки</h2>
            <Link href="/admin/applications?status=PENDING" prefetch>
              Очередь
            </Link>
          </div>
          {recentApplications.length ? (
            <ul className="admin-dash__apps">
              {recentApplications.map((app) => {
                const title = app.project
                  ? `Проект «${app.project.title}»`
                  : app.club
                    ? `Клуб «${app.club.title}»`
                    : app.program
                      ? `${
                          app.program.kind === 'GRANT'
                            ? 'Грант'
                            : app.program.kind === 'DOBRO'
                              ? 'Добро'
                              : 'Самоупр.'
                        } «${app.program.title}»`
                      : 'Заявка';
                const st =
                  app.status === 'PENDING'
                    ? 'На рассмотрении'
                    : app.status === 'APPROVED'
                      ? 'Одобрено'
                      : 'Отклонено';
                return (
                  <li key={app.id}>
                    <Link href={`/admin/applications?status=${app.status}&focus=${app.id}`} prefetch>
                      <strong>{title}</strong>
                      <span>{staffUserLabel(app.user)}</span>
                      <em className={`is-${app.status.toLowerCase()}`}>{st}</em>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="admin-dash__empty">Новых заявок нет.</p>
          )}
        </section>
      )}

      {can('moderation') ? (
        <section className="admin-dash__block">
          <div className="admin-dash__block-head">
            <h2>Модераторы · 30 дней</h2>
            <Link href="/admin/moderation" prefetch>
              Флаги
            </Link>
          </div>
          {hallOfFame.length === 0 ? (
            <p className="admin-dash__empty">Пока нет разобранных флагов.</p>
          ) : (
            <ol className="admin-dash__hof">
              {hallOfFame.map((r) => (
                <li key={r.userId || r.rank}>
                  <span>#{r.rank}</span>
                  <strong>{r.name}</strong>
                  <em>{r.count}</em>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {(isAdmin || can('applications')) && (
        <div id="admin-analytics" className="admin-dash__charts">
          <DashboardCharts userStats={userStats} appStats={appStats} />
        </div>
      )}
    </div>
  );
}
