import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('ISR legal and catalog pages do not call headers() via getSiteIdentity', () => {
  const files = [
    'src/app/privacy/page.tsx',
    'src/app/rules/page.tsx',
    'src/app/terms/page.tsx',
    'src/app/events/page.tsx',
    'src/app/faq/page.tsx',
    'src/app/p/[slug]/page.tsx',
    'src/app/documents/[id]/page.tsx',
    'src/app/presentation/page.tsx',
    'src/lib/legal-live.ts',
    'src/components/programs/ProgramDetailPage.tsx',
  ];
  for (const rel of files) {
    const src = readFileSync(join(root, rel), 'utf8');
    assert.match(src, /getSiteIdentityStatic/, rel);
    assert.doesNotMatch(src, /getSiteIdentity\(/, rel);
  }
});

test('early PerformanceObserver guard skips entries without startTime', () => {
  const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
  assert.match(layout, /yp-po-guard/);
  assert.match(layout, /typeof e\.startTime==='number'/);
});
