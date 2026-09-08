import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('next free window labels opening vs now', () => {
  const occ = readFileSync(join(root, 'src/lib/hall-occupancy.ts'), 'utf8');
  assert.match(occ, /Свободно сейчас/);
  assert.match(occ, /Откроется в \$\{from\}/);
});

test('home free-now cards align actions and hide empty afisha', () => {
  const unify = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  const freeNow = readFileSync(join(root, 'src/components/FreeNowSpaces.tsx'), 'utf8');
  const events = readFileSync(join(root, 'src/components/UpcomingEvents.tsx'), 'utf8');
  const page = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
  const covers = readFileSync(join(root, 'src/lib/theme-covers.ts'), 'utf8');
  assert.match(unify, /\.home-page\.home-page--lift \.free-now-actions \{[\s\S]*?margin-top:\s*auto/);
  assert.match(unify, /\.home-page--lift \.lift-deck__go \{[\s\S]*?margin-top:\s*auto/);
  assert.match(unify, /\.home-page--lift \.home-cta-split \.lift-hero__btn \{[\s\S]*?margin-top:\s*auto/);
  assert.match(unify, /gov-strip-actions \.gov-chip \{[\s\S]*?min-height:\s*3\.35rem/);
  assert.match(freeNow, /label: 'Расписание'/);
  assert.match(freeNow, /label: 'Записаться'/);
  assert.match(events, /hideEmpty/);
  assert.match(page, /hideEmpty/);
  assert.match(covers, /export function spaceCover[\s\S]{0,700}return HALL_POOL/);
});
