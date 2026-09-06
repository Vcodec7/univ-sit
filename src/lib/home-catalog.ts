import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { publishedNonDemoWhere, publicCatalogWhere } from '@/lib/publish';
import { isNextBuildPhase } from '@/lib/build-phase';

export const HOME_FEED_TAKE = 8;

function homeExcerpt(html: string | null | undefined, n = 180): string {
  const t = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).replace(/\s+\S*$/, '')}…`;
}

/** Cached homepage catalog + hero settings (ISR, same window as public pages). */
export const getHomeCatalog = unstable_cache(
  async () => {
    if (isNextBuildPhase()) {
      // Docker builder has no DB — still bake sensible hero defaults so the
      // first static HTML is not stuck on photo-only until ISR catches up.
      return {
        latestProjects: [] as Array<{
          id: string;
          title: string;
          description: string;
          image: string | null;
        }>,
        latestClubs: [] as Array<{
          id: string;
          title: string;
          description: string;
          image: string | null;
        }>,
        latestSpaces: [] as Array<{
          id: string;
          title: string;
          description: string | null;
          image: string | null;
          address: string | null;
          capacity: number;
        }>,
        latestNews: [] as Array<{
          id: string;
          title: string | null;
          text: string;
          imageUrl: string | null;
          videoEmbedUrl: string | null;
          publishedAt: string | null;
          createdAt: string;
        }>,
        siteSettings: {
          heroImageUrl: '/covers/photo/sochi-sea.jpg',
          heroVideoUrl: '',
          heroMediaKind: 'image',
          heroAnimationMode: 'animated',
          govWidgetsEnabled: null,
          govWidgetsTitle: null,
          govWidgetsJson: null,
          galleryHomepageEnabled: null,
          galleryPublicEnabled: null,
          orgGalleryJson: null,
          siteName: null,
          publicEventsVisibility: null,
        },
      };
    }
    const [latestProjects, latestClubs, latestSpaces, latestNews, siteSettings] = await Promise.all([
      prisma.project.findMany({
        where: { ...publicCatalogWhere(), status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: HOME_FEED_TAKE,
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
        },
      }),
      prisma.club.findMany({
        where: publicCatalogWhere(),
        orderBy: { createdAt: 'desc' },
        take: HOME_FEED_TAKE,
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
        },
      }),
      prisma.space.findMany({
        where: { ...publicCatalogWhere(), status: { notIn: ['INACTIVE', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        take: HOME_FEED_TAKE,
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          address: true,
          capacity: true,
        },
      }),
      prisma.news.findMany({
        where: publishedNonDemoWhere(),
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: HOME_FEED_TAKE,
        select: {
          id: true,
          title: true,
          text: true,
          imageUrl: true,
          videoEmbedUrl: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.siteSettings.findUnique({
        where: { id: '1' },
        select: {
          heroImageUrl: true,
          heroVideoUrl: true,
          heroMediaKind: true,
          heroAnimationMode: true,
          govWidgetsEnabled: true,
          govWidgetsTitle: true,
          govWidgetsJson: true,
          galleryHomepageEnabled: true,
          galleryPublicEnabled: true,
          publicEventsVisibility: true,
          orgGalleryJson: true,
          siteName: true,
        },
      }),
    ]);
    // Serialize dates: unstable_cache JSON-encodes Date → string; callers must not assume Date.
    const news = latestNews.map((n) => ({
      ...n,
      text: homeExcerpt(n.text, 200),
      publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));
    return {
      latestProjects: latestProjects.map((p) => ({ ...p, description: homeExcerpt(p.description) })),
      latestClubs: latestClubs.map((c) => ({ ...c, description: homeExcerpt(c.description) })),
      latestSpaces: latestSpaces.map((s) => ({
        ...s,
        description: s.description ? homeExcerpt(s.description) : s.description,
      })),
      latestNews: news,
      siteSettings,
    };
  },
  ['home-catalog-v9'],
  { revalidate: 60, tags: ['yp-home-catalog', 'home-catalog'] }
);
