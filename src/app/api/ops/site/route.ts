import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isTechRole } from '@/lib/module-flags';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/csrf-origin';
import { getSiteIdentity, normalizeOrigin } from '@/lib/site-identity';
import { maxEnsureWebhook, maxGetConfig, maxListSubscriptions, maxWebhookFailRu } from '@/lib/max';
import { opsFlagsRateLimiter, rateLimitJson } from '@/lib/rateLimit';
import { voidLogUserAction } from '@/lib/user-action-log';

export const dynamic = 'force-dynamic';

function notFound() {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}

async function requireTechSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isTechRole(session.user.role)) return null;
  return session;
}

function parseSubs(json: unknown): { url?: string }[] {
  if (!json || typeof json !== 'object') return [];
  const list = (json as { subscriptions?: { url?: string }[] }).subscriptions;
  return Array.isArray(list) ? list : [];
}

export async function GET() {
  const session = await requireTechSession();
  if (!session) return notFound();
  const identity = await getSiteIdentity();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: '1' },
    select: { publicSiteUrl: true, maxBotEnabled: true, maxBotToken: true },
  });
  const max = await maxGetConfig();
  const subs = max.token ? await maxListSubscriptions(max.token) : { ok: false, json: null };
  const urls = subs.ok ? parseSubs(subs.json).map((s) => s.url || '').filter(Boolean) : [];
  const expected = `${identity.publicOrigin.replace(/\/$/, '')}/api/integrations/max/webhook`;
  return NextResponse.json({
    publicSiteUrl: settings?.publicSiteUrl || '',
    effectiveOrigin: identity.publicOrigin,
    max: {
      enabled: max.enabled,
      hasToken: Boolean(max.token || settings?.maxBotToken),
      webhookUrl: expected,
      webhookRegisteredUrl: urls[0] || null,
      webhookActive: urls.some((u) => u.replace(/\/$/, '') === expected),
    },
  });
}

export async function POST(req: Request) {
  const session = await requireTechSession();
  if (!session) return notFound();
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!(await opsFlagsRateLimiter.checkAsync(`ops-site:${session.user.id}:${ip}`))) {
    return NextResponse.json(rateLimitJson('Слишком часто'), { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'saveOrigin') {
    const publicSiteUrl = normalizeOrigin(String(body.publicSiteUrl || '')) || null;
    await prisma.siteSettings.upsert({
      where: { id: '1' },
      update: { publicSiteUrl },
      create: { id: '1', publicSiteUrl },
    });
    voidLogUserAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'OPS_SITE_ORIGIN',
      category: 'admin',
      summary: 'Обновлён публичный адрес сайта',
      detail: { origin: publicSiteUrl },
    });
    return GET();
  }

  if (action === 'saveMaxToken') {
    const token = String(body.token || '').trim();
    const secret = String(body.secret || '').trim();
    const data: { maxBotToken?: string; maxWebhookSecret?: string; maxBotEnabled?: boolean } = {};
    if (token) data.maxBotToken = token;
    if (secret) data.maxWebhookSecret = secret;
    if (typeof body.enabled === 'boolean') data.maxBotEnabled = body.enabled;
    if (Object.keys(data).length) {
      await prisma.siteSettings.upsert({
        where: { id: '1' },
        update: data,
        create: { id: '1', ...data },
      });
    }
    voidLogUserAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'OPS_MAX_TOKEN',
      category: 'bots',
      summary: 'Обновлены ключи MAX',
      success: true,
    });
    return GET();
  }

  if (action === 'ensureMaxWebhook') {
    const origin = normalizeOrigin(String(body.publicOrigin || '')) || undefined;
    const r = await maxEnsureWebhook(origin);
    const failRu = r.ok
      ? ''
      : maxWebhookFailRu('reason' in r ? r.reason : undefined, 'body' in r ? String(r.body || '') : '');
    voidLogUserAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'BOTS_WEBHOOK',
      category: 'bots',
      summary: r.ok ? 'Вебхук MAX зарегистрирован' : `Ошибка вебхука MAX: ${failRu}`,
      success: r.ok,
      detail: { channel: 'max', via: 'tech' },
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, message: failRu || 'Не удалось зарегистрировать вебхук' }, { status: 400 });
    }
    const fresh = await GET();
    const payload = await fresh.json();
    return NextResponse.json({ ok: true, message: 'Вебхук MAX зарегистрирован', ...payload });
  }

  return NextResponse.json({ message: 'Неизвестное действие' }, { status: 400 });
}
