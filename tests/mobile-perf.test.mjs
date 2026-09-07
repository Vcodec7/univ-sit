import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');
const layout = readFileSync(join(root, '../src/app/layout.tsx'), 'utf8');
const media = readFileSync(join(root, '../src/components/HomeHeroMedia.tsx'), 'utf8');
const sky = readFileSync(join(root, '../src/components/SochiLivingSky.tsx'), 'utf8');
const skyCss = readFileSync(join(root, '../src/app/sochi-living-sky.css'), 'utf8');
const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
const hero = readFileSync(join(root, '../src/components/HomeServiceHero.tsx'), 'utf8');

test('home stays request-time so canonical is not baked as localhost', () => {
  assert.match(page, /export const dynamic = 'force-dynamic'/);
  assert.doesNotMatch(page, /export const revalidate = 60/);
  assert.match(page, /publicAssetUrl/);
  assert.match(layout, /publicAssetUrl/);
});

test('hero video does not autoplay until desktop motion is allowed', () => {
  assert.match(media, /allowMotionVideo/);
  assert.match(media, /preferStillHeroVideo/);
  assert.match(media, /showVideo = wantVideo && Boolean\(video\) && !videoFailed && allowMotionVideo/);
});

test('living sky stays mounted when the window shrinks; video still skips on phones', () => {
  assert.doesNotMatch(sky, /if \(!enabled\) return null/);
  assert.doesNotMatch(sky, /max-width: 900px/);
  assert.doesNotMatch(skyCss, /\.sochi-sky \{\s*display: none !important;/);
  assert.doesNotMatch(unify, /\.sochi-sky \{\s*display: none !important;/);
  assert.match(media, /preferStillHeroVideo/);
});

test('mobile home hides the four-icon deck between hero and free-now', () => {
  assert.match(unify, /@media \(max-width: 860px\)[\s\S]*?\.lift-deck \{\s*display: none !important;/);
});

test('home defers heavy client rails without unmounting the sky', () => {
  assert.match(page, /dynamic\(\(\) => import\('@\/components\/HomeSlideRail'\)/);
  assert.doesNotMatch(page, /dynamic\(\(\) => import\('@\/components\/SochiLivingSky'\)/);
  assert.doesNotMatch(page, /WeeklyAfisha/);
});

test('home deck does not prefetch four routes on first paint', () => {
  assert.match(hero, /prefetch=\{false\}/);
});

test('catalog titles wrap on words, search input keeps icon padding, moon is a sphere', () => {
  assert.match(unify, /catalog-page-header__intro \.page-hero-title[\s\S]{0,240}overflow-wrap:\s*break-word\s*!important/);
  assert.match(unify, /space-filter-bar__input[\s\S]{0,80}2\.5rem/);
  assert.doesNotMatch(skyCss, /inset -14px -5px 0 0/);
  assert.match(skyCss, /\.sochi-sky__moon[\s\S]{0,520}inset -7px -5px 12px/);
});
