import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrModerator, aclJsonError } from '@/lib/acl';
import { excludeTechWhere } from '@/lib/tech-visibility';
import { hasPermission } from '@/lib/acl-shared';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  let session;
  try {
    session = await requireAdminOrModerator();
  } catch (e) {
    return aclJsonError(e);
  }
  const role = session.user.role;
  if (role === 'TECH') {
    return NextResponse.json({ users: [], news: [] });
  }
  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ users: [], news: [] });

  const perms = session.user.permissions || '';
  const canNews = role === 'ADMIN' || hasPermission('MODERATOR', perms, ['news', 'pages']);

  const [users, news] = await Promise.all([
    role === 'ADMIN'
      ? prisma.user.findMany({
          where: {
            deletedAt: null,
            ...excludeTechWhere(),
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          },
          select: { id: true, name: true, email: true },
          take: 8,
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([]),
    canNews
      ? prisma.news.findMany({
          where: {
            OR: [{ title: { contains: q } }, { text: { contains: q } }],
          },
          select: { id: true, title: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ users, news });
}
