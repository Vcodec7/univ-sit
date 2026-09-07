import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const captcha = readFileSync(join(root, 'src/lib/captcha.ts'), 'utf8');
const field = readFileSync(join(root, 'src/components/CaptchaField.tsx'), 'utf8');
const tileRoute = readFileSync(
  join(root, 'src/app/api/captcha/tile/[challengeId]/[tileId]/route.ts'),
  'utf8'
);
const png = readFileSync(join(root, 'src/lib/captcha-tile-png.ts'), 'utf8');

test('captcha challenge does not send emoji tiles to the client', () => {
  assert.match(captcha, /imageUrl: `\/api\/captcha\/tile\//);
  assert.doesNotMatch(captcha, /tiles\.map\(\(\{ id, emoji, label \}\)/);
  assert.match(png, /sharp\(Buffer\.from\(svg\)\)\.png\(\)/);
  assert.match(tileRoute, /captchaTilePng/);
});

test('captcha field renders raster img, not unicode emoji in the tile button', () => {
  assert.match(field, /t\.imageUrl/);
  assert.match(field, /<img/);
  assert.doesNotMatch(field, /\{t\.emoji\}/);
});
