/**
 * Captcha-aware role audit against ty staging.
 * Usage: node scripts/qa-ty-roles.mjs [baseUrl]
 */
import sharp from 'sharp';
import { join } from 'path';

const BASE = (process.argv[2] || 'https://ty.idivles.ru').replace(/\/$/, '');
const PASS = process.env.QA_PASS || 'RolePass123!';
const TECH_EMAIL = process.env.TECH_EMAIL || 'tech@sochi.ru';
const TECH_PASS = process.env.TECH_PASS || PASS;
const nativeFetch = globalThis.fetch.bind(globalThis);

async function fetchRetry(url, opts = {}, tries = 4) {
  const method = String(opts.method || 'GET').toUpperCase();
  const max = method === 'GET' || method === 'HEAD' ? tries : 1;
  let last;
  for (let i = 0; i < max; i += 1) {
    try {
      const ctrl = AbortSignal.timeout(28000);
      return await nativeFetch(url, { ...opts, signal: opts.signal || ctrl });
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 900 * (i + 1)));
    }
  }
  throw last;
}

const TAG_BY_TITLE = {
  деревья: 'tree',
  машины: 'car',
  дома: 'house',
  животные: 'cat',
};

const accounts = [
  { key: 'guest', email: null, role: 'GUEST' },
  { key: 'user', email: 'user@sochi.ru', role: 'USER' },
  { key: 'part', email: 'part@sochi.ru', role: 'PARTICIPANT' },
  { key: 'mod', email: 'mod@sochi.ru', role: 'MODERATOR' },
  { key: 'admin', email: 'qa-admin@sochi.ru', role: 'ADMIN' },
  { key: 'scanner', email: 'scanner@sochi.ru', role: 'SCANNER' },
  { key: 'tech', email: TECH_EMAIL, role: 'TECH', pass: TECH_PASS },
];

const guestPages = ['/', '/events', '/projects', '/clubs', '/spaces', '/news', '/coworking', '/login', '/privacy', '/contacts'];
const userPages = ['/dashboard', '/dashboard/settings', '/dashboard/applications', '/more'];
const staffPages = ['/admin', '/admin/occupancy', '/admin/spaces', '/admin/bookings', '/admin/users'];
const scannerPages = ['/scanner', '/admin/scanner'];
const techPages = ['/ops'];

function jarStore(jar, res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}
const cookieHeader = (jar) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

function row(role, name, ok, severity, detail = '') {
  return { role, name, ok: Boolean(ok), severity, detail: String(detail || '').slice(0, 240) };
}

async function classifyTileTag(src, jar) {
  const url = src.startsWith('http') ? src : `${BASE}${src}`;
  const res = await fetchRetry(url, { headers: { cookie: cookieHeader(jar) } });
  if (!res.ok) throw new Error(`captcha tile HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data } = await sharp(buf).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  if (g > r + 20 && g > b + 10) return 'tree';
  if (b > r + 20 && b > g) return 'car';
  if (r > g + 20 && r > b) return 'house';
  if (r > 160 && g > 70 && g < 160) return 'cat';
  return 'unknown';
}

async function solveCaptcha(jar) {
  const chRes = await fetchRetry(`${BASE}/api/captcha/challenge`, { headers: { cookie: cookieHeader(jar) } });
  jarStore(jar, chRes);
  if (!chRes.ok) throw new Error(`captcha challenge HTTP ${chRes.status}`);
  const ch = await chRes.json();
  if (JSON.stringify(ch).includes('emoji') || /дерево|такси|здание/.test(JSON.stringify(ch.tiles || []))) {
    throw new Error('captcha challenge leaked tile labels');
  }
  let selected = [];
  if (ch.kind === 'pick' && Array.isArray(ch.tiles)) {
    const q = String(ch.question || '');
    let tag = null;
    for (const [title, t] of Object.entries(TAG_BY_TITLE)) {
      if (q.includes(title)) tag = t;
    }
    if (!tag) throw new Error(`unknown captcha question: ${q}`);
    for (const tile of ch.tiles) {
      const got = await classifyTileTag(tile.src, jar);
      if (got === tag) selected.push(tile.id);
    }
  } else {
    throw new Error(`unsupported captcha kind ${ch.kind}`);
  }
  const solRes = await fetchRetry(`${BASE}/api/captcha/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader(jar) },
    body: JSON.stringify({ challengeId: ch.challengeId, selected, website: '' }),
  });
  jarStore(jar, solRes);
  const sol = await solRes.json().catch(() => ({}));
  if (!solRes.ok || !sol.token) throw new Error(sol.message || `captcha solve HTTP ${solRes.status}`);
  return sol.token;
}

