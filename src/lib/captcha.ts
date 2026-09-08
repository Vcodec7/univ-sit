/**
 * Self-hosted anti-bot: picture pick (PNG tiles) + honeypot + single-use token.
 * Challenge JSON never includes emoji, labels, or tag prefixes in tile ids.
 */
import crypto from 'crypto';
import sharp from 'sharp';
import { getSharedRedis } from '@/lib/rateLimit';

const TTL_SEC = 300;
const MEM = new Map<string, { payload: string; exp: number }>();

function requireHmacSecret(fallbackDevOnly: string): string {
  const s =
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    '';
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required');
  }
  return fallbackDevOnly;
}

function secret() {
  return requireHmacSecret('yp-captcha-dev');
}

function cleanupMem() {
  const now = Date.now();
  for (const [k, v] of MEM) {
    if (v.exp < now) MEM.delete(k);
  }
}

export type CaptchaTilePublic = { id: string; src: string };

export type CaptchaChallenge = {
  challengeId: string;
  question: string;
  kind: 'pick' | 'math';
  tiles?: CaptchaTilePublic[];
};

const PICK_TARGETS = [
  { tag: 'tree', title: 'деревья' },
  { tag: 'car', title: 'машины' },
  { tag: 'house', title: 'дома' },
  { tag: 'cat', title: 'животные' },
] as const;

type TileTag = (typeof PICK_TARGETS)[number]['tag'];

