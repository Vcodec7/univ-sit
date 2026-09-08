import { prisma } from '@/lib/prisma';
import { parsePassCode } from '@/lib/tickets';
import { resolvePresenceToken } from '@/lib/presence-qr';
import { todayKey } from '@/lib/coworking';
import { BOOKING_TZ } from '@/lib/booking-hours';
import { recordAttendanceCheckIn } from '@/lib/reliability';
import { evaluateAchievements } from '@/lib/award-achievements';

type Guest = { id: string; name: string | null; email: string | null; phone: string | null; image: string | null };

export type ScannerCheckResult = {
  http: number;
  body: Record<string, unknown>;
};

function clockHm(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: BOOKING_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function ticketHeadline(eventTitle: string) {
  return `Участник подтвержден (${eventTitle})`;
}

function coworkHeadline(spaceTitle: string, start: Date, end: Date) {
  return `Бронь подтверждена (${spaceTitle}, ${clockHm(start)}-${clockHm(end)})`;
}

async function holderById(userId: string): Promise<Guest | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, image: true },
  });
}

async function checkTicketPass(opts: {
  bookingId: string;
  userId: string;
  passType: 'ticket' | 'space';
  expectedBookingId: string | null;
  scannedById: string;
  method: string;
}): Promise<ScannerCheckResult> {
  const { bookingId, userId, passType, expectedBookingId, scannedById, method } = opts;

  if (expectedBookingId && expectedBookingId !== bookingId) {
    return {
      http: 400,
      body: { ok: false, status: 'WRONG_EVENT', message: 'Билет от другого мероприятия', passType },
    };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      space: { select: { id: true, title: true, address: true } },
      user: { select: { id: true, name: true } },
      participants: { where: { userId }, select: { id: true } },
    },
  });

  if (!booking) {
    return { http: 404, body: { ok: false, status: 'NOT_FOUND', message: 'Мероприятие не найдено', passType } };
  }

  if (booking.status !== 'APPROVED') {
    return {
      http: 400,
      body: {
        ok: false,
        status: 'NOT_APPROVED',
        message: 'Мероприятие ещё не подтверждено',
        passType,
        event: { title: booking.title, space: booking.space?.title },
      },
    };
  }

  const holder = await holderById(userId);
  if (!holder) {
    return { http: 404, body: { ok: false, status: 'USER_NOT_FOUND', message: 'Участник не найден', passType } };
  }

  const isOrganizer = booking.userId === userId;
  const isParticipant = booking.participants.length > 0;
  if (!isOrganizer && !isParticipant) {
    return {
      http: 400,
      body: {
        ok: false,
        status: 'NOT_REGISTERED',
        message: 'Гость не записан на это мероприятие',
        passType,
        event: { title: booking.title, space: booking.space?.title },
        guest: holder,
      },
    };
  }

  const existing = await prisma.ticketCheckIn.findUnique({
    where: { bookingId_userId: { bookingId, userId } },
  });

  const event = {
    id: booking.id,
    title: booking.title,
    startTime: booking.startTime,
    endTime: booking.endTime,
    space: booking.space,
  };
  const headline = ticketHeadline(booking.title);

  if (existing) {
    return {
      http: 409,
      body: {
        ok: false,
        status: 'ALREADY_CHECKED',
        message: 'Билет уже был проверен ранее',
        checkedAt: existing.createdAt,
        passType,
        headline,
        event,
        guest: holder,
      },
    };
  }

  const checkIn = await prisma.ticketCheckIn.create({
    data: { bookingId, userId, scannedById, method },
  });

  await recordAttendanceCheckIn(bookingId, userId);
  await evaluateAchievements(userId).catch(() => null);

  const checkedCount = await prisma.ticketCheckIn.count({ where: { bookingId } });
  const registeredCount = (await prisma.bookingParticipant.count({ where: { bookingId } })) + 1;

  const { notifyStaffCheckIn } = await import('@/lib/security');
  await notifyStaffCheckIn({
    guestName: holder.name || holder.phone || holder.email || 'Участник',
    eventTitle: booking.title,
    spaceTitle: booking.space?.title,
    bookingId,
    guestId: userId,
    checkInId: checkIn.id,
  }).catch(() => null);

  return {
    http: 200,
    body: {
      ok: true,
      status: 'OK',
      message: 'Проход разрешён',
      passType,
      headline,
      checkInId: checkIn.id,
      checkedAt: checkIn.createdAt,
      event,
      guest: holder,
      stats: { checkedCount, registeredCount },
    },
  };
}

