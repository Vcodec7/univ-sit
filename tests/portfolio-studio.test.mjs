import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const editor = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/PortfolioEditor.tsx'),
  'utf8'
);
const pub = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/portfolio/[id]/page.tsx'),
  'utf8'
);

test('portfolio editor is a studio with live preview', () => {
  assert.match(editor, /pf-studio/);
  assert.match(editor, /pf-preview/);
  assert.match(editor, /EXPERIENCE/);
  assert.match(editor, /Как увидят/);
});

test('public portfolio uses luxe hero', () => {
  assert.match(pub, /portfolio-page--luxe/);
  assert.match(pub, /portfolio-cert__foil/);
});
