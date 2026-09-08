import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('profile bento hides toolbar buttons behind gear', () => {
  const src = readFileSync(join(root, 'src/components/ProfileHeroCard.tsx'), 'utf8');
  assert.match(src, /profile-hero--bento/);
  assert.match(src, /profile-hero__gear-menu/);
  assert.match(src, /QR-пропуск/);
  assert.match(src, /is-locked/);
  assert.doesNotMatch(src, /profile-hero__toolbar/);
});

test('cabinet tabs include records and chat', () => {
  const src = readFileSync(join(root, 'src/components/CabinetHubTabs.tsx'), 'utf8');
  assert.match(src, /Мои записи/);
  assert.match(src, /Общение/);
  const list = readFileSync(join(root, 'src/components/CoworkingCabinetList.tsx'), 'utf8');
  assert.match(list, /Календарь/);
  assert.match(list, /Предстоит/);
});

test('admin command palette finds create news', () => {
  const src = readFileSync(join(root, 'src/lib/admin-commands.ts'), 'utf8');
  assert.match(src, /Создать новость/);
  assert.match(src, /Создать проект/);
  const pal = readFileSync(join(root, 'src/components/admin/AdminCommandPalette.tsx'), 'utf8');
  assert.match(pal, /cmdk/);
});

test('applications board has bulk and slide-over', () => {
  const src = readFileSync(join(root, 'src/components/admin/ApplicationsBoard.tsx'), 'utf8');
  assert.match(src, /Одобрить выбранных/);
  assert.match(src, /admin-slideover/);
});

test('news form stepper and vaul sheet exist', () => {
  const news = readFileSync(join(root, 'src/components/admin/NewsDraftForm.tsx'), 'utf8');
  assert.match(news, /Черновик сохраняется автоматически/);
  const sheet = readFileSync(join(root, 'src/components/ui/MobileSheet.tsx'), 'utf8');
  assert.match(sheet, /vaul/);
});
