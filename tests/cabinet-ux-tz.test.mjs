import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('cabinet hubs stay within Miller 7±2 and hide settings', () => {
  const nav = readFileSync(join(root, 'src/lib/cabinet-nav.ts'), 'utf8');
  const menu = readFileSync(join(root, 'src/components/CabinetMenu.tsx'), 'utf8');
  assert.match(nav, /Моя страница/);
  assert.match(nav, /Общение/);
  assert.match(nav, /Мои дела/);
  assert.match(nav, /Прогресс/);
  assert.doesNotMatch(nav, /id: 'settings'/);
  assert.doesNotMatch(nav, /href: '\/dashboard\/settings'/);
  assert.doesNotMatch(menu, /settings: Settings/);
});

test('login SMS CTA is gated on ready provider', () => {
  const src = readFileSync(join(root, 'src/app/login/page.tsx'), 'utf8');
  assert.doesNotMatch(src, /Войти по телефону и SMS/);
  assert.doesNotMatch(src, /smsOn && smsReady/);
  assert.match(src, /SocialAuthButtons/);
});

test('edit intercepting route and shop grid exist', () => {
  const layout = readFileSync(join(root, 'src/app/dashboard/layout.tsx'), 'utf8');
  const intercept = readFileSync(join(root, 'src/app/dashboard/@modal/(.)edit/page.tsx'), 'utf8');
  const shop = readFileSync(join(root, 'src/components/EcoPointsPanel.tsx'), 'utf8');
  assert.match(layout, /modal/);
  assert.match(intercept, /ProfileEditInterceptModal/);
  assert.match(shop, /eco-live-preview/);
  assert.match(shop, /eco-panel__catalog--grid/);
});
