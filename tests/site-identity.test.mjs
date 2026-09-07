import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/site-identity-shared.ts'),
  'utf8'
);
const ident = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/site-identity.ts'),
  'utf8'
);

test('public origin prefers a real host over localhost', () => {
  assert.match(src, /function resolvePublicOrigin/);
  assert.match(src, /candidates\.find/);
  assert.match(ident, /x-forwarded-host/);
  assert.match(ident, /withRequestHost/);
});