async function checkCoworkingPass(opts: {
  signupId: string;
  userId: string | null;
  scannedById: string;
  method: string;
}): Promise<ScannerCheckResult> {
  const signup = await prisma.coworkingSignup.findUnique({
    where: { id: opts.signupId },
    include: {
      space: { select: { id: true, title: true, address: true } },
      user: { select: { id: true, name: true } },
      members: { select: { userId: true, status: true } },
    },
  });

  if (!signup) {
    return {
      http: 404,
      body: { ok: false, status: 'NOT_FOUND', message: 'Бронь коворкинга не найдена', passType: 'coworking' },
    };
  }

  const holderId =
    opts.userId ||
    signup.userId;

  const isHost = signup.userId === holderId;
  const isMember = signup.members.some((m) => m.userId === holderId && m.status === 'APPROVED');
  if (!isHost && !isMember) {
    const holder = await holderById(holderId);
    return {
      http: 400,
      body: {
        ok: false,
        status: 'NOT_REGISTERED',
        message: 'Гость не записан в эту бронь коворкинга',
        passType: 'coworking',
        guest: holder,
        event: { title: signup.space?.title, space: signup.space },
      },
    };
  }

  if (['CANCELLED', 'WAITLIST', 'NO_SHOW'].includes(signup.status)) {
    return {
      http: 400,
      body: {
        ok: false,
        status: 'NOT_APPROVED',
        message: 'Бронь коворкинга не подтверждена',
        passType: 'coworking',
        event: { title: signup.space?.title, space: signup.space },
      },
    };
  }

  const holder = await holderById(holderId);
  if (!holder) {
    return { http: 404, body: { ok: false, status: 'USER_NOT_FOUND', message: 'Участник не найден', passType: 'coworking' } };
  }

  const headline = coworkHeadline(signup.space?.title || 'Коворкинг', signup.startTime, signup.endTime);
  const event = {
    id: signup.id,
    title: signup.space?.title || 'Коворкинг',
    startTime: signup.startTime,
    endTime: signup.endTime,
    space: signup.space,
  };

  const existing = await prisma.presenceCheckIn.findUnique({
    where: { userId_dayKey_slotKey: { userId: holderId, dayKey: signup.dayKey, slotKey: `cw:${signup.id}` } },
  });

  if (existing) {
    return {
      http: 409,
      body: {
        ok: false,
        status: 'ALREADY_CHECKED',
        message: 'Бронь уже была проверена ранее',
        checkedAt: existing.createdAt,
        passType: 'coworking',
        headline,
        event,
        guest: holder,
      },
    };
  }

  const checkIn = await prisma.presenceCheckIn.create({
    data: {
      userId: holderId,
      scannedById: opts.scannedById,
      spaceId: signup.spaceId,
      coworkingSignupId: signup.id,
      dayKey: signup.dayKey,
      slotKey: `cw:${signup.id}`,
      metaJson: JSON.stringify({ method: opts.method }),
    },
  });

  if (signup.status === 'CONFIRMED') {
    await prisma.coworkingSignup.update({
      where: { id: signup.id },
      data: { status: 'ATTENDED' },
    });
  }

  await evaluateAchievements(holderId).catch(() => null);

  return {
    http: 200,
    body: {
      ok: true,
      status: 'OK',
      message: 'Проход разрешён',
      passType: 'coworking',
      headline,
      checkInId: checkIn.id,
      checkedAt: checkIn.createdAt,
      event,
      guest: holder,
    },
  };
}

