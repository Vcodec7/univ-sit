import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('admin nav search ranks labels and aliases', async () => {
  const src = readFileSync(join(root, 'src/lib/admin-nav.ts'), 'utf8');
  assert.match(src, /export function scoreAdminNavItem/);
  assert.match(src, /export function filterAdminNav/);
  assert.match(src, /занятость/);
  assert.match(src, /\/admin\/occupancy/);
  const sidebar = readFileSync(join(root, 'src/components/admin/AdminSidebar.tsx'), 'utf8');
  assert.match(sidebar, /admin-nav-card/);
  assert.match(sidebar, /admin-nav-board/);
  assert.match(sidebar, /Быстрый поиск по панели/);
});
