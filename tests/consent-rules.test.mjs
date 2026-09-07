import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('missing rules are backfilled from privacy, not left empty', () => {
  const consentLib = readFileSync(join(root, 'src/lib/consent.ts'), 'utf8');
  assert.match(consentLib, /export function rulesFieldsIfMissing/);
  assert.match(consentLib, /if \(opts\.rulesAcceptedAt\) return null/);
  assert.match(consentLib, /kind: 'rules'/);

  const consentApi = readFileSync(join(root, 'src/app/api/user/consent/route.ts'), 'utf8');
  assert.match(consentApi, /data\.rulesAcceptedAt = now/);
  assert.match(consentApi, /RULES_POLICY_VERSION/);

  const profile = readFileSync(join(root, 'src/app/api/user/profile/route.ts'), 'utf8');
  assert.match(profile, /rulesFieldsIfMissing/);

  const gate = readFileSync(join(root, 'src/components/PrivacyPolicyGate.tsx'), 'utf8');
  assert.match(gate, /href="\/rules"/);
});
