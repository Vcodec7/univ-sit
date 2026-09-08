import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('captcha challenge JSON is image tiles without labels or emoji', () => {
  const lib = readFileSync(join(root, 'src/lib/captcha.ts'), 'utf8');
  const field = readFileSync(join(root, 'src/components/CaptchaField.tsx'), 'utf8');
  assert.match(lib, /\/api\/captcha\/tile\//);
  assert.match(lib, /crypto\.randomBytes\(8\)/);
  assert.doesNotMatch(lib, /tiles: tiles\.map\(\(\{ id, emoji, label \}\)/);
  assert.match(field, /CaptchaTileCanvas/);
  assert.match(field, /aria-label=\{t\.id\}/);
  assert.doesNotMatch(field, /aria-label=\{t\.label\}/);
  assert.doesNotMatch(field, /<img src=\{t\.src\}/);
  const route = readFileSync(join(root, 'src/app/api/captcha/tile/[challengeId]/[tileId]/route.ts'), 'utf8');
  assert.match(route, /image\/png/);
});
