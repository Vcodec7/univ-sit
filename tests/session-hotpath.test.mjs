import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('session jwt skips extra presence and moderation writes for warm staff', () => {
  const auth = readFileSync(join(root, 'src/lib/auth.ts'), 'utf8');
  assert.match(auth, /lastActiveAt: true/);
  assert.match(auth, /idleMs >= 45_000/);
  assert.match(auth, /isStaffRole\(dbUser\.role\) && dbUser\.moderationApprovedAt/);
});

test('ops-console max-width is declared once', () => {
  const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
  const hits = [...css.matchAll(/\.ops-console\s*\{/g)];
  assert.equal(hits.length, 1);
});
