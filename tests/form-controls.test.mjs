import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/globals.css'), 'utf8');

test('native selects get appearance none and a custom chevron', () => {
  assert.match(css, /select:not\(\[multiple\]\):not\(\[size\]\) \{/);
  assert.match(css, /appearance: none;/);
  assert.match(css, /-webkit-appearance: none;/);
  assert.match(css, /data:image\/svg\+xml/);
});
