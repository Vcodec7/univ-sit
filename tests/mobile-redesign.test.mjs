import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const providers = readFileSync(join(root, '../src/components/Providers.tsx'), 'utf8');
const nav = readFileSync(join(root, '../src/components/Navbar.tsx'), 'utf8');
const hero = readFileSync(join(root, '../src/components/HomeServiceHero.tsx'), 'utf8');
const profile = readFileSync(join(root, '../src/components/ProfileHeroCard.tsx'), 'utf8');
const guides = readFileSync(join(root, '../src/lib/profile-guides.ts'), 'utf8');
const css = readFileSync(join(root, '../src/app/globals.css'), 'utf8');
const page = readFileSync(join(root, '../src/app/page.tsx'), 'utf8');

test('V-gesture quick access is not mounted for the public chrome', () => {
  assert.doesNotMatch(providers, /<QuickAccess/);
  assert.doesNotMatch(nav, /requestOpenQuickAccess/);
  assert.doesNotMatch(nav, /Быстрый доступ/);
  assert.doesNotMatch(guides, /quick-access/);
});

test('mobile home keeps one booking CTA and actionable deck cards', () => {
  assert.match(page, /label: 'Записаться'/);
  assert.match(hero, /lift-deck__go/);
  assert.match(css, /lift-hero__lead \{\s*display: none;/);
  const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
  assert.match(unify, /full-viewport living sea/);
  assert.match(unify, /--yp-hero-h: calc\(100svh/);
  assert.match(unify, /sochi-sky|lift-hero__stage/);
  assert.match(unify, /border-radius: 0 !important/);
  assert.match(hero, /SochiLivingSky/);
  assert.match(hero, /lift-deck__glyph/);
});

test('profile card stacks identity then actions then extras', () => {
  assert.match(profile, /profile-hero__more/);
  assert.match(profile, /Контакты и ID/);
  assert.doesNotMatch(profile, /avatar-legend-frame/);
  const unify = readFileSync(join(root, '../src/app/layout-unify.css'), 'utf8');
  assert.match(unify, /profile-hero--cabinet \.profile-hero__main/);
  assert.match(unify, /profile-hero__avatar-add/);
  assert.match(unify, /profile-hero__showcase--shelf/);
  assert.match(unify, /--chip-accent/);
  assert.match(profile, /--chip-accent/);
  assert.match(unify, /profile-hero__meters/);
  assert.match(profile, /authority == null \? '—' : `\$\{authority\}%`/);
});
