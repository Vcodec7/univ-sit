import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('site-change guard notifies developer env + audit log', () => {
  const src = readFileSync(join(root, 'src/lib/site-change-guard.ts'), 'utf8');
  assert.match(src, /DEVELOPER_EMAIL/);
  assert.match(src, /logAdminAction/);
  assert.match(src, /tgSend/);
});

test('admin modules API is stealth 404 not an admin kill-switch', () => {
  const src = readFileSync(join(root, 'src/app/api/admin/modules/route.ts'), 'utf8');
  assert.match(src, /status:\s*404/);
  assert.doesNotMatch(src, /setModuleFlags/);
});
