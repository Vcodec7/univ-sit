import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DashboardCharts from '@/components/DashboardCharts';
import { CheckSquare, CalendarDays, BarChart3, ScanLine, ShieldAlert, Server } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission, parsePermissions } from '@/lib/acl';
import { redirect } from 'next/navigation';
import { formatMskTimeRange } from '@/lib/booking-hours';

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

      {can('bookings') && (
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
            <p className="admin-dash__empty">На сегодня ничего не стоит.</p>
          )}
        </section>
      )}

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
                  app.status === 'PENDING' ? 'Ждёт' : app.status === 'APPROVED' ? 'Ок' : 'Нет';
                return (
                  <li key={app.id}>
                    <Link href={`/admin/applications?status=${app.status}&focus=${app.id}`} prefetch>
                      <strong>{title}</strong>
                      <span>{app.user.name || app.user.email}</span>
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
