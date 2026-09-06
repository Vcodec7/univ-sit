import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkLinksInText, notifyStaffRknLinks } from '@/lib/rkn-link-guard';
import { rateLimitJson, placesReadRateLimiter } from '@/lib/rateLimit';
import { assertSameOrigin } from '@/lib/csrf-origin';

export async function POST(req: Request) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Нужна авторизация' }, { status: 401 });
  }

  if (!(await placesReadRateLimiter.checkAsync(`link-check:${session.user.id}`, 20))) {
    return NextResponse.json(rateLimitJson('Слишком много проверок. Подождите минуту.'), { status: 429 });
  }

  const payload = await req.json().catch(() => ({}));
  const text = typeof payload.text === 'string' ? payload.text : '';
  const conversationId = typeof payload.conversationId === 'string' ? payload.conversationId : null;
  const alert = payload.alert === true;

  const hits = await checkLinksInText(text);
  const rkn = hits.filter((h) => h.status === 'rkn');

  if (alert && rkn.length) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    await notifyStaffRknLinks({
      actorId: session.user.id,
      actorName: me?.name || session.user.name || 'Пользователь',
      conversationId,
      hits: rkn,
      snippet: text,
    });
  }

  const summary = !hits.length
    ? 'Ссылок в тексте нет'
    : rkn.length
      ? `В реестре РКН: ${rkn.map((h) => h.host).join(', ')}. Администрация получит предупреждение.`
      : hits.some((h) => h.status === 'shortener')
        ? 'Есть сокращённые ссылки — лучше вставить полный адрес.'
        : 'Ссылки не найдены в локальной базе РКН.';

  return NextResponse.json({ hits, summary, rknCount: rkn.length });
}
