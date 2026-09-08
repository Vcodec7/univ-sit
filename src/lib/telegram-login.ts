import crypto from 'crypto';

export type TelegramWidgetPayload = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

export function telegramLoginReady() {
  return Boolean(
    (process.env.TELEGRAM_BOT_TOKEN || '').trim() && (process.env.TELEGRAM_BOT_USERNAME || '').trim()
  );
}

export function telegramBotUsername() {
  return (process.env.TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '');
}

function dataCheckString(data: Record<string, string>) {
  return Object.keys(data)
    .filter((k) => k !== 'hash' && data[k])
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
}

export function verifyTelegramWidget(raw: Record<string, unknown>): TelegramWidgetPayload | null {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!token) return null;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v == null || v === '') continue;
    flat[k] = String(v);
  }
  const hash = String(flat.hash || '');
  const id = String(flat.id || '');
  const authDate = String(flat.auth_date || '');
  if (!hash || !id || !authDate) return null;
  const ageSec = Date.now() / 1000 - Number(authDate);
  if (!Number.isFinite(ageSec) || ageSec > 86400 || ageSec < -60) return null;

  const secret = crypto.createHash('sha256').update(token).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString(flat)).digest('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return {
    id,
    first_name: flat.first_name,
    last_name: flat.last_name,
    username: flat.username,
    photo_url: flat.photo_url,
    auth_date: authDate,
    hash,
  };
}

export function ageFromVkBdate(bdate?: string | null): number | null {
  const raw = String(bdate || '').trim();
  const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}
