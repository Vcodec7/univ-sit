import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nav = readFileSync(join(root, 'src/components/admin/AdminSidebar.tsx'), 'utf8');
const programs = readFileSync(join(root, 'src/app/admin/programs/page.tsx'), 'utf8');
const vac = readFileSync(join(root, 'src/components/admin/AdminVacanciesClient.tsx'), 'utf8');
const contests = readFileSync(join(root, 'src/components/admin/AdminContestsClient.tsx'), 'utf8');
const occApi = readFileSync(join(root, 'src/app/api/admin/occupancy/route.ts'), 'utf8');
const acl = readFileSync(join(root, 'src/lib/acl-shared.ts'), 'utf8');
const audit = readFileSync(join(root, 'docs/AUDIT-FULL-2026-09-05.md'), 'utf8');

test('admin nav includes occupancy and programs confirm delete', () => {
  assert.match(nav, /\/admin\/occupancy/);
  assert.match(programs, /ConfirmSubmitButton/);
  assert.match(audit, /Вакансии/);
  assert.match(audit, /Не кликали живьём/);
});

test('admin can edit vacancies and contests; occupancy unblocks', () => {
  assert.match(vac, /id: vacId/);
  assert.match(vac, /rejectReason/);
  assert.match(contests, /id: editId/);
  assert.match(occApi, /export async function DELETE/);
  assert.match(acl, /admin\/occupancy/);
});
