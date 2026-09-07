import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isNextBuildPhase } from '@/lib/build-phase';
import { publishedNonDemoWhere, publicCatalogWhere } from '@/lib/publish';
import { PUBLIC_REVALIDATE } from '@/lib/public-revalidate';
import { catalogPitch } from '@/lib/youth-studio';

const CATALOG_TAKE = 180;

export type PublicProjectCard = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  applicationsCount: number;
  mission?: string | null;
  goal?: string | null;
  studioJson?: string | null;
  pitch?: string;
  who?: string;
};

export type PublicClubCard = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  status: string;
  tags: string | null;
  meetingSchedule: string | null;
  meetingPlace: string | null;
  curatorName: string | null;
  createdAt: string;
  membersCount: number;
  mission?: string | null;
  goal?: string | null;
  studioJson?: string | null;
  pitch?: string;
  who?: string;
};

export type PublicSpaceCard = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  status: string;
  address: string | null;
  capacity: number;
  category: string | null;
  bookingMode?: string | null;
  amenities: string | null;
  createdAt: string;
  studioJson?: string | null;
  pitch?: string;
  who?: string;
  bookings: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    status: string;
    space: { id: string; title: string; capacity: number };
    participantsCount: number;
  }>;
};

export type PublicNewsCard = {
  id: string;
  title: string | null;
  text: string;
  imageUrl: string | null;
  videoEmbedUrl: string | null;
  vkLink: string | null;
  createdAt: string;
  publishedAt: string | null;
};

export type PublicPlaceCard = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  address: string | null;
  district: string | null;
  category: string;
  image: string | null;
  tips: string | null;
  visitTime: string | null;
  priceHint: string | null;
  bestSeason: string | null;
  ratingAvg: number;
  ratingCount: number;
  sortOrder: number;
};

export type PublicDocumentCard = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  mimeType: string;
  sizeBytes: number;
};

function empty<T>(): T[] {
  return [];
}

export const getCachedPublicProjects = unstable_cache(
  async (): Promise<PublicProjectCard[]> => {
    if (isNextBuildPhase()) return empty();
    const rows = await prisma.project.findMany({
      where: publicCatalogWhere(),
      orderBy: { title: 'asc' },
      take: CATALOG_TAKE,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        status: true,
        viewCount: true,
        createdAt: true,
        mission: true,
        goal: true,
        studioJson: true,
        _count: { select: { applications: true } },
      },
    });
    return rows.map((p) => {
      const pitch = catalogPitch({
        studioJson: p.studioJson,
        mission: p.mission,
        goal: p.goal,
        description: p.description,
      });
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        image: p.image,
        status: p.status,
        viewCount: p.viewCount,
        createdAt: p.createdAt.toISOString(),
        applicationsCount: p._count.applications,
        mission: p.mission,
        goal: p.goal,
        studioJson: p.studioJson,
        pitch: pitch.text,
        who: pitch.who,
      };
    });
  },
  ['public-projects-catalog-v3'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-home-catalog'] }
);

export const getCachedPublicClubs = unstable_cache(
  async (): Promise<PublicClubCard[]> => {
    if (isNextBuildPhase()) return empty();
    const rows = await prisma.club.findMany({
      where: publicCatalogWhere(),
      orderBy: { title: 'asc' },
      take: CATALOG_TAKE,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        status: true,
        tags: true,
        meetingSchedule: true,
        meetingPlace: true,
        curatorName: true,
        createdAt: true,
        mission: true,
        goal: true,
        studioJson: true,
        _count: { select: { applications: { where: { status: 'APPROVED' } } } },
      },
    });
    return rows.map((c) => {
      const pitch = catalogPitch({
        studioJson: c.studioJson,
        mission: c.mission,
        goal: c.goal,
        description: c.description,
      });
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        image: c.image,
        status: c.status,
        tags: c.tags,
        meetingSchedule: c.meetingSchedule,
        meetingPlace: c.meetingPlace,
        curatorName: c.curatorName,
        createdAt: c.createdAt.toISOString(),
        membersCount: c._count.applications,
        mission: c.mission,
        goal: c.goal,
        studioJson: c.studioJson,
        pitch: pitch.text,
        who: pitch.who,
      };
    });
  },
  ['public-clubs-catalog-v3'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-home-catalog'] }
);

