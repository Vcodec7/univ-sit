import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const week = readFileSync(join(root, '../src/components/WeeklyAfisha.tsx'), 'utf8');
const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
const rail = readFileSync(join(root, '../src/components/HomeSlideRail.tsx'), 'utf8');

test('weekly afisha uses the same section head as spaces, not a kicker hero or hashtag foot', () => {
  assert.doesNotMatch(week, /afisha-kicker/);
  assert.doesNotMatch(week, /afisha-hero/);
  assert.doesNotMatch(week, /afisha-foot/);
  assert.doesNotMatch(week, /#афишанедели/);
  assert.match(week, /home-section-title/);
  assert.match(week, /Вся афиша/);
});

test('home titles keep lime and purple dashes', () => {
  assert.match(unify, /home-section-title::after[\s\S]{0,500}#afca03[\s\S]{0,120}#8562d8/);
  assert.doesNotMatch(unify, /home-section-title::after,\s*\n\.home-section-title::after \{\s*display: none/);
});

test('html scrollbar is not forced into a layout column', () => {
  assert.doesNotMatch(unify, /html::-webkit-scrollbar\s*\{/);
  assert.match(unify, /glass-nav-inner\.container[\s\S]{0,80}max-width:\s*none\s*!important/);
});

test('home sections do not leave tall empty wells', () => {
  assert.match(unify, /home-page--lift \.home-section[\s\S]{0,80}margin-bottom:\s*0\.85rem\s*!important/);
  assert.match(unify, /home-rail__slide > \*[\s\S]{0,80}min-height:\s*0\s*!important/);
  assert.match(unify, /home-page--lift \.free-now-actions[\s\S]{0,80}margin-top:\s*0\.35rem\s*!important/);
});

test('home rails do not steal vertical wheel on phones', () => {
  assert.match(rail, /pointer: coarse/);
});
