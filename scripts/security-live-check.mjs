#!/usr/bin/env node
/**
 * Defensive live perimeter check (guest). No payloads, no credential stuffing.
 *
 * Usage:
 *   node scripts/security-live-check.mjs
 *   BASE_URL=https://ty.idivles.ru node scripts/security-live-check.mjs
 *   npm run security:ty
 *
 * Exit: number of failed checks (capped 125).
 */
const BASE = (process.env.BASE_URL || process.argv[2] || 'https://ty.idivles.ru').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SEC_TIMEOUT_MS || 20000);
const FOREIGN_ORIGIN = 'https://example.invalid';

const results = [];

function rec(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const tag = ok ? 'OK  ' : 'FAIL';
  console.log(`${tag} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(path, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      redirect: 'manual',
      signal: ctrl.signal,
      ...opts,
      headers: { Accept: 'application/json,text/html,*/*', ...(opts.headers || {}) },
    });
    const text = await res.text().catch(() => '');
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* not json */
    }
    return { res, text, json, status: res.status };
  } finally {
    clearTimeout(t);
  }
}

function loc(res) {
  return res.headers.get('location') || res.headers.get('Location') || '';
}

async function guestForbidden() {
  const apis = [
    ['GET', '/api/admin/activity'],
    ['GET', '/api/admin/pii-access'],
    ['GET', '/api/admin/export?type=users'],
    ['GET', '/api/admin/backup'],
    ['GET', '/api/ops/flags'],
    ['GET', '/api/ops/topology'],
    ['GET', '/api/user/eco'],
    ['GET', '/api/user/profile'],
    ['GET', '/api/messages'],
    ['POST', '/api/bookings'],
    ['POST', '/api/ops/flags'],
    ['PUT', '/api/admin/users/x/role'],
  ];
  for (const [method, path] of apis) {
    const { status, json, text } = await req(path, {
      method,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', Origin: BASE },
      body: method === 'GET' ? undefined : '{}',
    });
    const leak = Boolean(json && (Array.isArray(json) ? json.length : json.id || json.users || json.flags));
    const gated = status === 401 || status === 403 || status === 404;
    rec(`guest ${method} ${path}`, gated && !leak, `HTTP ${status}`);
    if (!gated && /email|password|token|secret/i.test(text.slice(0, 400))) {
      rec(`guest leak ${path}`, false, 'sensitive tokens in body');
    }
  }
}

async function csrfSpoofedForwardedHost() {
  const { status, json } = await req('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: FOREIGN_ORIGIN,
      Referer: `${FOREIGN_ORIGIN}/`,
      'X-Forwarded-Host': 'example.invalid',
      'X-Forwarded-Proto': 'https',
    },
    body: '{}',
  });
  rec(
    'csrf ignores spoofed X-Forwarded-Host',
    status === 403 && json?.code === 'CSRF_ORIGIN',
    `HTTP ${status} ${json?.code || json?.message || ''}`.trim()
  );
}

async function csrfForeignOrigin() {
  const paths = [
    '/api/bookings',
    '/api/user/profile',
    '/api/ops/flags',
    '/api/register',
    '/api/friends',
  ];
  for (const path of paths) {
    const { status, json, text } = await req(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: FOREIGN_ORIGIN,
        Referer: `${FOREIGN_ORIGIN}/`,
      },
      body: '{}',
    });
    const blocked =
      status === 403 &&
      (json?.code === 'CSRF_ORIGIN' || /origin/i.test(json?.message || '') || /CSRF/i.test(text));
    rec(`csrf foreign origin ${path}`, blocked, `HTTP ${status} ${json?.code || json?.message || ''}`.trim());
  }
}

async function cronNoQuerySecret() {
  const paths = ['/api/cron/reminders', '/api/cron/replica-sync', '/api/vk-sync'];
  for (const path of paths) {
    const a = await req(`${path}?secret=not-the-secret`);
    const denied = a.status === 401 || a.status === 403 || a.status === 404;
    rec(`cron rejects query secret ${path}`, denied, `HTTP ${a.status}`);
    const b = await req(path);
    rec(`cron rejects anonymous ${path}`, b.status === 401 || b.status === 403 || b.status === 404, `HTTP ${b.status}`);
  }
}

async function exposedFiles() {
  const paths = [
    '/.env',
    '/.git/HEAD',
    '/.git/config',
    '/docker-compose.yml',
    '/package.json',
    '/api/debug',
    '/server-status',
    '/phpinfo.php',
  ];
  for (const path of paths) {
    const { status, text } = await req(path);
    const hidden = status === 404 || status === 403 || status === 401 || status === 301 || status === 302;
    const looksSecret = /DATABASE_URL|NEXTAUTH_SECRET|BEGIN (RSA |OPENSSH )?PRIVATE/i.test(text);
    rec(`no expose ${path}`, hidden && !looksSecret, `HTTP ${status}`);
  }
}

async function headersAndHealth() {
  const home = await req('/');
  const xfo = home.res.headers.get('x-frame-options') || '';
  rec('X-Frame-Options DENY', /deny/i.test(xfo), xfo || 'missing');
  const csp = home.res.headers.get('content-security-policy') || '';
  rec('CSP present', /default-src/i.test(csp), csp ? 'set' : 'missing');
  rec('no X-Powered-By', !home.res.headers.get('x-powered-by'), home.res.headers.get('x-powered-by') || 'absent');

  const health = await req('/api/health');
  rec('public health ok', health.status === 200 && health.json?.status === 'ok', `HTTP ${health.status}`);
  rec(
    'public health no db/version leak',
    health.json && health.json.db === undefined && health.json.version === undefined,
    JSON.stringify(health.json)
  );

  const dash = await req('/admin');
  const locHdr = loc(dash.res);
  rec(
    'guest /admin gated',
    dash.status === 307 || dash.status === 302 || dash.status === 401 || dash.status === 403,
    `HTTP ${dash.status} ${locHdr}`
  );
  rec('guest /admin not open redirect', !/example\.invalid|evil/i.test(locHdr), locHdr || 'n/a');
}

async function hostHeaderRedirect() {
  const { res, status } = await req('/r/TESTCODE', {
    headers: { 'X-Forwarded-Host': 'evil.example', 'X-Forwarded-Proto': 'https' },
  });
  const location = loc(res);
  const ok =
    !location ||
    location.startsWith('/') ||
    location.includes('idivles.ru') ||
    location.includes('ty.idivles') ||
    location.includes('py.idivles');
  rec(
    'referral redirect ignores X-Forwarded-Host',
    (status === 307 || status === 302) && ok && !/evil\.example/i.test(location),
    `HTTP ${status} ${location}`
  );
}

async function pendingBookingTitles() {
  const spaces = await req('/api/places?take=1');
  rec('places guest list', spaces.status === 200 || spaces.status === 404, `HTTP ${spaces.status}`);
  const list = await req('/api/events');
  rec('events guest', list.status === 200 || list.status === 404, `HTTP ${list.status}`);
}

async function main() {
  console.log(`security-live-check ${BASE}`);
  await guestForbidden();
  await csrfForeignOrigin();
  await csrfSpoofedForwardedHost();
  await cronNoQuerySecret();
  await exposedFiles();
  await headersAndHealth();
  await hostHeaderRedirect();
  await pendingBookingTitles();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length} checks, ${failed.length} failed`);
  if (failed.length) {
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  }
  process.exit(Math.min(failed.length, 125));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
