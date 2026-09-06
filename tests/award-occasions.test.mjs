import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/award-occasions.ts'),
  'utf8'
);
const admin = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/admin/awards/AdminAwardsClient.tsx'),
  'utf8'
);
const issue = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/issue-official-document.ts'),
  'utf8'
);

test('youth award occasions cover contest volunteer club eco', () => {
  for (const id of [
    'contest_winner',
    'event_volunteer',
    'club_active',
    'eco_action',
    'dobro',
    'mentor',
    'practice',
  ]) {
    assert.match(src, new RegExp(`id: '${id}'`));
  }
});

test('admin awards UI uses occasions and templates', () => {
  assert.match(admin, /AWARD_OCCASIONS/);
  assert.match(admin, /OFFICIAL_DOC_TEMPLATES/);
  assert.match(admin, /yp-award-occasions/);
});

test('issued document stores occasion in metaJson', () => {
  assert.match(issue, /occasion: input.occasion/);
  assert.match(issue, /metaJson/);
});
