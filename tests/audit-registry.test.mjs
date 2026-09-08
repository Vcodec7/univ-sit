import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('audit registry: admin lists and notif boundary are safe', () => {
  const vac = readFileSync(join(root, '../src/components/admin/AdminVacanciesClient.tsx'), 'utf8');
  const contests = readFileSync(join(root, '../src/components/admin/AdminContestsClient.tsx'), 'utf8');
  const bell = readFileSync(join(root, '../src/components/NotificationsBell.tsx'), 'utf8');
  const dash = readFileSync(join(root, '../src/app/admin/page.tsx'), 'utf8');
  assert.match(vac, /staffUserLabel\(a\.user\)/);
  assert.match(contests, /staffUserLabel\(s\.user\)/);
  assert.match(dash, /staffUserLabel\(app\.user\)/);
  assert.match(bell, /AdminErrorBoundary/);
});

test('audit registry: booking past hours and error near submit', () => {
  const cal = readFileSync(join(root, '../src/components/BookingCalendar.tsx'), 'utf8');
  const hours = readFileSync(join(root, '../src/lib/booking-hours.ts'), 'utf8');
  const cw = readFileSync(join(root, '../src/lib/coworking.ts'), 'utf8');
  const flow = readFileSync(join(root, '../src/components/CoworkingSignupFlow.tsx'), 'utf8');
  assert.match(hours, /isMoscowHhmmPastOnDate/);
  assert.match(cal, /startOptions/);
  assert.match(cal, /scrollIntoView/);
  assert.match(cal, /messageRef/);
  assert.match(cw, /isCoworkingPeriodEnded/);
  assert.match(flow, /ended \|\| full/);
});

test('audit registry: QR query, search a11y, pdf header, safari dates', () => {
  const dash = readFileSync(join(root, '../src/components/DashboardClient.tsx'), 'utf8');
  const filter = readFileSync(join(root, '../src/components/SpaceFilterBar.tsx'), 'utf8');
  const mime = readFileSync(join(root, '../src/lib/document-mime.ts'), 'utf8');
  const dates = readFileSync(join(root, '../src/lib/format-date.ts'), 'utf8');
  const css = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
  const scan = readFileSync(join(root, '../src/app/scan/page.tsx'), 'utf8');
  assert.match(dash, /action'\) === 'showQR'/);
  assert.match(filter, /aria-label=\{placeholder\}/);
  assert.match(mime, /return 'application\/pdf'/);
  assert.match(dates, /\$1T\$2/);
  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /min-height: 48px/);
  assert.match(scan, /permanentRedirect\('\/scanner/);
});
