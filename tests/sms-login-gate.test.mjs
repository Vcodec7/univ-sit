import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const login = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/login/page.tsx'),
  'utf8'
);

test('SMS login UI is hidden unless enabled and provider ready', () => {
  assert.match(login, /smsLoginShow = smsOn && smsReady/);
  assert.match(login, /smsLoginShow \?/);
  assert.match(login, /yp-auth-swap/);
  assert.doesNotMatch(login, /провайдер не настроен/);
});