export const getCachedPublicSpaces = unstable_cache(
  async (): Promise<PublicSpaceCard[]> => {
    if (isNextBuildPhase()) return empty();
    const now = new Date();
    const rows = await prisma.space.findMany({
      where: publicCatalogWhere(),
      orderBy: { createdAt: 'desc' },
      take: CATALOG_TAKE,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        status: true,
        address: true,
        capacity: true,
        category: true,
        bookingMode: true,
        amenities: true,
        createdAt: true,
        studioJson: true,
        bookings: {
          where: { status: 'APPROVED', startTime: { gte: now } },
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            status: true,
            space: { select: { id: true, title: true, capacity: true } },
            _count: { select: { participants: true } },
          },
          orderBy: { startTime: 'asc' },
          take: 4,
        },
      },
    });
    return rows.map((s) => {
      const pitch = catalogPitch({
        studioJson: 'studioJson' in s ? (s as { studioJson?: string | null }).studioJson : null,
        description: s.description,
      });
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        image: s.image,
        status: s.status,
        address: s.address,
        capacity: s.capacity,
        category: s.category,
        bookingMode: s.bookingMode,
        amenities: s.amenities,
        createdAt: s.createdAt.toISOString(),
        studioJson: 'studioJson' in s ? (s as { studioJson?: string | null }).studioJson : null,
        pitch: pitch.text,
        who: pitch.who,
        bookings: s.bookings.map((b) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          status: b.status,
          space: b.space,
          participantsCount: b._count.participants,
        })),
      };
    });
  },
          ['public-spaces-catalog-v4'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-home-catalog'] }
);

export const getCachedPublicNews = unstable_cache(
  async (): Promise<PublicNewsCard[]> => {
    if (isNextBuildPhase()) return empty();
    const rows = await prisma.news.findMany({
      where: publishedNonDemoWhere(),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        title: true,
        text: true,
        imageUrl: true,
        videoEmbedUrl: true,
        vkLink: true,
        createdAt: true,
        publishedAt: true,
      },
    });
    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      text: n.text,
      imageUrl: n.imageUrl,
      videoEmbedUrl: n.videoEmbedUrl,
      vkLink: n.vkLink,
      createdAt: n.createdAt.toISOString(),
      publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
    }));
  },
  ['public-news-catalog-v2'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-home-catalog'] }
);

export const getCachedPublicPlaces = unstable_cache(
  async (): Promise<PublicPlaceCard[]> => {
    if (isNextBuildPhase()) return empty();
    const rows = await prisma.place.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { ratingAvg: 'desc' }, { title: 'asc' }],
      take: CATALOG_TAKE,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        address: true,
        district: true,
        category: true,
        image: true,
        tips: true,
        visitTime: true,
        priceHint: true,
        bestSeason: true,
        ratingAvg: true,
        ratingCount: true,
        sortOrder: true,
      },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      address: p.address,
      district: p.district,
      category: p.category,
      image: p.image,
      tips: p.tips,
      visitTime: p.visitTime,
      priceHint: p.priceHint,
      bestSeason: p.bestSeason,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      sortOrder: p.sortOrder,
    }));
  },
  ['public-places-catalog-v2'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-home-catalog'] }
);

export const getCachedPublicDocuments = unstable_cache(
  async (): Promise<PublicDocumentCard[]> => {
    if (isNextBuildPhase()) return empty();
    const rows = await prisma.siteDocument.findMany({
      where: publishedNonDemoWhere(),
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        mimeType: true,
        sizeBytes: true,
      },
    });
    return rows;
  },
  ['public-documents-catalog-v1'],
  { revalidate: PUBLIC_REVALIDATE, tags: ['yp-site-chrome'] }
);
