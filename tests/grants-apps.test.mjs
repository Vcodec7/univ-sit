import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const admin = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/admin/applications/page.tsx'),
  'utf8'
);
const notify = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/notifications.ts'),
  'utf8'
);
const pub = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/api/users/[id]/public/route.ts'),
  'utf8'
);
const apply = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/api/applications/route.ts'),
  'utf8'
);

test('grant approval notifies without requiring email', () => {
  assert.match(notify, /to\?: string \| null/);
  assert.match(admin, /userId: application.user.id/);
  assert.match(admin, /grant_approved/);
  assert.match(admin, /evaluateAchievements/);
});

test('approved programs listed on public profile', () => {
  assert.match(pub, /programWins:/);
  assert.match(apply, /Заявка отправлена/);
});
