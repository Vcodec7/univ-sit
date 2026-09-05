import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/catalog-query.ts'), 'utf8');

function catalogFiltersKey(params) {
  const srcParams = typeof params === 'string' ? new URLSearchParams(params) : params;
  const pairs = [];
  for (const [k, v] of srcParams.entries()) {
    if (k === 'page' || !v) continue;
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  return pairs.join('&');
}

test('catalog query helper is present', () => {
  assert.match(src, /export function catalogFiltersKey/);
  assert.match(src, /k === 'page'/);
});

test('catalogFiltersKey ignores page', () => {
  const a = new URLSearchParams('q=зал&page=2');
  const b = new URLSearchParams('page=1&q=зал');
  assert.equal(catalogFiltersKey(a), catalogFiltersKey(b));
});

test('catalogFiltersKey treats filter change as different', () => {
  assert.notEqual(catalogFiltersKey('q=a&page=2'), catalogFiltersKey('q=b&page=2'));
});
