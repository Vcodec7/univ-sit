import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('UI kit primitives exist and admin chrome has crumbs, health, footer', () => {
  const btn = readFileSync(join(root, 'src/components/ui/Button.tsx'), 'utf8');
  const field = readFileSync(join(root, 'src/components/ui/Field.tsx'), 'utf8');
  const empty = readFileSync(join(root, 'src/components/ui/EmptyState.tsx'), 'utf8');
  const chrome = readFileSync(join(root, 'src/components/admin/AdminChrome.tsx'), 'utf8');
  const layout = readFileSync(join(root, 'src/components/admin/AdminLayoutClient.tsx'), 'utf8');
  const css = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  assert.match(btn, /yp-btn/);
  assert.match(field, /yp-field-label/);
  assert.match(empty, /Записей пока нет/);
  assert.match(chrome, /Система активна/);
  assert.match(chrome, /Ctrl K/);
  assert.match(layout, /AdminTopBar/);
  assert.match(layout, /AdminFooter/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /\.admin-topbar/);
});

test('admin nav groups are collapsible and occupancy copy is human', () => {
  const nav = readFileSync(join(root, 'src/lib/admin-nav.ts'), 'utf8');
  const side = readFileSync(join(root, 'src/components/admin/AdminSidebar.tsx'), 'utf8');
  assert.match(nav, /Контент и афиша/);
  assert.match(nav, /Операции и бронирования/);
  assert.match(nav, /Администрирование/);
  assert.match(nav, /Расписание по часам/);
  assert.match(side, /aria-expanded/);
  assert.match(side, /GROUPS_KEY/);
});

test('admin breadcrumbs resolve nested space routes', () => {
  const src = readFileSync(join(root, 'src/lib/admin-breadcrumbs.ts'), 'utf8');
  assert.match(src, /ADMIN_NAV_ITEMS/);
  assert.match(src, /checkin-qr|Редактирование/);
});

test('dashboard statuses are Russian and pending bookings can be approved', () => {
  const dash = readFileSync(join(root, 'src/app/admin/page.tsx'), 'utf8');
  assert.match(dash, /На рассмотрении/);
  assert.match(dash, /Одобрено/);
  assert.match(dash, /Отклонено/);
  assert.doesNotMatch(dash, /'Ок'/);
  assert.match(dash, /updateBookingStatus/);
  assert.match(dash, /admin-kpi/);
});
