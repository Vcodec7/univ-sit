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
