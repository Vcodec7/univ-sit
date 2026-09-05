import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  buildOccupancyWeek,
  buildWeekDayKeys,
  nextFreeWindow,
  parseOpenClose,
} from '@/lib/hall-occupancy';
import { spaceCover } from '@/lib/theme-covers';
import EntityCoverImage from '@/components/EntityCoverImage';
import HomeSlideRail from '@/components/HomeSlideRail';
import { encodeRouteParam } from '@/lib/route-id';
import { isCoworkingSpace } from '@/lib/coworking';
import { isNextBuildPhase } from '@/lib/build-phase';

type FreeNowCard = {
  id: string;
  title: string;
  address: string | null;
  category: string | null;
  image: string | null;
  coworking: boolean;
  slotLabel: string;
  idx: number;
};

const loadFreeNowCards = unstable_cache(
  async (limit: number): Promise<FreeNowCard[]> => {
    if (isNextBuildPhase()) return [];
    const spaces = await prisma.space.findMany({
      where: { status: 'ACTIVE', isDemoData: false },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        address: true,
        category: true,
        image: true,
        bookingMode: true,
        openTime: true,
        closeTime: true,
        slotStepMin: true,
      },
    });
    if (!spaces.length) return [];

    const settings = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: { bookingOpenTime: true, bookingCloseTime: true },
    });
    const dayKeys = buildWeekDayKeys(new Date(), 2);
    const rangeStart = new Date(`${dayKeys[0]}T00:00:00+03:00`);
    const rangeEnd = new Date(`${dayKeys[dayKeys.length - 1]}T23:59:59+03:00`);
    const ids = spaces.map((s) => s.id);

    const [bookings, closures] = await Promise.all([
      prisma.booking.findMany({
        where: {
          spaceId: { in: ids },
          status: { in: ['APPROVED', 'PENDING'] },
          startTime: { lt: rangeEnd },
          endTime: { gt: rangeStart },
        },
        select: {
          id: true,
          spaceId: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          contactMode: true,
        },
      }),
      prisma.spaceClosure.findMany({
        where: {
          spaceId: { in: ids },
          startTime: { lt: rangeEnd },
          endTime: { gt: rangeStart },
        },
        select: { spaceId: true, startTime: true, endTime: true, kind: true, note: true },
      }),
    ]);

    return spaces
      .map((space, idx) => {
        const { openMin, closeMin } = parseOpenClose(
          space.openTime,
          space.closeTime,
          settings?.bookingOpenTime,
          settings?.bookingCloseTime
        );
        const week = buildOccupancyWeek({
          openMin,
          closeMin,
          stepMin: space.slotStepMin === 30 ? 30 : 60,
          dayKeys,
          bookings: bookings.filter((b) => b.spaceId === space.id),
          closures: closures.filter((c) => c.spaceId === space.id),
        });
        const next = nextFreeWindow(week);
        if (!next) return null;
        return {
          id: space.id,
          title: space.title,
          address: space.address,
          category: space.category,
          image: space.image,
          coworking: isCoworkingSpace(space),
          slotLabel: next.label,
          idx,
        };
      })
      .filter((c): c is FreeNowCard => Boolean(c))
      .slice(0, limit);
  },
  ['free-now-home-v1'],
  { revalidate: 45, tags: ['yp-home-catalog'] }
);

export default async function FreeNowSpaces({ limit = 6 }: { limit?: number }) {
  if (isNextBuildPhase()) return null;
  const cards = await loadFreeNowCards(limit);
  if (!cards.length) return null;

  return (
    <section className="home-section free-now">
      <div className="home-section-head">
        <div>
          <h2 className="home-section-title">Сейчас свободно</h2>
          <p className="home-section-sub">Ближайшие окна на площадках ЦРМ</p>
        </div>
        <Link href="/spaces" className="home-section-link">
          Все пространства
        </Link>
      </div>
      <HomeSlideRail label="Сейчас свободно">
        {cards.map((card) => (
          <article key={card.id} className="free-now-card yp-feed-card">
            <div className="free-now-avatar yp-feed-card__media">
              <EntityCoverImage
                src={spaceCover(card, card.idx)}
                alt={card.title}
                fallback={spaceCover(card, card.idx + 2)}
                className="free-now-img"
                sizes="(max-width: 768px) 85vw, 280px"
              />
            </div>
            <div className="free-now-body">
              <span className="free-now-badge">{card.category || 'Площадка'}</span>
              <h3>{card.title}</h3>
              <p>{card.address || 'Сочи'}</p>
              <strong className="free-now-slot">{card.slotLabel}</strong>
              <div className="free-now-actions">
                <Link href={`/spaces/${encodeRouteParam(card.id)}`} className="btn btn-secondary">
                  Сетка
                </Link>
                {card.coworking ? (
                  <Link href={`/coworking?space=${encodeURIComponent(card.id)}`} className="btn btn-primary">
                    В коворкинг
                  </Link>
                ) : (
                  <Link href={`/spaces/${encodeRouteParam(card.id)}/book?from=list`} className="btn btn-primary">
                    Забронировать
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </HomeSlideRail>
    </section>
  );
}
