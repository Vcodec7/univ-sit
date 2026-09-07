/** Client-safe link classification (no Node / Prisma). */

export type LinkRisk = 'internal' | 'ok' | 'shortener' | 'suspicious' | 'blocked';

const SHORTENERS = new Set([
  'bit.ly',
  't.co',
  'tinyurl.com',
  'tiny.cc',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'cutt.ly',
  'clck.ru',
  'vk.cc',
  'u.to',
  'rb.gy',
  'lnkd.in',
  'rebrand.ly',
]);

export function normalizeHref(raw: string): string | null {
  let value = String(raw || '').trim().replace(/[),.;!?]+$/g, '');
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) {
    if (value.includes('..') || value.includes('\\')) return null;
    return value;
  }
  if (/^www\./i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function hostFromHref(href: string): string {
  if (href.startsWith('/')) return '';
  try {
    return new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function isPortalHost(host: string): boolean {
  if (!host) return true;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return host === 'idivles.ru' || host.endsWith('.idivles.ru');
}

export function classifyLinkClient(raw: string): {
  href: string | null;
  host: string;
  risk: LinkRisk;
  reason: string;
} {
  const lower = String(raw || '').trim().toLowerCase();
  if (/^(javascript|data|vbscript|file):/i.test(lower)) {
    return { href: null, host: '', risk: 'blocked', reason: 'Эта схема ссылки опасна и не откроется.' };
  }
  const href = normalizeHref(raw);
  if (!href) {
    return { href: null, host: '', risk: 'blocked', reason: 'Ссылку не удалось разобрать.' };
  }
  if (href.startsWith('/')) {
    return { href, host: '', risk: 'internal', reason: 'Раздел этого портала.' };
  }
  const host = hostFromHref(href);
  if (isPortalHost(host)) {
    return { href, host, risk: 'internal', reason: 'Адрес портала Молодёжь Сочи.' };
  }
  try {
    const u = new URL(href);
    if (u.username || u.password) {
      return { href, host, risk: 'suspicious', reason: 'В адресе спрятан логин или пароль — так часто маскируют фишинг.' };
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) {
      return { href, host, risk: 'suspicious', reason: 'Ссылка ведёт на IP, а не на обычное имя сайта.' };
    }
    if (u.hostname.includes('xn--')) {
      return { href, host, risk: 'suspicious', reason: 'В имени сайта есть необычные символы (возможна подделка домена).' };
    }
  } catch {
    return { href: null, host, risk: 'blocked', reason: 'Ссылку не удалось разобрать.' };
  }
  if ([...SHORTENERS].some((s) => host === s || host.endsWith(`.${s}`))) {
    return { href, host, risk: 'shortener', reason: 'Сокращённая ссылка: не видно, куда она ведёт.' };
  }
  return { href, host, risk: 'ok', reason: 'Внешний сайт. Откройте, только если доверяете отправителю.' };
}
