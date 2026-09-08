import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('login and register fields are labelled for a11y', () => {
  const login = readFileSync(join(root, 'src/app/login/page.tsx'), 'utf8');
  const register = readFileSync(join(root, 'src/app/register/page.tsx'), 'utf8');
  assert.match(login, /htmlFor="login-email"/);
  assert.match(login, /id="login-email"/);
  assert.match(login, /htmlFor="login-password"/);
  assert.match(login, /id="login-password"/);
  assert.match(login, /aria-label="Электронная почта"/);
  assert.match(login, /aria-label="Пароль"/);
  assert.match(register, /htmlFor="register-email"/);
  assert.match(register, /id="register-email"/);
  assert.match(register, /htmlFor="register-password"/);
});

test('opengraph and pwa aliases exist', () => {
  const cfg = readFileSync(join(root, 'next.config.ts'), 'utf8');
  const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
  const og = readFileSync(join(root, 'src/app/opengraph-image.tsx'), 'utf8');
  const manifest = readFileSync(join(root, 'src/app/manifest.ts'), 'utf8');
  assert.match(cfg, /source: '\/manifest.json'/);
  assert.match(cfg, /destination: '\/manifest.webmanifest'/);
  assert.match(cfg, /source: '\/opengraph-image.png'/);
  assert.match(cfg, /destination: '\/opengraph-image'/);
  assert.match(layout, /\/opengraph-image\.png/);
  assert.match(layout, /summary_large_image/);
  assert.match(og, /width: 1200/);
  assert.match(og, /height: 630/);
  assert.match(manifest, /theme_color: '#8562d8'/);
});

test('brand and hero images have descriptive alt text', () => {
  const brand = readFileSync(join(root, 'src/components/SiteBrand.tsx'), 'utf8');
  const hero = readFileSync(join(root, 'src/components/HomeHeroMedia.tsx'), 'utf8');
  assert.match(brand, /alt=\{name\}/);
  assert.match(hero, /alt="Сочи: море и набережная"/);
});
