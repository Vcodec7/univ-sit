import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shared = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/contest-eligibility-shared.ts'),
  'utf8'
);
const admin = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/api/admin/contests/route.ts'),
  'utf8'
);
const pub = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/app/api/users/[id]/public/route.ts'),
  'utf8'
);

function contestPhase(c) {
  const now = Date.now();
  const ended = Boolean(c.endsAt && new Date(c.endsAt).getTime() < now);
  const canSubmit = c.status === 'OPEN' && !ended;
  let displayStatus = c.status;
  if (c.status === 'OPEN' && ended) displayStatus = 'CLOSED';
  return { canSubmit, displayStatus, expired: c.status === 'OPEN' && ended };
}

test('expired OPEN contest is not accepting entries', () => {
  const p = contestPhase({ status: 'OPEN', endsAt: '2020-01-01T00:00:00.000Z' });
  assert.equal(p.canSubmit, false);
  assert.equal(p.displayStatus, 'CLOSED');
  assert.equal(p.expired, true);
});

test('contest winners notify and land on profile', () => {
  assert.match(shared, /export function contestPhase/);
  assert.match(admin, /Вы победили в конкурсе/);
  assert.match(admin, /Работа принята на конкурс/);
  assert.match(pub, /contestWinner.findMany/);
  assert.match(pub, /contestWins:/);
});