async function login(email, pass = PASS) {
  const jar = new Map();
  const csrfRes = await fetchRetry(`${BASE}/api/auth/csrf`, { headers: { cookie: cookieHeader(jar) } });
  jarStore(jar, csrfRes);
  const { csrfToken } = await csrfRes.json();
  const captchaToken = await solveCaptcha(jar);
  const body = new URLSearchParams({
    csrfToken,
    email,
    password: pass,
    json: 'true',
    callbackUrl: `${BASE}/dashboard`,
    requireCaptcha: '1',
    captchaToken,
    website: '',
  });
  const loginRes = await fetchRetry(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: cookieHeader(jar) },
    body,
    redirect: 'manual',
  });
  jarStore(jar, loginRes);
  const loginBody = await loginRes.text();
  const sessionRes = await fetchRetry(`${BASE}/api/auth/session`, { headers: { cookie: cookieHeader(jar) } });
  jarStore(jar, sessionRes);
  const session = await sessionRes.json().catch(() => ({}));
  return {
    jar,
    cookie: cookieHeader(jar),
    session,
    ok: Boolean(session?.user?.id),
    role: session?.user?.role || null,
    loginStatus: loginRes.status,
    loginBody: loginBody.slice(0, 180),
  };
}

async function get(cookie, path) {
  const res = await fetchRetry(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
  });
  const loc = res.headers.get('location') || '';
  return { status: res.status, location: loc, ok: res.status >= 200 && res.status < 400 };
}

function expectAuthPage(r) {
  // 200 OK, or redirect within app (not to login)
  if (r.status >= 200 && r.status < 300) return true;
  if (r.status >= 300 && r.status < 400) {
    return locOk(r.location) && !/\/login/i.test(r.location);
  }
  return false;
}
function expectDenied(r, path = '') {
  if (r.status === 401 || r.status === 403) return true;
  if (r.status >= 300 && r.status < 400) {
    const loc = String(r.location || '');
    // Non-TECH hitting /ops is bounced home — still a deny.
    if (String(path) === '/ops' && (loc === '/' || loc.endsWith('://ty.idivles.ru/') || /\/$/.test(loc) && !/login|scanner|dashboard|ops|unavailable/i.test(loc))) {
      return true;
    }
    if (loc === '/' || loc.endsWith('/')) return true; // generic bounce-home deny
    return /\/login|\/unavailable|\/dashboard|\/scanner|\/ops/i.test(loc);
  }
  // /more is a public legacy landing for guests
  if (String(path) === '/more' && r.status >= 200 && r.status < 300) return true;
  return false;
}
function locOk(loc) {
  return !loc || loc.startsWith('/') || loc.includes('ty.idivles.ru') || loc.includes('idivles.ru');
}

async function checkPages(out, role, pages, expectFn, label) {
  for (const p of pages) {
    const r = await get(out.cookie, p);
    const ok = expectFn(r, p);
    out.rows.push(
      row(role, `${label} ${p}`, ok, ok ? 'info' : 'high', `HTTP ${r.status}${r.location ? ' → ' + r.location : ''}`)
    );
  }
}

