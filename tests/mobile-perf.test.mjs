import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');
const media = readFileSync(join(root, '../src/components/HomeHeroMedia.tsx'), 'utf8');
const sky = readFileSync(join(root, '../src/components/SochiLivingSky.tsx'), 'utf8');
const skyCss = readFileSync(join(root, '../src/app/sochi-living-sky.css'), 'utf8');
const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
const hero = readFileSync(join(root, '../src/components/HomeServiceHero.tsx'), 'utf8');

test('home stays request-time so canonical is not baked as localhost', () => {
  assert.match(page, /export const dynamic = 'force-dynamic'/);
  assert.doesNotMatch(page, /export const revalidate = 60/);
});

test('hero video does not autoplay until desktop motion is allowed', () => {
  assert.match(media, /allowMotionVideo/);
  assert.match(media, /preferStillHeroVideo/);
  assert.match(media, /showVideo = wantVideo && Boolean\(video\) && !videoFailed && allowMotionVideo/);
});

test('living sky stays mounted when the window shrinks; video still skips on phones', () => {
  assert.match(sky, /if \(!enabled\) return null/);
  assert.match(sky, /pointer: coarse/);
  assert.doesNotMatch(sky, /max-width: 900px/);
  assert.doesNotMatch(skyCss, /\.sochi-sky \{\s*display: none !important;/);
  assert.doesNotMatch(unify, /\.sochi-sky \{\s*display: none !important;/);
  assert.match(media, /preferStillHeroVideo/);
});

test('home deck does not prefetch four routes on first paint', () => {
  assert.match(hero, /prefetch=\{false\}/);
});
