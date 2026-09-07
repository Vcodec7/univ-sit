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
  assert.match(home, /home-catalog-v10/);
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
  assert.match(hero, /extra \?/);
  assert.doesNotMatch(hero, /extra \|\| secondary/);
  assert.match(page, /href: '\/coworking', label: 'Записаться'/);
  assert.match(page, /href: '\/spaces', label: 'Залы'/);
  assert.match(hero, /resolveHomeHeroPoster/);
  assert.match(page, /home-page--lift/);
  assert.match(page, /HomeSochiStrip/);
  assert.match(page, /home-cta--split/);
  assert.match(page, /resolveHomeHeroPoster/);
  assert.match(homeHero, /sochi-sea\.jpg/);
});

test('free-now rail on lift home keeps full cards and hero buttons', () => {
  const card = readFileSync(join(root, '../src/components/HomeLiftFeedCard.tsx'), 'utf8');
  assert.match(freeNow, /HomeLiftFeedCard/);
  assert.match(card, /lift-hero__btn--lime/);
  const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
  assert.match(unify, /--rail-peek/);
  assert.match(unify, /\.home-page--lift \.free-now-actions \{[\s\S]*?grid-template-columns:\s*1fr\s*!important/);
  assert.match(unify, /min-width:\s*13\.75rem/);
  assert.match(css, /home-page--lift \.free-now-card/);
  assert.match(css, /home-page--lift \.home-rail::-webkit-scrollbar/);
  assert.match(css, /--rail-cols/);
  assert.doesNotMatch(css, /home-page--lift \.free-now-actions \{\s*margin-top: auto !important/);
  assert.match(unify, /margin-top:\s*0\.35rem !important/);
});

test('compact upcoming events reuse lift feed cards and lime venue CTA', () => {
  const events = readFileSync(join(root, '../src/components/UpcomingEvents.tsx'), 'utf8');
  assert.match(events, /free-now-card yp-feed-card lift-feed-card/);
  assert.match(events, /lift-hero__btn--ghost/);
  assert.match(events, /Площадка/);
  assert.match(page, /lift-hero__btn--lime/);
  assert.match(page, /К площадкам/);
  assert.doesNotMatch(page, /lift-hero__btn--ghost/);
});

test('home feeds reuse lift cards for projects clubs spaces news', () => {
  assert.match(page, /HomeLiftFeedCard/);
  assert.match(page, /Свежие проекты/);
  assert.match(page, /Клубы по интересам/);
  assert.match(page, /home-section-sub/);
  assert.match(page, /Инициативы, в которые можно включиться сейчас/);
  assert.match(page, /book\?from=list/);
  assert.match(page, /force-dynamic/);
  assert.match(page, /encodeRouteParam/);
  assert.doesNotMatch(page, /Открыт для заявок/);
  assert.doesNotMatch(page, /home-feed-grid/);
});
