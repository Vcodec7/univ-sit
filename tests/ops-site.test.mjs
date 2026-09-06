import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('public URL and MAX webhook belong to the tech console, not youth admin form', () => {
  const health = readFileSync(join(root, 'src/lib/admin-settings-health.ts'), 'utf8');
  const settings = readFileSync(join(root, 'src/app/admin/settings/page.tsx'), 'utf8');
  const bots = readFileSync(join(root, 'src/components/admin/AdminBotsClient.tsx'), 'utf8');
  const ops = readFileSync(join(root, 'src/components/OpsConsoleClient.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/app/api/ops/site/route.ts'), 'utf8');

  assert.match(health, /identityFromSettings/);
  assert.match(health, /isLocalOrigin/);
  assert.doesNotMatch(settings, /name="publicSiteUrl"/);
  assert.match(settings, /техническая служба/);
  assert.match(bots, /техническая служба/);
  assert.doesNotMatch(bots, /ensureMaxWebhook/);
  assert.match(ops, /OpsSitePanel/);
  assert.match(api, /action === 'ensureMaxWebhook'/);
  assert.match(api, /isTechRole/);
});