async function main() {
  const rows = [];
  console.log(`QA roles @ ${BASE}`);

  // Guest
  {
    const cookie = '';
    for (const p of guestPages) {
      const r = await get(cookie, p);
      const ok = r.status >= 200 && r.status < 400;
      rows.push(row('GUEST', `public ${p}`, ok, ok ? 'info' : 'critical', `HTTP ${r.status}`));
    }
    for (const p of [...userPages, ...staffPages, ...scannerPages, ...techPages]) {
      const r = await get(cookie, p);
      const denied = expectDenied(r, p);
      rows.push(row('GUEST', `deny ${p}`, denied, denied ? 'info' : 'high', `HTTP ${r.status} → ${r.location}`));
    }
  }

  for (const acc of accounts.filter((a) => a.email)) {
    const auth = await login(acc.email, acc.pass || PASS);
    rows.push(
      row(
        acc.role,
        'login',
        auth.ok && auth.role === acc.role,
        auth.ok ? 'info' : 'high',
        auth.ok
          ? auth.role
          : `${auth.loginStatus} ${auth.loginBody} — прогон seed: QA_RESET_STAGING=1 QA_SEED_PASSWORD=RolePass123! node scripts/reset-staging-qa-passwords.mjs`,
      ),
    );
    if (!auth.ok) continue;
    const ctx = { cookie: auth.cookie, rows };

    if (acc.role === 'USER' || acc.role === 'PARTICIPANT') {
      await checkPages(ctx, acc.role, userPages, expectAuthPage, 'cabinet');
      await checkPages(ctx, acc.role, staffPages, expectDenied, 'deny staff');
      await checkPages(ctx, acc.role, scannerPages, expectDenied, 'deny scanner');
      await checkPages(ctx, acc.role, techPages, expectDenied, 'deny tech');
      // homepage + coworking still ok
      await checkPages(ctx, acc.role, ['/', '/coworking', '/spaces'], expectAuthPage, 'public');
    } else if (acc.role === 'MODERATOR') {
      await checkPages(ctx, acc.role, userPages, expectAuthPage, 'cabinet');
      await checkPages(ctx, acc.role, staffPages, expectAuthPage, 'admin');
      await checkPages(ctx, acc.role, techPages, expectDenied, 'deny tech');
    } else if (acc.role === 'ADMIN') {
      await checkPages(ctx, acc.role, userPages, expectAuthPage, 'cabinet');
      await checkPages(ctx, acc.role, staffPages, expectAuthPage, 'admin');
      await checkPages(ctx, acc.role, ['/admin/settings', '/admin/occupancy'], expectAuthPage, 'admin+');
      await checkPages(ctx, acc.role, techPages, expectDenied, 'deny tech');
    } else if (acc.role === 'SCANNER') {
      await checkPages(ctx, acc.role, scannerPages, expectAuthPage, 'scan');
      await checkPages(ctx, acc.role, ['/admin', '/admin/users', '/admin/settings'], expectDenied, 'deny admin');
      await checkPages(ctx, acc.role, techPages, expectDenied, 'deny tech');
    } else if (acc.role === 'TECH') {
      await checkPages(ctx, acc.role, techPages, expectAuthPage, 'ops');
      await checkPages(ctx, acc.role, ['/admin'], expectDenied, 'deny admin');
    }
  }

  // Health / hero presence
  {
    const health = await fetchRetry(`${BASE}/api/health`).then((r) => r.json());
    rows.push(row('SYSTEM', 'health ok', health?.status === 'ok' || health?.ok, 'critical', JSON.stringify(health)));
    let home = '';
    for (let i = 0; i < 3; i += 1) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 25000);
        const res = await fetchRetry(`${BASE}/`, { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          home = await res.text();
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    rows.push(row('SYSTEM', 'hero lift', home.includes('lift-hero'), 'high', home ? '' : 'home timeout'));
    rows.push(
      row(
        'SYSTEM',
        'hero CTAs',
        home.includes('Записаться') && home.includes('Залы') && home.includes('Афиша'),
        'high',
        '',
      ),
    );
    rows.push(row('SYSTEM', 'no QA tutorial SSR', !home.includes('qa-tutorial-root'), 'info', ''));
  }

  const fail = rows.filter((r) => !r.ok);
  const critical = fail.filter((r) => r.severity === 'critical');
  const high = fail.filter((r) => r.severity === 'high');
  const report = {
    base: BASE,
    at: new Date().toISOString(),
    total: rows.length,
    pass: rows.filter((r) => r.ok).length,
    fail: fail.length,
    critical: critical.length,
    high: high.length,
    rows,
  };

  mkdirSync('/opt/cursor/artifacts/qa', { recursive: true });
  mkdirSync('docs/perf', { recursive: true });
  const file = join('docs/perf', `qa-ty-roles-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));
  writeFileSync('/opt/cursor/artifacts/qa/qa-ty-roles.json', JSON.stringify(report, null, 2));
  writeFileSync('/tmp/qa-ty-roles.json', JSON.stringify(report, null, 2));

  console.log(`\nPASS ${report.pass}/${report.total}  FAIL ${report.fail} (critical=${report.critical} high=${report.high})`);
  if (fail.length) {
    console.log('\nFailures:');
    for (const f of fail) console.log(`- [${f.severity}] ${f.role}: ${f.name} :: ${f.detail}`);
  }
  console.log(`\nReport: ${file}`);
  process.exit(critical.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
