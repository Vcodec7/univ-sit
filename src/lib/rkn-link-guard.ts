import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { createUserNotification } from '@/lib/security';
import { LINK_SHORTENER_HOSTS, RKN_SEED_HOSTS } from '@/lib/rkn-blocklist-seed';
import { classifyLinkClient } from '@/lib/link-safety';

const EXTRA_FILE = path.join(process.cwd(), 'data', 'rkn-blocklist.json');

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

export type LinkCheckStatus = 'ok' | 'rkn' | 'shortener' | 'invalid' | 'suspicious';

export type LinkCheckItem = {
  url: string;
  host: string;
  status: LinkCheckStatus;
};

function stripTrailingPunct(raw: string) {
  return raw.replace(/[),.;!?]+$/g, '').trim();
}

export function extractUrls(text: string): string[] {
  const found = String(text || '').match(URL_RE) || [];
  const out: string[] = [];
  for (const raw of found) {
    const cleaned = stripTrailingPunct(raw);
    if (!cleaned) continue;
    const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    out.push(withProto);
  }
  return [...new Set(out)].slice(0, 20);
}

export function hostFromUrl(url: string): string | null {
  try {
    const u = new URL(url.includes('://') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function hostMatches(host: string, listed: string) {
  const h = host.toLowerCase();
  const l = listed.toLowerCase().replace(/^www\./, '');
  return h === l || h.endsWith(`.${l}`);
}

async function readExtraHosts(): Promise<string[]> {
  try {
    const raw = await readFile(EXTRA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { hosts?: unknown };
    if (!Array.isArray(parsed.hosts)) return [];
    return parsed.hosts.map((h) => String(h).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function listRknHosts(): Promise<{ seed: string[]; extra: string[]; all: string[] }> {
  const extra = await readExtraHosts();
  const seed = RKN_SEED_HOSTS.map((h) => h.toLowerCase());
  const all = [...new Set([...seed, ...extra])];
  return { seed, extra, all };
}

export async function saveExtraRknHosts(hosts: string[]) {
  const extra = [...new Set(hosts.map((h) => h.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean))];
  await mkdir(path.dirname(EXTRA_FILE), { recursive: true });
  await writeFile(EXTRA_FILE, JSON.stringify({ hosts: extra, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  return extra;
}

function classifyHit(url: string, host: string, rknAll: string[]): LinkCheckItem {
  if (!host) return { url, host: '', status: 'invalid' };
  if (rknAll.some((listed) => hostMatches(host, listed))) {
    return { url, host, status: 'rkn' };
  }
  if (LINK_SHORTENER_HOSTS.some((listed) => hostMatches(host, listed))) {
    return { url, host, status: 'shortener' };
  }
  const local = classifyLinkClient(url);
  if (local.risk === 'blocked') return { url, host, status: 'invalid' };
  if (local.risk === 'shortener') return { url, host, status: 'shortener' };
  if (local.risk === 'suspicious') return { url, host, status: 'suspicious' };
  return { url, host, status: 'ok' };
}

export async function checkLinksInText(text: string): Promise<LinkCheckItem[]> {
  const { all } = await listRknHosts();
  const urls = extractUrls(text);
  return urls.map((url) => classifyHit(url, hostFromUrl(url) || '', all));
}

export async function checkSingleUrl(raw: string): Promise<LinkCheckItem> {
  const local = classifyLinkClient(raw);
  if (!local.href || local.risk === 'blocked') {
    return { url: String(raw || ''), host: local.host, status: 'invalid' };
  }
  const hits = await checkLinksInText(local.href);
  return hits[0] || classifyHit(local.href, local.host, []);
}

export async function notifyStaffRknLinks(opts: {
  actorId: string;
  actorName: string;
  conversationId?: string | null;
  messageId?: string | null;
  hits: LinkCheckItem[];
  snippet: string;
}) {
  const rknHits = opts.hits.filter((h) => h.status === 'rkn');
  if (!rknHits.length) return null;

  const recent = await prisma.contentFlag.findFirst({
    where: {
      category: 'RKN_BLOCK',
      actorUserId: opts.actorId,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    select: { id: true, matches: true },
  });
  const already = rknHits.every((h) => (recent?.matches || '').includes(h.host));
  if (recent && already) return recent.id;

  const hosts = rknHits.map((h) => h.host).join(', ');
  const flag = await prisma.contentFlag.create({
    data: {
      category: 'RKN_BLOCK',
      categories: JSON.stringify(['RKN_BLOCK']),
      severity: 3,
      sourceType: opts.messageId ? 'DIRECT_MESSAGE' : 'LINK_CHECK',
      sourceId: opts.messageId || `check-${opts.conversationId || 'compose'}-${Date.now()}`,
      conversationId: opts.conversationId || null,
      actorUserId: opts.actorId,
      originalText: opts.snippet.slice(0, 4000),
      maskedText: `РКН: ${hosts}`,
      matches: JSON.stringify(rknHits.map((h) => h.host).slice(0, 40)),
      status: 'OPEN',
      reliabilityDelta: 0,
      warnIssued: false,
    },
    select: { id: true },
  });

  const staff = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'MODERATOR', permissions: { contains: 'moderation' } },
      ],
      blockedAt: null,
      deletedAt: null,
    },
    select: { id: true },
    take: 40,
  });

  const title = 'РКН: запрещённая ссылка в переписке';
  const body = `${opts.actorName || 'Пользователь'} отправил ${hosts}`;

  await Promise.all(
    staff.map((s) =>
      createUserNotification({
        userId: s.id,
        type: 'MODERATION',
        title,
        body,
        meta: {
          href: '/admin/moderation',
          flagId: flag.id,
          audience: 'staff',
          kind: 'RKN_BLOCK',
          hosts: rknHits.map((h) => h.host),
        },
      })
    )
  );

  return flag.id;
}
