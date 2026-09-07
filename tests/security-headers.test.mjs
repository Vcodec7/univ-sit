import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('frame headers are nginx-only DENY, not Next DENY plus nginx SAMEORIGIN', () => {
  const next = readFileSync(join(root, '../next.config.ts'), 'utf8');
  const dual = readFileSync(join(root, '../deploy/nginx-dual-site.conf.tpl'), 'utf8');
  assert.doesNotMatch(next, /X-Frame-Options/);
  assert.match(dual, /X-Frame-Options "DENY"/);
  assert.doesNotMatch(dual, /X-Frame-Options "SAMEORIGIN"/);
  assert.match(next, /source: '\/service-worker\.js'/);
});

test('service worker precache has no redirecting directory URLs', () => {
  const sw = readFileSync(join(root, '../public/sw.js'), 'utf8');
  assert.doesNotMatch(sw, /"\/offline-games\/"/);
  assert.match(sw, /cache\.add\(u\)\.catch/);
  assert.match(sw, /\/offline-games\/index\.html/);
});
