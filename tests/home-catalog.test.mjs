import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const home = readFileSync(join(root, '../src/lib/home-catalog.ts'), 'utf8');
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');
const hero = readFileSync(join(root, '../src/components/HomeServiceHero.tsx'), 'utf8');
const freeNow = readFileSync(join(root, '../src/components/FreeNowSpaces.tsx'), 'utf8');
const css = readFileSync(join(root, '../src/app/globals.css'), 'utf8');
const homeHero = readFileSync(join(root, '../src/lib/home-hero.ts'), 'utf8');

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
  assert.match(hero, /SochiLivingSky/);
  assert.match(hero, /Старт с Сочи/);
  assert.match(hero, /Дом молодёжи/);
  assert.match(hero, /href: '\/coworking'/);
  assert.match(hero, /resolveHomeHeroPoster/);
  assert.match(page, /home-page--lift/);
  assert.match(page, /HomeSochiStrip/);
  assert.match(page, /home-cta--split/);
  assert.match(page, /resolveHomeHeroPoster/);
  assert.match(homeHero, /sochi-sea\.jpg/);
});

test('free-now rail on lift home keeps full cards and hero buttons', () => {
  assert.match(freeNow, /lift-hero__btn--lime/);
  assert.match(css, /home-page--lift \.free-now-card/);
  assert.match(css, /home-page--lift \.home-rail::-webkit-scrollbar/);
  assert.match(css, /--rail-cols/);
  assert.match(css, /margin-top: auto !important/);
});

test('home feeds reuse lift cards for projects clubs spaces news', () => {
  assert.match(page, /HomeLiftFeedCard/);
  assert.match(page, /Свежие проекты/);
  assert.match(page, /Клубы по интересам/);
  assert.match(page, /home-section-sub/);
  assert.match(page, /Инициативы, в которые можно включиться сейчас/);
  assert.doesNotMatch(page, /home-section-kicker/);
  assert.doesNotMatch(page, /home-feed-grid/);
});
