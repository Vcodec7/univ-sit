import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('feature consents keep live User.featureConsentsJson', () => {
  const lib = readFileSync(join(root, '../src/lib/feature-consents.ts'), 'utf8');
  const consent = readFileSync(join(root, '../src/app/api/user/consent/route.ts'), 'utf8');
  const schema = readFileSync(join(root, '../prisma/schema.prisma'), 'utf8');
  assert.match(schema, /featureConsentsJson\s+String\?/);
  assert.match(lib, /mergeFeatureConsentSources/);
  assert.match(lib, /userHasFeatureConsent/);
  assert.match(lib, /nested\[key\] \?\? parsed\[key\]/);
  assert.match(consent, /featureConsentsJson: JSON\.stringify\(merged\)/);
});
