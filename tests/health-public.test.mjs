import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const health = readFileSync(join(root, 'src/app/api/health/route.ts'), 'utf8');
const payload = readFileSync(join(root, 'src/lib/health-payload.ts'), 'utf8');
const access = readFileSync(join(root, 'src/lib/health-access.ts'), 'utf8');
const prebuilt = readFileSync(join(root, 'scripts/deploy-staging-prebuilt.sh'), 'utf8');
const workflow = readFileSync(join(root, 'scripts/workflow-deploy-staging.sh'), 'utf8');

test('public health omits version/db unless loopback', () => {
  assert.match(access, /127\.0\.0\.1/);
  assert.match(health, /isLoopbackHealthRequest/);
  assert.match(payload, /maintenanceMode/);
  assert.match(payload, /X-YP-Version/);
});

test('staging verify uses loopback for version, public health for ok only', () => {
  assert.match(prebuilt, /127\.0\.0\.1:3001\/api\/health/);
  assert.match(prebuilt, /public health must be \{ok\} without version|no version/);
  assert.match(workflow, /loopback version/);
  assert.doesNotMatch(
    prebuilt.split('verify https')[1] || '',
    /grep -q "\\"version\\":\\"\$\{EXPECTED_VER\}\\""\n.*STAGING_DOMAIN/
  );
});
