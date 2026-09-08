import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyEventReminder } from '@/lib/notifications';
import { settleNoShows } from '@/lib/reliability';
import { cronAuthorized } from '@/lib/cron-auth';

/**
 * Cron: event email reminders + settle no-shows.
 * Auth: Authorization: Bearer $CRON_SECRET or header x-cron-secret.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: '1' },
    select: { reminderHoursBefore: true },
  });
  const hours = settings?.reminderHoursBefore ?? 24;
  const now = Date.now();
  const windowStart = new Date(now + (hours - 0.5) * 3600 * 1000);
  const windowEnd = new Date(now + (hours + 0.5) * 3600 * 1000);

  const events = await prisma.booking.findMany({
    where: {
      status: 'APPROVED',
      reminderSentAt: null,
      startTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      space: true,
      user: { select: { email: true } },
      participants: { include: { user: { select: { email: true } } } },
    },
    take: 50,
  });

  let sent = 0;
  for (const event of events) {
    const recipients = new Set<string>();
    if (event.user?.email) recipients.add(event.user.email);
    for (const p of event.participants) {
      if (p.user?.email) recipients.add(p.user.email);
    }

    for (const to of recipients) {
      const res = await notifyEventReminder({
        to,
        bookingId: event.id,
        title: event.title,
        spaceTitle: event.space?.title,
        spaceAddress: event.space?.address,
        startTime: event.startTime,
        endTime: event.endTime,
      });
      if (res.success) sent += 1;
    }

    await prisma.booking.update({
      where: { id: event.id },
      data: { reminderSentAt: new Date() },
    });
  }

  const attendance = await settleNoShows(100);
  const { autoApproveDueAccounts } = await import('@/lib/account-moderation');
  const moderation = await autoApproveDueAccounts();
  const forceMonthly = new URL(req.url).searchParams.get('monthly') === '1';
  const { sendMonthlyVisitReport } = await import('@/lib/monthly-admin-report');
  const monthly = await sendMonthlyVisitReport({ force: forceMonthly }).catch((e) => ({
    ok: false,
    error: e instanceof Error ? e.message : 'report_failed',
  }));

  return NextResponse.json({
    ok: true,
    events: events.length,
    emailsSent: sent,
    hours,
    attendance,
    moderation,
    monthly,
  });
}
