import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('guest games hub and client skip user score APIs', () => {
  const hub = readFileSync(join(root, 'src/app/games/page.tsx'), 'utf8');
  const client = readFileSync(join(root, 'src/lib/game-scores-client.ts'), 'utf8');
  const get = readFileSync(join(root, 'src/app/api/user/games/route.ts'), 'utf8');
  const hint = readFileSync(join(root, 'src/lib/session-hint.ts'), 'utf8');
  assert.match(hint, /hasAuthSessionCookie/);
  assert.match(client, /hasAuthSessionCookie\(\)/);
  assert.match(hub, /status === "authenticated"/);
  assert.match(hub, /status === "loading"/);
  const getFn = get.split('export async function POST')[0];
  assert.match(getFn, /scores: \[\]/);
  assert.doesNotMatch(getFn, /status: 401/);
});
