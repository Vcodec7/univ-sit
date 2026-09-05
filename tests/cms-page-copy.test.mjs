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

const mediaHub = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/media-hub.ts'), 'utf8');
const mediaPage = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/p/[slug]/page.tsx'), 'utf8');

test('media page is a partner hub not a plain CMS article', () => {
  assert.match(mediaHub, /Премия «ШУМ»/);
  assert.match(mediaHub, /crm.sochi/);
  assert.match(mediaHub, /MEDIA_PARTNERS/);
  assert.match(mediaPage, /MediaHubPage/);
});

const house = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/house-rules.ts'), 'utf8');

test('house rules page uses cards not a skinny article', () => {
  assert.match(house, /HOUSE_RULES/);
  assert.match(house, /Навагинская/);
  assert.match(mediaPage, /HouseRulesPage/);
});
