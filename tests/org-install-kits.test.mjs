import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('org installer collects identity and writes install report, not tech in seed file', () => {
  const stack = readFileSync(join(root, 'scripts/install-dev-stack.sh'), 'utf8');
  const seed = readFileSync(join(root, 'scripts/seed-install-roles.mjs'), 'utf8');
  const start = readFileSync(join(root, 'scripts/start-kit.sh'), 'utf8');
  const search = readFileSync(join(root, 'src/app/api/admin/users/search/route.ts'), 'utf8');

  assert.match(stack, /--org-city/);
  assert.match(stack, /OPERATOR_INN/);
  assert.match(stack, /INSTALL-REPORT\.txt/);
  assert.match(stack, /tech-credentials\.txt/);
  assert.match(stack, /verify-org-branding/);
  assert.match(stack, /ops-\$\(openssl rand/);
  assert.match(start, /Оператор ПДн/);
  assert.match(seed, /Техническая служба в этот список не входит/);
  assert.doesNotMatch(seed, /TECH_EMAIL \+ TECH_BOOTSTRAP/);
  assert.match(search, /excludeTechWhere/);
});