type StoredTile = { id: string; tag: TileTag };
type StoredChallenge = { answer: string; tiles: StoredTile[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function storeRaw(key: string, value: string) {
  const redis = getSharedRedis();
  if (redis) {
    await redis.set(key, value, 'EX', TTL_SEC);
  } else {
    MEM.set(key, { payload: value, exp: Date.now() + TTL_SEC * 1000 });
  }
}

async function loadRaw(key: string): Promise<string | null> {
  const redis = getSharedRedis();
  if (redis) {
    const stored = await redis.get(key);
    return stored != null ? String(stored) : null;
  }
  cleanupMem();
  const row = MEM.get(key);
  if (!row || row.exp < Date.now()) {
    MEM.delete(key);
    return null;
  }
  return row.payload;
}

async function delRaw(key: string) {
  const redis = getSharedRedis();
  if (redis) await redis.del(key);
  else MEM.delete(key);
}

function parseStored(raw: string | null): StoredChallenge | null {
  if (!raw) return null;
  if (raw.startsWith('pick:')) return { answer: raw, tiles: [] };
  try {
    const parsed = JSON.parse(raw) as StoredChallenge;
    if (parsed?.answer && Array.isArray(parsed.tiles)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export async function createCaptchaChallenge(): Promise<CaptchaChallenge> {
  cleanupMem();
  const challengeId = crypto.randomBytes(16).toString('hex');
  const target = PICK_TARGETS[Math.floor(Math.random() * PICK_TARGETS.length)];
  const hits: StoredTile[] = [
    { id: crypto.randomBytes(8).toString('hex'), tag: target.tag },
    { id: crypto.randomBytes(8).toString('hex'), tag: target.tag },
  ];
  const others = PICK_TARGETS.filter((t) => t.tag !== target.tag).map((t) => t.tag);
  const decoys: StoredTile[] = shuffle(others)
    .slice(0, 4)
    .map((tag) => ({ id: crypto.randomBytes(8).toString('hex'), tag }));
  const tiles = shuffle([...hits, ...decoys]);
  const correct = tiles.filter((t) => t.tag === target.tag).map((t) => t.id).sort().join(',');
  await storeRaw(`captcha:${challengeId}`, JSON.stringify({ answer: `pick:${correct}`, tiles }));
  return {
    challengeId,
    question: `Выберите все картинки: ${target.title}`,
    kind: 'pick',
    tiles: tiles.map((t) => ({
      id: t.id,
      src: `/api/captcha/tile/${challengeId}/${t.id}`,
    })),
  };
}

export async function renderCaptchaTilePng(challengeId: string, tileId: string): Promise<Buffer | null> {
  const stored = parseStored(await loadRaw(`captcha:${challengeId}`));
  const tile = stored?.tiles.find((t) => t.id === tileId);
  if (!tile) return null;
  const svg = captchaTileSvg(tile.tag);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function captchaTileSvg(tag: TileTag): string {
  const bg = '#f4f6f8';
  const ink = '#334155';
  if (tag === 'tree') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" fill="none">
      <rect width="128" height="128" rx="16" fill="${bg}"/>
      <polygon points="64,22 104,78 24,78" fill="#3d6b40" stroke="${ink}" stroke-width="2"/>
      <rect x="58" y="76" width="12" height="26" fill="#475569" stroke="${ink}" stroke-width="2"/>
    </svg>`;
  }
  if (tag === 'car') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" fill="none">
      <rect width="128" height="128" rx="16" fill="${bg}"/>
      <rect x="24" y="54" width="80" height="26" rx="6" fill="#1e4e8c" stroke="${ink}" stroke-width="2"/>
      <path d="M40 54 L50 40 H78 L88 54" fill="#1e4e8c" stroke="${ink}" stroke-width="2"/>
      <circle cx="44" cy="86" r="8" fill="${ink}"/>
      <circle cx="86" cy="86" r="8" fill="${ink}"/>
    </svg>`;
  }
  if (tag === 'house') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" fill="none">
      <rect width="128" height="128" rx="16" fill="${bg}"/>
      <polygon points="64,22 108,60 20,60" fill="#9b2c2c" stroke="${ink}" stroke-width="2"/>
      <rect x="36" y="58" width="56" height="44" fill="#b91c1c" stroke="${ink}" stroke-width="2"/>
      <rect x="58" y="78" width="12" height="24" fill="${ink}"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" fill="none">
    <rect width="128" height="128" rx="16" fill="${bg}"/>
    <circle cx="64" cy="72" r="26" fill="#c05621" stroke="${ink}" stroke-width="2"/>
    <circle cx="54" cy="68" r="3" fill="${ink}"/>
    <circle cx="74" cy="68" r="3" fill="${ink}"/>
    <path d="M48 48 L56 30 L64 48 M80 48 L72 30 L64 48" stroke="${ink}" stroke-width="2" fill="#c05621"/>
  </svg>`;
}

export type CaptchaVerifyInput = {
  challengeId?: string | null;
  answer?: string | number | null;
  selected?: string[] | null;
  website?: string | null;
};

export type CaptchaVerifyResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

export async function solveCaptcha(input: CaptchaVerifyInput): Promise<CaptchaVerifyResult> {
  if (input.website && String(input.website).trim() !== '') {
    return { ok: false, message: 'Проверка не пройдена' };
  }
  const id = String(input.challengeId || '').trim();
  if (!id || id.length < 16) {
    return { ok: false, message: 'Обновите проверку и попробуйте снова' };
  }

  const key = `captcha:${id}`;
  const stored = parseStored(await loadRaw(key));
  await delRaw(key);
  const expected = stored?.answer ?? null;

  if (expected == null) {
    return { ok: false, message: 'Неверный ответ на проверку' };
  }

  let given = '';
  if (expected.startsWith('pick:')) {
    const sel = Array.isArray(input.selected)
      ? input.selected
      : String(input.answer || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    given = `pick:${[...new Set(sel)].sort().join(',')}`;
  } else {
    const rawAnswer = String(input.answer ?? '').trim();
    const num = Number(rawAnswer);
    if (!Number.isFinite(num)) {
      return { ok: false, message: 'Неверный ответ' };
    }
    given = String(num);
  }

  if (given !== expected) {
    return { ok: false, message: 'Неверный ответ на проверку' };
  }

  const token = signToken(id);
  await storeRaw(`captcha:tok:${token}`, '1');
  return { ok: true, token };
}

function signToken(challengeId: string) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${challengeId}.${Date.now()}.${nonce}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 32);
  return `${payload}.${sig}`;
}

export async function consumeCaptchaToken(
  token: string | null | undefined,
  honeypot?: string | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (honeypot && String(honeypot).trim() !== '') {
    return { ok: false, message: 'Проверка не пройдена' };
  }
  const t = String(token || '').trim();
  if (!t || t.length < 20) {
    return { ok: false, message: 'Пройдите проверку «я не робот»' };
  }
  const parts = t.split('.');
  if (parts.length < 4) {
    return { ok: false, message: 'Пройдите проверку заново' };
  }
  const payload = parts.slice(0, -1).join('.');
  const sig = parts[parts.length - 1];
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 32);
  if (sig !== expect) {
    return { ok: false, message: 'Пройдите проверку заново' };
  }

  const key = `captcha:tok:${t}`;
  const redis = getSharedRedis();
  if (redis) {
    const n = await redis.del(key);
    if (!n) return { ok: false, message: 'Проверка устарела — решите пример снова' };
  } else {
    cleanupMem();
    if (!MEM.has(key)) return { ok: false, message: 'Проверка устарела — решите пример снова' };
    MEM.delete(key);
  }
  return { ok: true };
}
