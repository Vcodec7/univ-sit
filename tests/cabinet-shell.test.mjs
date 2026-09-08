import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('dashboard layout keeps cabinet chrome across leaf routes', () => {
  const layout = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/dashboard/layout.tsx'), 'utf8');
  const loading = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/dashboard/loading.tsx'), 'utf8');
  const sub = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/components/CabinetSubpage.tsx'), 'utf8');
  assert.match(layout, /CabinetShell/);
  assert.doesNotMatch(loading, /dashboard-page/);
  assert.doesNotMatch(sub, /CabinetMenu/);
  const nav = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/cabinet-nav.ts'), 'utf8');
  assert.match(nav, /href: '\/dashboard\/friends'/);
  assert.match(nav, /href: '\/dashboard\/messages'/);
  assert.match(nav, /href: '\/dashboard\/tickets'/);
});

test('mobile dashboard kills HUD spin and dock blur', () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/layout-unify.css'), 'utf8');
  assert.match(css, /player-hud__badge-glow/);
  assert.match(css, /player-hud__xp-shine/);
  const menu = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/components/CabinetMenu.tsx'), 'utf8');
  assert.match(menu, /prefetch=\{false\}/);
  const shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/components/CabinetShell.tsx'), 'utf8');
  assert.match(shell, /min-width: 900px/);
});

test('profile edit is a page, captcha tiles are not labelled', () => {
  const edit = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/dashboard/edit/page.tsx'), 'utf8');
  assert.match(edit, /view="edit"/);
  assert.doesNotMatch(edit, /router\.replace\('\/dashboard#profile-edit'\)/);
  const dash = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/components/DashboardClient.tsx'), 'utf8');
  assert.doesNotMatch(dash, /yp-sheet--profile/);
  const pwa = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/components/PwaInstallBanner.tsx'), 'utf8');
  assert.match(pwa, /\/dashboard\/edit/);
});
