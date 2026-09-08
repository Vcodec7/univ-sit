import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');
const events = readFileSync(join(root, '../src/app/events/page.tsx'), 'utf8');
const upcoming = readFileSync(join(root, '../src/components/UpcomingEvents.tsx'), 'utf8');
const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
const rail = readFileSync(join(root, '../src/components/HomeSlideRail.tsx'), 'utf8');

test('home and events show live afisha, not the weekly bulletin', () => {
  assert.doesNotMatch(page, /WeeklyAfisha/);
  assert.doesNotMatch(events, /WeeklyAfisha/);
  assert.match(page, /UpcomingEvents/);
  assert.match(upcoming, /home-section-title[^>]*>Афиша/);
});

test('home titles skip dual-color dashes', () => {
  assert.match(unify, /home-page\.home-page--lift \.home-section-title::after[\s\S]{0,200}display:\s*none\s*!important/);
  assert.match(unify, /background-color:\s*#f9fafb\s*!important/);
});

test('html scrollbar is not forced into a layout column', () => {
  assert.doesNotMatch(unify, /html::-webkit-scrollbar\s*\{/);
  assert.match(unify, /glass-nav-inner\.container[\s\S]{0,80}max-width:\s*none\s*!important/);
});

test('home sections do not leave tall empty wells', () => {
  assert.match(unify, /home-page--lift \.home-section[\s\S]{0,80}margin-bottom:\s*0\.85rem\s*!important/);
  assert.doesNotMatch(unify, /contain-intrinsic-size:\s*1px 420px/);
  assert.match(unify, /home-rail__slide > \*[\s\S]{0,80}min-height:\s*0\s*!important/);
  assert.match(unify, /home-page--lift \.free-now-actions[\s\S]{0,80}margin-top:\s*auto\s*!important/);
});

test('home rails do not steal vertical wheel on phones', () => {
  assert.match(rail, /pointer: coarse/);
});
