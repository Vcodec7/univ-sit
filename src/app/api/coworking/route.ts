import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/csrf-origin';
import { aclJsonError, requireEndUser, requireUser } from '@/lib/acl';
import {
  activeSignupStatuses,
  canCancelFree,
  COWORKING_MAX_SEATS,
  COWORKING_PERIODS,
  coworkingKind,
  isCoworkingSpace,
  occupiedSeatStatuses,
  periodBounds,
  spaceBookingMode,
  todayKey,
} from '@/lib/coworking';
import { getCoworkingAvailability } from '@/lib/coworking-availability';
import { groupInclude, newCoworkingInviteToken } from '@/lib/coworking-group';
import { adjustScore, M_BALL } from '@/lib/score-scales';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';
  const spaceId = url.searchParams.get('spaceId') || undefined;
  const dayKey = url.searchParams.get('day') || todayKey();

  if (mine) {
    try {
      const session = await requireUser();
      const rows = await prisma.coworkingSignup.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        orderBy: { startTime: 'desc' },
        include: {
          space: { select: { id: true, title: true, address: true, image: true, capacity: true } },
          members: { select: { userId: true, status: true, role: true } },
        },
        take: 80,
      });
      return NextResponse.json({ signups: rows });
    } catch (e) {
      return aclJsonError(e);
    }
  }

  const payload = await getCoworkingAvailability(dayKey);
  const spaces = spaceId ? payload.spaces.filter((s) => s.id === spaceId) : payload.spaces;
  return NextResponse.json({ dayKey: payload.dayKey, spaces });
}

export async function POST(req: Request) {
  const originBlock = assertSameOrigin(req);
  if (originBlock) return originBlock;

  let session;
  try {
    session = await requireEndUser();
  } catch (e) {
    return aclJsonError(e);
  }

  const body = await req.json().catch(() => null);
  const spaceId = String(body?.spaceId || '');
  const dayKey = String(body?.dayKey || todayKey());
  const period = String(body?.period || 'H13');
  const seats = Math.min(
    COWORKING_MAX_SEATS,
    Math.max(1, Math.floor(Number(body?.seats)) || 1)
  );
  const purpose = body?.purpose ? String(body.purpose).slice(0, 80) : null;
  const waitlist = Boolean(body?.waitlist);
  const kind = coworkingKind(body?.kind);
  const seatsToBook = kind === 'SOLO' ? 1 : seats;

  if (!spaceId || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return NextResponse.json({ message: 'Укажите площадку и дату' }, { status: 400 });
  }
  if (!COWORKING_PERIODS.some((p) => p.id === period)) {
    return NextResponse.json({ message: 'Неверный интервал' }, { status: 400 });
  }

  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space || space.status !== 'ACTIVE' || !isCoworkingSpace(space)) {
    return NextResponse.json({ message: 'Коворкинг не найден' }, { status: 404 });
  }

  const { start, end } = periodBounds(dayKey, period);
  if (end.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Этот интервал уже прошёл' }, { status: 400 });
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const overlap = await tx.coworkingSignup.findFirst({
        where: {
          userId: session.user.id,
          status: { in: [...activeSignupStatuses()] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (overlap) {
        throw new Error('OVERLAP');
      }

      if (spaceBookingMode(space) === 'BOTH') {
        const hallBusy = await tx.booking.findFirst({
          where: {
            spaceId,
            status: { in: ['PENDING', 'APPROVED'] },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          select: { id: true },
        });
        if (hallBusy) {
          throw new Error('HALL');
        }
      }

      const usedAgg = await tx.coworkingSignup.findMany({
        where: {
          spaceId,
          dayKey,
          status: { in: [...occupiedSeatStatuses()] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { seats: true },
      });
      const used = usedAgg.reduce((a, s) => a + s.seats, 0);
      const left = space.capacity - used;

      if (left < seatsToBook) {
        if (!waitlist && left <= 0) {
          throw new Error('FULL');
        }
        if (!waitlist) {
          throw Object.assign(new Error('LEFT'), { left });
        }
      }

      const status = left < seatsToBook ? 'WAITLIST' : 'CONFIRMED';
      const inviteToken = kind === 'GROUP' && status === 'CONFIRMED' ? newCoworkingInviteToken() : null;
      return tx.coworkingSignup.create({
        data: {
          spaceId,
          userId: session.user.id,
          dayKey,
          period,
          startTime: start,
          endTime: end,
          seats: seatsToBook,
          purpose,
          status,
          kind,
          inviteToken,
          joinOpen: kind === 'GROUP',
          members:
            kind === 'GROUP' && status === 'CONFIRMED'
              ? {
                  create: {
                    userId: session.user.id,
                    role: 'HOST',
                    status: 'APPROVED',
                  },
                }
              : undefined,
        },
        include: groupInclude(),
      });
    });

    return NextResponse.json({ ok: true, signup: row }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'OVERLAP') {
      return NextResponse.json({ message: 'У вас уже есть запись на это время' }, { status: 409 });
    }
    if (msg === 'HALL') {
      return NextResponse.json({ message: 'Зал занят бронью в это время' }, { status: 409 });
    }
    if (msg === 'FULL') {
      return NextResponse.json({ message: 'Мест нет', left: 0, canWaitlist: true }, { status: 409 });
    }
    if (msg === 'LEFT') {
      const left = Number((e as { left?: number }).left || 0);
      return NextResponse.json({ message: `Осталось мест: ${Math.max(0, left)}`, left }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: Request) {
  const originBlock = assertSameOrigin(req);
  if (originBlock) return originBlock;

  let session;
  try {
    session = await requireEndUser();
  } catch (e) {
    return aclJsonError(e);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ message: 'Нет id' }, { status: 400 });

  const row = await prisma.coworkingSignup.findUnique({ where: { id } });
  if (!row || row.userId !== session.user.id) {
    return NextResponse.json({ message: 'Запись не найдена' }, { status: 404 });
  }
  if (!['PENDING', 'CONFIRMED', 'WAITLIST'].includes(row.status)) {
    return NextResponse.json({ message: 'Запись нельзя отменить' }, { status: 400 });
  }

  const free = canCancelFree(row.startTime);
  await prisma.coworkingSignup.update({
    where: { id },
    data: { status: free ? 'CANCELLED' : 'NO_SHOW' },
  });

  if (!free) {
    await adjustScore({
      userId: session.user.id,
      scale: 'M_BALL',
      delta: M_BALL.BOOKING_NO_SHOW,
      reason: 'Неявка / поздняя отмена коворкинга',
      meta: { coworkingSignupId: id },
    });
  }

  return NextResponse.json({ ok: true, late: !free });
}
