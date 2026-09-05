import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const home = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/lib/home-catalog.ts'), 'utf8');
const page = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/app/page.tsx'), 'utf8');

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
