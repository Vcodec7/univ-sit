/**
 * Same-origin guard for mutating API routes (CSRF defense-in-depth).
 * Allowlist is env/public hosts only — never the request Host /
 * X-Forwarded-Host (those are attacker-controlled behind a mis-set proxy).
 */
import { NextResponse } from 'next/server';

const PINNED_HOSTS = ['ty.idivles.ru', 'py.idivles.ru'];

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

export function csrfAllowedHosts(): Set<string> {
  const allowed = new Set<string>();
  const add = (h: string | null | undefined) => {
    const v = String(h || '')
      .trim()
      .toLowerCase()
      .replace(/\/$/, '');
    if (v) allowed.add(v);
  };
  add(hostOf(process.env.NEXTAUTH_URL || null));
  add(hostOf(process.env.NEXT_PUBLIC_SITE_URL || null));
  for (const part of String(process.env.CSRF_ALLOWED_HOSTS || '').split(',')) add(part);
  for (const h of PINNED_HOSTS) add(h);
  if (process.env.NODE_ENV !== 'production') {
    add('localhost:3000');
    add('localhost:3001');
    add('127.0.0.1:3000');
    add('127.0.0.1:3001');
  }
  return allowed;
}

export function assertSameOrigin(req: Request): NextResponse | null {
  const allowed = csrfAllowedHosts();
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  const hostAllowed = (raw: string | null) => {
    const h = hostOf(raw);
    if (raw && !h) return false;
    if (!h) return false;
    return allowed.has(h);
  };

  if (!origin && !referer) {
    const site = (req.headers.get('sec-fetch-site') || '').toLowerCase();
    if (site === 'same-origin' || site === 'same-site') return null;
    return NextResponse.json({ message: 'Origin required', code: 'CSRF_ORIGIN' }, { status: 403 });
  }
  if (origin && !hostAllowed(origin)) {
    return NextResponse.json({ message: 'Origin denied', code: 'CSRF_ORIGIN' }, { status: 403 });
  }
  if (!origin && referer && !hostAllowed(referer)) {
    return NextResponse.json({ message: 'Referer denied', code: 'CSRF_REFERER' }, { status: 403 });
  }
  return null;
}
