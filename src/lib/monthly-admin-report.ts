import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getVisitSnapshot } from '@/lib/visit-analytics';
import { logAdminAction } from '@/lib/admin-audit';
import { createUserNotification } from '@/lib/security';
import { getSiteIdentity } from '@/lib/site-identity';
import { BOOKING_TZ } from '@/lib/booking-hours';

function mskParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const grab = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  return { year: grab('year'), month: grab('month'), day: grab('day') };
}

export function previousCalendarMonth(now = new Date()) {
  const { year, month } = mskParts(now);
  const thisStart = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+03:00`);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = new Date(`${prevYear}-${String(prevMonth).padStart(2, '0')}-01T00:00:00+03:00`);
  const prevEnd = new Date(thisStart.getTime() - 1);
  const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const label = prevStart.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: BOOKING_TZ,
  });
  return { gte: prevStart, lte: prevEnd, label, key };
}

export async function sendMonthlyVisitReport(opts?: { force?: boolean; now?: Date }) {
  const now = opts?.now || new Date();
  const { day } = mskParts(now);
  if (!opts?.force && day !== 1) {
    return { ok: true, skipped: 'not_first_day' as const };
  }

  const month = previousCalendarMonth(now);
  const action = `MONTHLY_VISIT_${month.key}`;
  const already = await prisma.adminAuditLog.findFirst({
    where: { action },
    select: { id: true },
  });
  if (already && !opts?.force) {
    return { ok: true, skipped: 'already_sent' as const, month: month.key };
  }

  const snap = await getVisitSnapshot({ gte: month.gte, lte: month.lte });
  const { siteName, publicOrigin } = await getSiteIdentity();
  const subject = `${siteName}: отчёт за ${month.label}`;
  const body = `<p>Сводка, кто приходил отдыхать, работать и на мероприятия.</p>
    <ul>
      <li>Афиша: записей ${snap.eventsRegistered}, проходов ${snap.eventsCheckedIn}</li>
      <li>Коворкинг: записей ${snap.coworkSignups}, визитов ${snap.coworkAttended}, отметок входа ${snap.coworkPresence}</li>
      <li>Залы: одобренных броней ${snap.hallBookings}</li>
      <li>Неявки ${snap.noShows}</li>
      <li>Разных людей ${snap.uniquePeople}</li>
    </ul>
    <p><a href="${publicOrigin}/admin/stats?period=month">Открыть статистику</a></p>`;

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'MODERATOR'] },
      blockedAt: null,
      deletedAt: null,
    },
    select: { id: true, email: true },
    take: 40,
  });

  let emailed = 0;
  for (const s of staff) {
    await createUserNotification({
      userId: s.id,
      type: 'STATS_REPORT',
      title: `Месячный отчёт · ${month.label}`,
      body: `Афиша ${snap.eventsCheckedIn} · коворкинг ${snap.coworkAttended} · залы ${snap.hallBookings} · люди ${snap.uniquePeople}`,
      meta: { href: '/admin/stats?period=month', month: month.key },
    }).catch(() => null);
    if (s.email) {
      const res = await sendEmail(s.email, subject, body);
      if (res.success) emailed += 1;
    }
  }

  await logAdminAction({
    actorId: 'cron',
    actorRole: 'TECH',
    action,
    targetType: 'stats',
    detail: { ...snap, emailed, staff: staff.length },
  });

  return { ok: true, month: month.key, emailed, staff: staff.length, snap };
}
