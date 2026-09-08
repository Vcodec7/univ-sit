import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('scan aliases to canonical scanner', () => {
  const scan = readFileSync(join(root, 'src/app/scan/page.tsx'), 'utf8');
  const cfg = readFileSync(join(root, 'next.config.ts'), 'utf8');
  const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
  assert.match(scan, /permanentRedirect\('\/scanner\?tab=pass'\)/);
  assert.match(cfg, /source: '\/scan'/);
  assert.match(proxy, /pathname === '\/scan'/);
  assert.match(cfg, /source: '\/documents\/:name.pdf'/);
  assert.match(proxy, /api\/documents\/by-name/);
});

test('documents page is a legal hub', () => {
  const docs = readFileSync(join(root, 'src/components/catalog/DocumentsCatalogClient.tsx'), 'utf8');
  assert.match(docs, /docs-legal-hub/);
  assert.match(docs, /href="\/privacy"/);
  assert.match(docs, /href="\/rules"/);
  assert.match(docs, /href="\/terms"/);
  assert.match(docs, /documents\/verify/);
});

test('catalogs share CatalogEntityCard and events share HomeLiftFeedCard', () => {
  const projects = readFileSync(join(root, 'src/components/catalog/ProjectsCatalogClient.tsx'), 'utf8');
  const clubs = readFileSync(join(root, 'src/components/catalog/ClubsCatalogClient.tsx'), 'utf8');
  const events = readFileSync(join(root, 'src/components/UpcomingEvents.tsx'), 'utf8');
  const card = readFileSync(join(root, 'src/components/catalog/CatalogEntityCard.tsx'), 'utf8');
  assert.match(projects, /CatalogEntityCard/);
  assert.match(clubs, /CatalogEntityCard/);
  assert.match(events, /HomeLiftFeedCard/);
  assert.match(card, /prefetch=\{false\}/);
});
