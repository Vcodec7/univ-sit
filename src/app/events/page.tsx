import UpcomingEvents from '@/components/UpcomingEvents';
import GlobalCalendar from '@/components/GlobalCalendar';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSiteIdentityStatic, identityFromSettings } from '@/lib/site-identity';
import { brandedMetadata } from '@/lib/branded-metadata';
import AuthAfishaSection from '@/components/AuthAfishaSection';
import { isNextBuildPhase } from '@/lib/build-phase';
import { getCachedPublicClubs } from '@/lib/public-catalogs';
import { encodeRouteParam } from '@/lib/route-id';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteIdentityStatic();
  return brandedMetadata('Афиша мероприятий', {
    description: `Календарь мероприятий — ${siteName}. Запись на события и бронирование площадок.`,
    canonicalPath: '/events',
  });
}

export const revalidate = 60;
export const dynamic = 'force-static';

export default async function EventsPage() {
  const settings = isNextBuildPhase()
    ? null
    : await prisma.siteSettings.findUnique({
        where: { id: '1' },
        select: {
          publicEventsVisibility: true,
          siteName: true,
          publicSiteUrl: true,
        },
      });
  const identity = identityFromSettings(settings);
  const clubs = await getCachedPublicClubs().catch(() => []);

  const upcoming =
    isNextBuildPhase() || !settings?.publicEventsVisibility
      ? []
      : await prisma.booking.findMany({
          where: { status: 'APPROVED', startTime: { gte: new Date() } },
          include: { space: { select: { title: true, address: true } } },
          orderBy: { startTime: 'asc' },
          take: 20,
        });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Афиша мероприятий',
    itemListElement: upcoming.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: e.title,
        startDate: e.startTime.toISOString(),
        endDate: e.endTime.toISOString(),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: e.space?.title || 'Площадка',
          address: e.space?.address || 'Сочи',
        },
        organizer: {
          '@type': 'Organization',
          name: identity.siteName,
          url: identity.publicOrigin,
        },
      },
    })),
  };

  return (
    <div className="container" style={{ padding: '1rem 1rem 3rem', minHeight: 'auto' }}>
      {upcoming.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}

      <h1 className="page-hero-title" style={{ marginBottom: '0.35rem' }}>
        Афиша мероприятий
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.15rem', fontSize: '0.98rem' }}>
        Календарь, ближайшие события площадок и клубы, куда можно записаться
      </p>

      <section aria-label="Календарь" style={{ marginBottom: '1.75rem' }}>
        <GlobalCalendar />
      </section>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.85rem' }}>Ближайшие события</h2>
      {settings?.publicEventsVisibility ? (
        <UpcomingEvents hideTitle mode="grid" />
      ) : (
        <AuthAfishaSection hideTitle />
      )}

      {clubs.length ? (
        <section className="home-section" style={{ marginTop: '1.75rem' }} aria-label="Клубы">
          <div className="home-section-head">
            <h2 className="home-section-title" style={{ fontSize: '1.2rem' }}>
              Клубы
            </h2>
            <Link href="/clubs" className="home-section-link">
              Все клубы
            </Link>
          </div>
          <ul className="events-clubs-list">
            {clubs.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/clubs/${encodeRouteParam(c.id)}`}>{c.title.replace(/^Клуб:\s*/i, '')}</Link>
                {c.meetingSchedule ? <span>{c.meetingSchedule}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
