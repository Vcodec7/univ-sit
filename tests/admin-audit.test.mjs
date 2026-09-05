import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nav = readFileSync(join(root, 'src/components/admin/AdminSidebar.tsx'), 'utf8');
const programs = readFileSync(join(root, 'src/app/admin/programs/page.tsx'), 'utf8');
const audit = readFileSync(join(root, 'docs/AUDIT-FULL-2026-09-05.md'), 'utf8');

test('admin nav includes occupancy and programs confirm delete', () => {
  assert.match(nav, /\/admin\/occupancy/);
  assert.match(programs, /ConfirmSubmitButton/);
  assert.match(audit, /Вакансии/);
  assert.match(audit, /не кликали живьём/);
});
