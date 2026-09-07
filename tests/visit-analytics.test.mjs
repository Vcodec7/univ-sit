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
});
