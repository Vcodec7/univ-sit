import { prisma } from '@/lib/prisma';
import { rangeEndDate, rangeStartDate, type StatsRange } from '@/lib/stats-period';

export async function getInterestInsights(range: StatsRange) {
  const from = rangeStartDate(range) || new Date(0);
  const to = rangeEndDate(range) || new Date();
  const created = { gte: from, lte: to };

  const [projectViews, clubViews, spaceViews, apps, searches, faqCats, faqItems] = await Promise.all([
    prisma.project.findMany({
      orderBy: { viewCount: 'desc' },
      take: 8,
      select: { id: true, title: true, viewCount: true, status: true },
    }),
    prisma.club.findMany({
      orderBy: { viewCount: 'desc' },
      take: 8,
      select: { id: true, title: true, viewCount: true, status: true },
    }),
    prisma.space.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, category: true },
    }),
    prisma.application.groupBy({
      by: ['type'],
      where: { createdAt: created },
      _count: { _all: true },
    }).catch(() => []),
    prisma.insightSearch.findMany({
      where: { createdAt: created, source: 'faq' },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: { query: true, hits: true },
    }).catch(() => []),
    prisma.faqCategory.findMany({
      orderBy: { viewCount: 'desc' },
      take: 8,
      select: { id: true, title: true, viewCount: true, published: true, _count: { select: { items: true } } },
    }).catch(() => []),
    prisma.faqItem.findMany({
      orderBy: { viewCount: 'desc' },
      take: 8,
      select: { id: true, question: true, viewCount: true, published: true, category: { select: { title: true } } },
    }).catch(() => []),
  ]);

  const searchRows = searches as Array<{ query: string; hits: number }>;
  const tally = new Map<string, { query: string; _count: { _all: number }; hitsSum: number }>();
  for (const row of searchRows) {
    const cur = tally.get(row.query) || { query: row.query, _count: { _all: 0 }, hitsSum: 0 };
    cur._count._all += 1;
    cur.hitsSum += row.hits || 0;
    tally.set(row.query, cur);
  }
  const faqSearches = [...tally.values()]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 12)
    .map((s) => ({ query: s.query, _count: s._count, _avg: { hits: s.hitsSum / s._count._all } }));
  const unanswered = faqSearches.filter((s) => (s._avg.hits || 0) < 1);

  return {
    topProjects: projectViews,
    topClubs: clubViews,
    topSpaces: spaceViews,
    applicationsByType: (apps as Array<{ type: string; _count: { _all: number } }>).map((a) => ({ type: a.type, count: a._count._all })),
    faqSearches,
    faqCategories: faqCats,
    faqQuestions: faqItems,
    weakProjects,
    unansweredQueries: unanswered,
  };
}

export async function logInsightSearch(source: string, query: string, hits: number) {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return;
  await prisma.insightSearch.create({
    data: { source, query: q.toLowerCase(), hits },
  });
}
