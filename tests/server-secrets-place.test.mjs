import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('place/stash server secrets never print values and map live paths', () => {
  const place = readFileSync(join(root, 'scripts/place-server-secrets.sh'), 'utf8');
  const stash = readFileSync(join(root, 'scripts/stash-server-secrets.sh'), 'utf8');
  assert.match(place, /PROD_APP="\$\{PROD_APP:-\/opt\/sochi-portal\}"/);
  assert.match(place, /STAGING_APP="\$\{STAGING_APP:-\/opt\/sochi-portal-staging\}"/);
  assert.match(place, /"\$PROD_APP\/\.env"/);
  assert.match(place, /"\$STAGING_APP\/\.env"/);
  assert.match(place, /\/var\/backups\/sochi-portal\/secrets/);
  assert.match(stash, /prod\.env/);
  assert.match(stash, /staging\.env/);
  assert.match(stash, /install -d -m 700/);
  assert.doesNotMatch(place, /cat "\$src"/);
  assert.doesNotMatch(stash, /cat "\$src"/);
});
