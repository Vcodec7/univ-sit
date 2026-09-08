import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('footer participate has no friends link; documents hub is listed', () => {
  const footer = readFileSync(join(root, '../src/components/Footer.tsx'), 'utf8');
  assert.doesNotMatch(footer, /dashboard\/friends/);
  assert.match(footer, /href="\/documents"/);
  assert.doesNotMatch(footer, /href="\/rules"/);
  assert.doesNotMatch(footer, /href="\/terms"/);
});

test('contests and vacancies lists are public', () => {
  const contests = readFileSync(join(root, '../src/app/api/contests/route.ts'), 'utf8');
  const vacancies = readFileSync(join(root, '../src/app/api/vacancies/route.ts'), 'utf8');
  assert.doesNotMatch(contests, /status: 401/);
  assert.doesNotMatch(vacancies, /status: 401/);
});

test('afisha lists clubs; cancel notifies guests', () => {
  const events = readFileSync(join(root, '../src/app/events/page.tsx'), 'utf8');
  const notes = readFileSync(join(root, '../src/lib/notifications.ts'), 'utf8');
  assert.match(events, /getCachedPublicClubs/);
  assert.match(notes, /notifyBookingCancelledToGuests/);
});
