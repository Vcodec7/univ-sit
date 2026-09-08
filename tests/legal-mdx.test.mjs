import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('legal pages compile MDX with LegalClause', () => {
  for (const slug of ['privacy', 'rules', 'terms']) {
    const mdx = readFileSync(join(root, `content/legal/${slug}.mdx`), 'utf8');
    assert.match(mdx, /LegalClause/);
    assert.match(mdx, /simpleText=/);
    assert.match(mdx, /legalText=/);
    assert.ok(readFileSync(join(root, `content/legal/${slug}.v1.mdx`), 'utf8').length > 20);
  }
  const clause = readFileSync(join(root, 'src/components/LegalClause.tsx'), 'utf8');
  assert.match(clause, /simpleText/);
  const shell = readFileSync(join(root, 'src/components/LegalMdxShell.tsx'), 'utf8');
  assert.match(shell, /fuse\.js/i);
  assert.match(shell, /Человеческий язык/);
  const privacy = readFileSync(join(root, 'src/app/privacy/page.tsx'), 'utf8');
  assert.match(privacy, /LegalMdxBody/);
  const docker = readFileSync(join(root, 'Dockerfile.prebuilt'), 'utf8');
  assert.match(docker, /COPY content/);
});
