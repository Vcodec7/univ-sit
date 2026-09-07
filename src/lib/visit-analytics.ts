import { prisma } from '@/lib/prisma';

export type DateWindow = { gte?: Date; lte?: Date };

export type VisitSnapshot = {
  eventsRegistered: number;
  eventsCheckedIn: number;
  coworkSignups: number;
  coworkAttended: number;
  coworkPresence: number;
  hallBookings: number;
  noShows: number;
  uniquePeople: number;
};

function createdAt(window: DateWindow) {
  if (!window.gte && !window.lte) return undefined;
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (window.gte) createdAt.gte = window.gte;
  if (window.lte) createdAt.lte = window.lte;
  return { createdAt };
}

function startTime(window: DateWindow) {
  if (!window.gte && !window.lte) return undefined;
  const startTime: { gte?: Date; lte?: Date } = {};
  if (window.gte) startTime.gte = window.gte;
  if (window.lte) startTime.lte = window.lte;
  return { startTime };
}

/** Who came: афиша (QR), коворкинг (запись/визит), зал (бронь). */
export async function getVisitSnapshot(window: DateWindow = {}): Promise<VisitSnapshot> {
  const created = createdAt(window);
  const starts = startTime(window);

  const [
    eventsRegistered,
    eventsCheckedIn,
    eventUserRows,
    coworkSignups,
    coworkAttended,
    coworkPresence,
    coworkUsers,
    presenceUsers,
    hallBookings,
    hallUsers,
    noShowEvents,
    noShowCowork,
  ] = await Promise.all([
    prisma.bookingParticipant.count({ where: created }),
    prisma.ticketCheckIn.count({ where: created }),
    prisma.ticketCheckIn.groupBy({
      by: ['userId'],
      where: created,
      _count: true,
    }),
    prisma.coworkingSignup.count({ where: starts || created }),
    prisma.coworkingSignup.count({
      where: { status: 'ATTENDED', ...(starts || created) },
    }),
    prisma.presenceCheckIn.count({ where: created }),
    prisma.coworkingSignup.findMany({
      where: starts || created,
      select: { userId: true },
      take: 4000,
    }),
    prisma.presenceCheckIn.findMany({
      where: created,
      select: { userId: true },
      take: 4000,
    }),
    prisma.booking.count({
      where: { status: 'APPROVED', ...(starts || {}) },
    }),
    prisma.booking.findMany({
      where: { status: 'APPROVED', ...(starts || {}) },
      select: { userId: true },
      take: 4000,
    }),
    prisma.bookingParticipant.count({
      where: { attendanceStatus: 'NO_SHOW', ...(created || {}) },
    }),
    prisma.coworkingSignup.count({
      where: { status: 'NO_SHOW', ...(starts || created) },
    }),
  ]);

  const unique = new Set<string>();
  for (const row of eventUserRows) if (row.userId) unique.add(row.userId);
  for (const row of coworkUsers) if (row.userId) unique.add(row.userId);
  for (const row of presenceUsers) if (row.userId) unique.add(row.userId);
  for (const row of hallUsers) if (row.userId) unique.add(row.userId);

  return {
    eventsRegistered,
    eventsCheckedIn,
    coworkSignups,
    coworkAttended,
    coworkPresence,
    hallBookings,
    noShows: noShowEvents + noShowCowork,
    uniquePeople: unique.size,
  };
}
