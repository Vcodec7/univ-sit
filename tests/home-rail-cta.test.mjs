import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('home rails stretch all feed cards, not only free-now', () => {
  const css = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  const last = [...css.matchAll(/\.home-page(?:\.home-page)?--lift \.home-rail\s*\{[^}]+\}/g)].pop()?.[0] || '';
  assert.match(last, /align-items:\s*stretch/);
  assert.doesNotMatch(last, /flex-start/);
  const actions = [...css.matchAll(/\.home-page(?:\.home-page)?--lift \.free-now-actions\s*\{[^}]+\}/g)].pop()?.[0] || '';
  assert.match(actions, /margin-top:\s*auto/);
});
