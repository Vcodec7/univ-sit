import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/cms-page-copy.ts'), 'utf8');

test('youth CMS copy keeps house rules and media meaning', () => {
  assert.match(src, /Правила в доме/);
  assert.match(src, /Медиапроекты/);
  assert.match(src, /pravila-dm/);
});
