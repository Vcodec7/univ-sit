import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sky = readFileSync(join(root, 'src/lib/sochi-sky.ts'), 'utf8');
const overlay = readFileSync(join(root, 'src/components/SochiLivingSky.tsx'), 'utf8');
const css = readFileSync(join(root, 'src/app/sochi-living-sky.css'), 'utf8');
const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');

test('living Sochi sky uses Moscow time, fauna and reduced-motion', () => {
  assert.match(sky, /Europe\/Moscow/);
  assert.match(sky, /sunrise: 6\.55 - tilt/);
  assert.match(overlay, /sochi-sky__dolphin/);
  assert.match(overlay, /sochi-sky__birds/);
  assert.match(overlay, /data-phase/);
  assert.match(css, /sochi-leap/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(layout, /sochi-living-sky\.css/);
  assert.ok(layout.indexOf('sochi-living-sky.css') > layout.indexOf('layout-unify.css'));
});
