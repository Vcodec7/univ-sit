import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('admin cmdk is global: Ctrl/Cmd+K, Russian labels, wired in layout', () => {
  const pal = readFileSync(join(root, 'src/components/admin/AdminCommandPalette.tsx'), 'utf8');
  assert.match(pal, /metaKey \|\| e.ctrlKey/);
  assert.match(pal, /e.key.toLowerCase\(\) === 'k'/);
  assert.match(pal, /Поиск по панели/);
  assert.match(pal, /Команды/);
  const layout = readFileSync(join(root, 'src/components/admin/AdminLayoutClient.tsx'), 'utf8');
  assert.match(layout, /AdminCommandPalette/);
  assert.match(layout, /AdminErrorBoundary/);
  const cmds = readFileSync(join(root, 'src/lib/admin-commands.ts'), 'utf8');
  assert.match(cmds, /Создать новость/);
  assert.match(cmds, /Создать страницу/);
});

test('sticky thead and card stacking CSS', () => {
  const css = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  assert.match(css, /admin-table-wrap--sticky/);
  assert.match(css, /var\(--nav-h/);
  assert.match(css, /admin-bulk-bar--float/);
  const users = readFileSync(join(root, 'src/components/admin/UsersBoard.tsx'), 'utf8');
  assert.match(users, /admin-table-wrap--sticky/);
  const news = readFileSync(join(root, 'src/components/admin/NewsListBoard.tsx'), 'utf8');
  assert.match(news, /admin-table-wrap--sticky/);
  const bookings = readFileSync(join(root, 'src/components/admin/BookingsBoard.tsx'), 'utf8');
  assert.match(bookings, /admin-table-wrap--sticky/);
  const occ = readFileSync(join(root, 'src/components/admin/AdminOccupancyClient.tsx'), 'utf8');
  assert.match(occ, /admin-table-wrap--sticky/);
  const audit = readFileSync(join(root, 'src/app/admin/audit-log/page.tsx'), 'utf8');
  assert.match(audit, /admin-table-wrap--sticky/);
});

test('bulk bars exist for applications, users, bookings, news', () => {
  const apps = readFileSync(join(root, 'src/components/admin/ApplicationsBoard.tsx'), 'utf8');
  assert.match(apps, /Одобрить выбранных/);
  assert.match(apps, /admin-bulk-bar--float/);
  const users = readFileSync(join(root, 'src/components/admin/UsersBoard.tsx'), 'utf8');
  assert.match(users, /Заблокировать выбранных/);
  assert.match(users, /Удалить выбранных/);
  assert.match(users, /window.confirm|ConfirmSubmitButton/);
  const bookings = readFileSync(join(root, 'src/components/admin/BookingsBoard.tsx'), 'utf8');
  assert.match(bookings, /Одобрить выбранных/);
});

test('useAdminDraft 2s path+entity and restore banner', () => {
  const hook = readFileSync(join(root, 'src/lib/use-admin-draft.ts'), 'utf8');
  assert.match(hook, /ADMIN_DRAFT_INTERVAL_MS = 2000/);
  assert.match(hook, /yp-admin-draft:/);
  assert.match(hook, /export function useAdminDraft/);
  const banner = readFileSync(join(root, 'src/components/admin/AdminDraftBanner.tsx'), 'utf8');
  assert.match(banner, /Восстановлено из черновика/);
  const news = readFileSync(join(root, 'src/components/admin/NewsDraftForm.tsx'), 'utf8');
  assert.match(news, /useAdminDraft/);
});

test('slideover on users and applications', () => {
  const users = readFileSync(join(root, 'src/components/admin/UsersBoard.tsx'), 'utf8');
  assert.match(users, /AdminSlideover/);
  const apps = readFileSync(join(root, 'src/components/admin/ApplicationsBoard.tsx'), 'utf8');
  assert.match(apps, /AdminSlideover/);
  const slide = readFileSync(join(root, 'src/components/admin/AdminSlideover.tsx'), 'utf8');
  assert.match(slide, /admin-slideover/);
});

test('admin bookings does not pass closures into the client board', () => {
  const page = readFileSync(join(root, 'src/app/admin/bookings/page.tsx'), 'utf8');
  assert.doesNotMatch(page, /hrefFor=\{\(opts\)/);
  assert.match(page, /listTab=\{activeTab\}/);
  const apps = readFileSync(join(root, 'src/app/admin/applications/page.tsx'), 'utf8');
  assert.match(apps, /@\/lib\/serialize-application/);
  const err = readFileSync(join(root, 'src/app/admin/error.tsx'), 'utf8');
  assert.match(err, /Попробовать снова/);
});

test('admin toasts: Russian, 5s, no raw codes', () => {
  const fetch = readFileSync(join(root, 'src/lib/admin-fetch.ts'), 'utf8');
  assert.match(fetch, /duration: TOAST_MS/);
  assert.match(fetch, /Нужно войти в аккаунт/);
  assert.match(fetch, /Сервер временно недоступен/);
  assert.match(fetch, /looksStack/);
  const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
  assert.match(fetch, /5000/);
  assert.match(layout, /error: \{ duration: 5000 \}/);
});
