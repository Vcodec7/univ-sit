import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('statement templates are a DOCX catalog category, not inline previews', () => {
  const catalog = readFileSync(join(root, '../src/components/catalog/DocumentsCatalogClient.tsx'), 'utf8');
  const tpl = readFileSync(join(root, '../src/lib/org-statement-templates.ts'), 'utf8');
  const admin = readFileSync(join(root, '../src/app/admin/documents/page.tsx'), 'utf8');
  const docx = readFileSync(join(root, '../src/lib/simple-docx.ts'), 'utf8');
  const api = readFileSync(join(root, '../src/app/api/documents/templates/[id]/route.ts'), 'utf8');
  assert.match(tpl, /STATEMENT_TEMPLATES_CATEGORY = 'Шаблоны'/);
  assert.match(catalog, /STATEMENT_TEMPLATES_CATEGORY/);
  assert.match(catalog, /\/api\/documents\/templates\//);
  assert.match(catalog, /Скачать DOCX/);
  assert.match(catalog, /Скачать PDF/);
  assert.doesNotMatch(catalog, /docs-templates__card/);
  assert.doesNotMatch(catalog, /<pre>/);
  assert.match(admin, /accept="\.pdf,application\/pdf"/);
  assert.match(docx, /0x50, 0x4b, 0x03, 0x04/);
  assert.match(api, /textToDocxBuffer/);
});

test('document verify page is a designed check form', () => {
  const page = readFileSync(join(root, '../src/app/documents/verify/page.tsx'), 'utf8');
  const client = readFileSync(join(root, '../src/components/DocumentVerifyClient.tsx'), 'utf8');
  assert.match(page, /DocumentVerifyClient/);
  assert.match(client, /docs-verify/);
  assert.match(client, /privacy\/verify/);
});
