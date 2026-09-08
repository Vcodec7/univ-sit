import { prisma } from '@/lib/prisma';

export type OAuthCreds = {
  yandexId: string;
  yandexSecret: string;
  vkId: string;
  vkSecret: string;
  telegramToken: string;
  telegramUsername: string;
  esiaId: string;
  esiaSecret: string;
};

type Stored = {
  yandexClientId?: string;
  yandexClientSecret?: string;
  vkClientId?: string;
  vkClientSecret?: string;
  telegramBotToken?: string;
  telegramBotUsername?: string;
};

let cache: OAuthCreds | null = null;
let cacheAt = 0;
const TTL_MS = 8_000;

function envCreds(): OAuthCreds {
  return {
    yandexId: (process.env.YANDEX_CLIENT_ID || '').trim(),
    yandexSecret: (process.env.YANDEX_CLIENT_SECRET || '').trim(),
    vkId: (process.env.VK_CLIENT_ID || '').trim(),
    vkSecret: (process.env.VK_CLIENT_SECRET || '').trim(),
    telegramToken: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
    telegramUsername: (process.env.TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, ''),
    esiaId: (process.env.ESIA_CLIENT_ID || '').trim(),
    esiaSecret: (process.env.ESIA_CLIENT_SECRET || '').trim(),
  };
}

function parseStored(raw: string | null | undefined): Stored {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Stored;
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function merge(stored: Stored, botToken?: string | null): OAuthCreds {
  const env = envCreds();
  const tgUser = String(stored.telegramBotUsername || '').trim().replace(/^@/, '');
  const tgTok = String(stored.telegramBotToken || botToken || '').trim();
  return {
    yandexId: String(stored.yandexClientId || '').trim() || env.yandexId,
    yandexSecret: String(stored.yandexClientSecret || '').trim() || env.yandexSecret,
    vkId: String(stored.vkClientId || '').trim() || env.vkId,
    vkSecret: String(stored.vkClientSecret || '').trim() || env.vkSecret,
    telegramToken: tgTok || env.telegramToken,
    telegramUsername: tgUser || env.telegramUsername,
    esiaId: env.esiaId,
    esiaSecret: env.esiaSecret,
  };
}

export function peekOAuthCreds(): OAuthCreds {
  return cache || envCreds();
}

export function invalidateOAuthCreds() {
  cache = null;
  cacheAt = 0;
}

export async function loadOAuthCreds(): Promise<OAuthCreds> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const env = envCreds();
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: { oauthSsoJson: true, telegramBotToken: true },
    });
    cache = merge(parseStored(row?.oauthSsoJson), row?.telegramBotToken);
  } catch {
    cache = env;
  }
  cacheAt = Date.now();
  return cache;
}

export async function saveOAuthSso(patch: Stored): Promise<OAuthCreds> {
  const row = await prisma.siteSettings.findUnique({
    where: { id: '1' },
    select: { oauthSsoJson: true, telegramBotToken: true },
  });
  const prev = parseStored(row?.oauthSsoJson);
  const next: Stored = { ...prev };
  const keys: (keyof Stored)[] = [
    'yandexClientId',
    'yandexClientSecret',
    'vkClientId',
    'vkClientSecret',
    'telegramBotToken',
    'telegramBotUsername',
  ];
  for (const k of keys) {
    const v = patch[k];
    if (typeof v === 'string' && v.trim()) {
      next[k] = k === 'telegramBotUsername' ? v.trim().replace(/^@/, '') : v.trim();
    }
  }
  await prisma.siteSettings.upsert({
    where: { id: '1' },
    update: { oauthSsoJson: JSON.stringify(next) },
    create: { id: '1', oauthSsoJson: JSON.stringify(next) },
  });
  if (typeof patch.telegramBotToken === 'string' && patch.telegramBotToken.trim()) {
    await prisma.siteSettings.update({
      where: { id: '1' },
      data: { telegramBotToken: patch.telegramBotToken.trim() },
    });
  }
  invalidateOAuthCreds();
  return loadOAuthCreds();
}

export function oauthFlagsFromCreds(c: OAuthCreds) {
  return {
    yandex: Boolean(c.yandexId && c.yandexSecret),
    vk: Boolean(c.vkId && c.vkSecret),
    telegram: Boolean(c.telegramToken && c.telegramUsername),
    telegramBot: c.telegramToken && c.telegramUsername ? c.telegramUsername : '',
    esia: Boolean(c.esiaId && c.esiaSecret),
  };
}
