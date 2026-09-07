import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('visit snapshot covers afisha coworking halls and unique people', () => {
  const src = readFileSync(join(root, 'src/lib/visit-analytics.ts'), 'utf8');
  assert.match(src, /ticketCheckIn/);
  assert.match(src, /coworkingSignup/);
  assert.match(src, /presenceCheckIn/);
  assert.match(src, /uniquePeople/);
  assert.match(src, /noShows/);
  assert.match(src, /bookingMode: \{ in: \['HALL', 'BOTH'\] \}/);
  assert.match(src, /participants: \{ none: \{\} \}/);
  assert.match(src, /groupBy/);
  assert.doesNotMatch(src, /take: 4000/);
});

test('monthly admin report emails staff on the first day', () => {
  const src = readFileSync(join(root, 'src/lib/monthly-admin-report.ts'), 'utf8');
  assert.match(src, /MONTHLY_VISIT_/);
  assert.match(src, /day !== 1/);
  assert.match(src, /sendEmail/);
  const cron = readFileSync(join(root, 'src/app/api/cron/reminders/route.ts'), 'utf8');
  assert.match(cron, /sendMonthlyVisitReport/);
  const stats = readFileSync(join(root, 'src/app/admin/stats/page.tsx'), 'utf8');
  assert.match(stats, /Коворкинг/);
  assert.match(stats, /summary.visits/);
  const statsApi = readFileSync(join(root, 'src/app/api/admin/stats/route.ts'), 'utf8');
  assert.match(statsApi, /sendMonthlyVisitReport/);
});

test('staging postgres pool stays small and reused', () => {
  const src = readFileSync(join(root, 'src/lib/prisma.ts'), 'utf8');
  assert.match(src, /YP_PG_POOL_MAX/);
  assert.match(src, /globalForPrisma.pgPool = pool/);
  assert.match(src, /globalForPrisma.prisma = prisma/);
});

test('legal pages do not re-seed CMS on every request', () => {
  const src = readFileSync(join(root, 'src/lib/system-pages.ts'), 'utf8');
  assert.match(src, /ENSURE_TTL_MS/);
});

test('qa-ty-roles expects lift hero CTAs', () => {
  const src = readFileSync(join(root, 'scripts/qa-ty-roles.mjs'), 'utf8');
  assert.match(src, /lift-hero/);
  assert.match(src, /Залы/);
  assert.doesNotMatch(src, /home-hero--video/);
  assert.doesNotMatch(src, /Записаться в коворкинг/);
});
