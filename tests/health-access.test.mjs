import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('public https health omits version; catalogs stay public', () => {
  const health = readFileSync(join(root, 'src/app/api/health/route.ts'), 'utf8');
  const access = readFileSync(join(root, 'src/lib/health-access.ts'), 'utf8');
  const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
  const next = readFileSync(join(root, 'next.config.ts'), 'utf8');
  assert.match(access, /x-forwarded-proto/);
  assert.match(access, /HEALTH_MONITOR_TOKEN/);
  assert.match(health, /isDetailedHealthRequest/);
  assert.match(health, /status: 'ok'/);
  assert.doesNotMatch(health, /isPublicHealthRequest/);
  assert.match(next, /poweredByHeader: false/);
  assert.match(proxy, /edgeRateAllow/);
  assert.match(proxy, /\/api\/admin/);
  assert.match(proxy, /Нужна авторизация/);
  assert.match(proxy, /\/api\/events/);
});
