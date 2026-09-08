import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function shouldForcePasswordChange(mustChangePassword, hasPassword) {
  if (!mustChangePassword) return false;
  if (hasPassword === false) return false;
  return true;
}

test('OAuth-only users are not forced to change password', () => {
  assert.equal(shouldForcePasswordChange(true, false), false);
  assert.equal(shouldForcePasswordChange(true, true), true);
  assert.equal(shouldForcePasswordChange(true, undefined), true);
  assert.equal(shouldForcePasswordChange(false, false), false);
});

test('Yandex onboard: no password gate without local hash; briefing navigates to guides', () => {
  const auth = readFileSync(join(root, 'src/lib/auth.ts'), 'utf8');
  assert.match(auth, /password: null, mustChangePassword: true/);
  assert.match(auth, /shouldForcePasswordChange/);

  const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
  assert.match(proxy, /\/dashboard\/guides/);
  assert.match(proxy, /shouldForcePasswordChange/);

  const modal = readFileSync(join(root, 'src/components/InstructionsWelcomeModal.tsx'), 'utf8');
  assert.match(modal, /router\.push\('\/dashboard\/guides'\)/);
  assert.match(modal, /\/change-password/);
  assert.doesNotMatch(modal, /6_000/);

  const login = readFileSync(join(root, 'src/app/login/page.tsx'), 'utf8');
  assert.match(login, /window\.location\.replace\(dest\)/);
});
