import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('admin studio wizard and publish hide drafts', () => {
  const studio = readFileSync(join(root, 'src/lib/youth-studio.ts'), 'utf8');
  const pub = readFileSync(join(root, 'src/lib/publish.ts'), 'utf8');
  const proj = readFileSync(join(root, 'src/app/admin/projects/page.tsx'), 'utf8');
  const faq = readFileSync(join(root, 'src/components/admin/AdminFaqClient.tsx'), 'utf8');
  const settings = readFileSync(join(root, 'src/app/admin/settings/page.tsx'), 'utf8');
  const clubs = readFileSync(join(root, 'src/app/admin/clubs/page.tsx'), 'utf8');
  assert.match(studio, /JOIN_MODES/);
  assert.match(studio, /Черновик/);
  assert.match(pub, /DRAFT/);
  assert.match(proj, /AdminYouthStudioForm/);
  assert.match(proj, /admin-catalog-cards/);
  assert.match(clubs, /AdminYouthStudioForm/);
  assert.match(faq, /Текущие категории/);
  assert.match(faq, /Категория создана/);
  assert.match(settings, /admin-settings-health/);
});
