import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const placesLib = readFileSync(join(root, 'src/lib/places.ts'), 'utf8');
const catalog = readFileSync(join(root, 'src/components/catalog/PlacesCatalogClient.tsx'), 'utf8');
const seed = readFileSync(join(root, 'scripts/seed-places.mjs'), 'utf8');
const detail = readFileSync(join(root, 'src/app/places/[id]/page.tsx'), 'utf8');

test('places catalog shows approximate price disclaimer', () => {
  assert.match(placesLib, /PLACE_PRICE_DISCLAIMER/);
  assert.match(placesLib, /может меняться/);
  assert.match(catalog, /PLACE_PRICE_DISCLAIMER/);
  assert.match(detail, /PLACE_PRICE_DISCLAIMER/);
  assert.match(catalog, /places-card__price/);
});

test('seed covers extra Sochi spots and packed how-to-get', () => {
  assert.match(seed, /yuzhnye-kultury/);
  assert.match(seed, /okeanarium-adler/);
  assert.match(seed, /volernyy-kompleks-laura/);
  assert.match(seed, /kanon-psakho/);
  assert.match(seed, /rosa-peak/);
  assert.match(seed, /function packTips/);
  assert.match(seed, /примерно/);
});
