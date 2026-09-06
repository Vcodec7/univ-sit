import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/theme-covers.ts'), 'utf8');

test('Sochi venues map to CC photos, not random beaches', () => {
  assert.match(src, /навагин\|дом молод/);
  assert.match(src, /sochi-navaginskaya\.jpg/);
  assert.match(src, /тимиряз/);
  assert.match(src, /партизан/);
  assert.match(src, /ульянов/);
  assert.match(src, /function matchVenuePhoto/);
});

test('missing uploads use branded plates, not empty frames', () => {
  assert.match(src, /brandCover/);
  assert.match(src, /\/brand\/covers\/ink-lime\.svg/);
  assert.match(src, /return brandCover\(section, index\)/);
});

test('branded cover SVGs are valid UTF-8 with wordmark', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../public/brand/covers');
  for (const name of ['ink-lime.svg', 'ink-lav.svg', 'ink-mix.svg']) {
    const xml = readFileSync(join(root, name), 'utf8');
    assert.equal(xml.includes('\x1c'), false, `${name} must not contain control chars`);
    assert.match(xml, /МОЛОДЁЖЬ СОЧИ/);
    assert.match(xml, /<svg /);
  }
});
