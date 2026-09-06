import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const home = readFileSync(join(root, '../src/lib/home-catalog.ts'), 'utf8');
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');
const hero = readFileSync(join(root, '../src/components/HomeServiceHero.tsx'), 'utf8');

test('home catalog stays slim for first paint', () => {
  assert.match(home, /HOME_FEED_TAKE = 8/);
  assert.match(home, /homeExcerpt/);
  assert.match(home, /home-catalog-v9/);
  assert.doesNotMatch(home, /_count/);
});

test('home streams heavy sections and does not embed session CTAs in the feed', () => {
  assert.match(page, /Suspense/);
  assert.match(page, /compact/);
  assert.doesNotMatch(page, /GuestAuthPrompt/);
});

test('home lift hero keeps Sochi copy, product deck and exclusive media', () => {
  assert.match(hero, /className="lift-hero"/);
  assert.match(hero, /HomeHeroMedia/);
  assert.match(hero, /Старт с Сочи/);
  assert.match(hero, /Дом молодёжи/);
  assert.match(hero, /href: '\/coworking'/);
  assert.match(page, /home-page--lift/);
  assert.match(page, /HomeSochiStrip/);
  assert.match(page, /home-cta--split/);
});
