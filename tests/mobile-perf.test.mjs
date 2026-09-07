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

test('home is ISR so phones are not blocked on Prisma every visit', () => {
  assert.match(page, /export const revalidate = 60/);
  assert.doesNotMatch(page, /export const dynamic = 'force-dynamic'/);
});

test('hero video does not autoplay until desktop motion is allowed', () => {
  assert.match(media, /allowMotionVideo/);
  assert.match(media, /isLiteMotionDevice/);
  assert.match(media, /showVideo = wantVideo && Boolean\(video\) && !videoFailed && allowMotionVideo/);
});

test('living sky is not mounted on lite / phone devices', () => {
  assert.match(sky, /if \(!enabled\) return null/);
  assert.match(sky, /isLiteMotionDevice/);
  assert.match(skyCss, /\.sochi-sky \{\s*display: none !important;/);
  assert.match(unify, /\.sochi-sky \{\s*display: none !important;/);
});

test('home deck does not prefetch four routes on first paint', () => {
  assert.match(hero, /prefetch=\{false\}/);
});
