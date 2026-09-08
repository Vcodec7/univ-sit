import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contacts = readFileSync(join(root, 'src/app/contacts/page.tsx'), 'utf8');
const maps = readFileSync(join(root, 'src/components/YandexDirections.tsx'), 'utf8');
const projects = readFileSync(join(root, 'src/components/catalog/ProjectsCatalogClient.tsx'), 'utf8');
const catalog = readFileSync(join(root, 'src/lib/public-catalogs.ts'), 'utf8');
const cover = readFileSync(join(root, 'src/components/EntityCoverImage.tsx'), 'utf8');

test('contacts page paints without waiting for geocode or map iframe', () => {
  assert.doesNotMatch(contacts, /geocodeAddress/);
  assert.match(maps, /Открыть интерактивную карту/);
  assert.match(maps, /loading="lazy"/);
  assert.doesNotMatch(maps, /IntersectionObserver/);
});

test('home gallery uses next/image and drops dead src', () => {
  const gallery = readFileSync(join(root, 'src/components/PhotoGallery.tsx'), 'utf8');
  assert.match(gallery, /from 'next\/image'/);
  assert.match(gallery, /onError/);
  assert.doesNotMatch(gallery, /<img /);
});

test('login defers captcha and session extras', () => {
  const login = readFileSync(join(root, 'src/app/login/page.tsx'), 'utf8');
  const providers = readFileSync(join(root, 'src/components/Providers.tsx'), 'utf8');
  assert.match(login, /dynamic\(\(\) => import\('@\/components\/CaptchaField'\)/);
  assert.match(providers, /AuthSessionExtras/);
  assert.doesNotMatch(providers, /InstructionsWelcomeModal/);
});

test('projects catalog lazy-loads covers except the first two on page one', () => {
  assert.match(projects, /priority=\{skip === 0 && projectIdx < 2\}/);
  assert.match(catalog, /take: 12/);
  assert.match(catalog, /plain\.slice\(0, 360\)/);
  assert.match(cover, /unoptimized=\{isSvg\}/);
  assert.doesNotMatch(cover, /isUpload/);
});