async function resolveCoworkingForUser(userId: string) {
  const now = new Date();
  const day = todayKey(now);
  const windowMs = 45 * 60 * 1000;
  const rows = await prisma.coworkingSignup.findMany({
    where: {
      dayKey: day,
      status: { in: ['CONFIRMED', 'ATTENDED', 'PENDING'] },
      OR: [{ userId }, { members: { some: { userId, status: 'APPROVED' } } }],
    },
    include: { space: { select: { id: true, title: true, address: true } } },
    orderBy: { startTime: 'asc' },
    take: 8,
  });
  const overlapping = rows.filter(
    (r) => r.startTime.getTime() - windowMs <= now.getTime() && r.endTime.getTime() + windowMs >= now.getTime()
  );
  return overlapping[0] || rows[0] || null;
}

export async function runScannerCheck(opts: {
  code: string;
  method: string;
  expectedBookingId: string | null;
  scannedById: string;
}): Promise<ScannerCheckResult> {
  const parsed = parsePassCode(opts.code);
  if (!parsed) {
    return {
      http: 400,
      body: {
        ok: false,
        status: 'INVALID',
        message: 'Неверный формат QR. Нужен билет, бронь коворкинга или пространства.',
      },
    };
  }

  if (parsed.type === 'ticket' || parsed.type === 'space') {
    return checkTicketPass({
      bookingId: parsed.id,
      userId: parsed.userId,
      passType: parsed.type,
      expectedBookingId: opts.expectedBookingId,
      scannedById: opts.scannedById,
      method: opts.method,
    });
  }

  if (parsed.type === 'coworking') {
    const cowork = await checkCoworkingPass({
      signupId: parsed.id,
      userId: parsed.userId,
      scannedById: opts.scannedById,
      method: opts.method,
    });
    if (cowork.http !== 404 || parsed.userId) return cowork;

    const booking = await prisma.booking.findUnique({
      where: { id: parsed.id },
      select: { id: true, userId: true },
    });
    if (!booking) return cowork;
    return checkTicketPass({
      bookingId: booking.id,
      userId: booking.userId,
      passType: 'space',
      expectedBookingId: opts.expectedBookingId,
      scannedById: opts.scannedById,
      method: opts.method,
    });
  }

  if (parsed.type !== 'presence') {
    return {
      http: 400,
      body: {
        ok: false,
        status: 'INVALID',
        message: 'Неверный формат QR. Нужен билет, бронь коворкинга или пространства.',
      },
    };
  }

  const resolved = await resolvePresenceToken(parsed.token);
  if (!resolved.ok) {
    return {
      http: 400,
      body: { ok: false, status: resolved.code, message: resolved.message, passType: 'presence' },
    };
  }

  const signup = await resolveCoworkingForUser(resolved.user.id);
  if (signup) {
    return checkCoworkingPass({
      signupId: signup.id,
      userId: resolved.user.id,
      scannedById: opts.scannedById,
      method: opts.method,
    });
  }

  const now = new Date();
  const eventWindow = {
    startTime: { lte: new Date(now.getTime() + 2 * 3600000) },
    endTime: { gte: new Date(now.getTime() - 30 * 60000) },
    status: 'APPROVED' as const,
  };
  const asGuest = await prisma.bookingParticipant.findFirst({
    where: {
      userId: resolved.user.id,
      attendanceStatus: { in: ['PENDING', 'CHECKED_IN'] },
      booking: {
        ...eventWindow,
        ...(opts.expectedBookingId ? { id: opts.expectedBookingId } : {}),
      },
    },
    select: { bookingId: true },
  });
  const asHost = await prisma.booking.findFirst({
    where: {
      userId: resolved.user.id,
      ...eventWindow,
      ...(opts.expectedBookingId ? { id: opts.expectedBookingId } : {}),
    },
    select: { id: true, userId: true },
  });
  const bookingId = asGuest?.bookingId || asHost?.id;
  if (bookingId) {
    return checkTicketPass({
      bookingId,
      userId: resolved.user.id,
      passType: 'ticket',
      expectedBookingId: opts.expectedBookingId,
      scannedById: opts.scannedById,
      method: opts.method,
    });
  }

  const holder = await holderById(resolved.user.id);
  return {
    http: 400,
    body: {
      ok: false,
      status: 'NOT_REGISTERED',
      message: 'Нет активной брони коворкинга и нет билета на ближайшее мероприятие',
      passType: 'presence',
      guest: holder,
    },
  };
}
