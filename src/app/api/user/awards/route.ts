import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AWARD_OCCASION_BY_ID, parseAwardMeta } from '@/lib/award-occasions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const items = await prisma.officialDocument.findMany({
      where: { userId: session.user.id, status: 'ISSUED' },
      orderBy: { issuedAt: 'desc' },
    });
    return NextResponse.json({
      items: items.map((d) => {
        const meta = parseAwardMeta(d.metaJson);
        const occasion = meta.occasion ? AWARD_OCCASION_BY_ID[meta.occasion] : null;
        return {
          id: d.id,
          type: d.type,
          title: d.title,
          subtitle: d.subtitle,
          serialNumber: d.serialNumber,
          issuedAt: d.issuedAt,
          occasionId: meta.occasion || null,
          occasionLabel: occasion?.label || null,
        };
      }),
    });
  } catch (err) {
    console.error('[awards]', err);
    return NextResponse.json(
      { error: 'Не удалось загрузить награды', message: 'Не удалось загрузить награды' },
      { status: 500 }
    );
  }
}
