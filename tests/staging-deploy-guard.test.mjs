import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('staging prebuilt never prisma db push / accept-data-loss', () => {
  const script = readFileSync(join(root, '../scripts/deploy-staging-prebuilt.sh'), 'utf8');
  const schema = readFileSync(join(root, '../prisma/schema.prisma'), 'utf8');
  const code = script.replace(/#[^\n]*/g, '');
  assert.doesNotMatch(code, /prisma db push/);
  assert.doesNotMatch(code, /accept-data-loss/);
  assert.match(script, /featureConsentsJson/);
  assert.match(script, /"status":"ok"/);
  assert.match(schema, /featureConsentsJson\s+String\?/);
});

test('workflow staging dual path does not compose --build', () => {
  const wf = readFileSync(join(root, '../scripts/workflow-deploy-staging.sh'), 'utf8');
  assert.doesNotMatch(wf, /up -d --build web/);
  assert.doesNotMatch(wf, /accept-data-loss/);
});
