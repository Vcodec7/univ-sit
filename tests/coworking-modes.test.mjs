import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// coworking.ts is TypeScript — exercise via compiled-less copy of the predicates.
function spaceBookingMode(space) {
  const mode = String(space.bookingMode || '').toUpperCase();
  if (mode === 'COWORKING' || mode === 'BOTH' || mode === 'HALL') return mode;
  return 'HALL';
}
function isCoworkingSpace(space) {
  const mode = spaceBookingMode(space);
  if (mode === 'COWORKING' || mode === 'BOTH') return true;
  const cat = String(space.category || '').toLowerCase();
  const title = String(space.title || '').toLowerCase();
  return cat.includes('коворк') || title.includes('коворк');
}
function isHallBookable(space) {
  return spaceBookingMode(space) !== 'COWORKING';
}

test('hall-only space is bookable, not coworking', () => {
  const s = { bookingMode: 'HALL', category: 'Спорт', title: 'Партизанская' };
  assert.equal(isCoworkingSpace(s), false);
  assert.equal(isHallBookable(s), true);
});

test('coworking-only space has no hall book', () => {
  const s = { bookingMode: 'COWORKING', category: 'Коворкинг', title: 'Тимирязева' };
  assert.equal(isCoworkingSpace(s), true);
  assert.equal(isHallBookable(s), false);
});

test('group occupancy counts approved seats and leftover spots', () => {
  const members = [{ status: 'APPROVED' }, { status: 'APPROVED' }, { status: 'PENDING' }];
  const approved = members.filter((m) => m.status === 'APPROVED').length;
  assert.equal(approved, 2);
  assert.equal(Math.max(0, 5 - approved), 3);
});

test('solo kind hides extra seats; group kind reserves a block', () => {
  function coworkingKind(raw) {
    return String(raw || '').toUpperCase() === 'GROUP' ? 'GROUP' : 'SOLO';
  }
  assert.equal(coworkingKind('GROUP'), 'GROUP');
  assert.equal(coworkingKind('solo'), 'SOLO');
  const seatsToBook = (kind, seats) => (kind === 'SOLO' ? 1 : seats);
  assert.equal(seatsToBook('SOLO', 6), 1);
  assert.equal(seatsToBook('GROUP', 4), 4);
});

test('cabinet bookings keep group and cancel in a separate actions row', () => {
  const src = readFileSync(join(root, 'src/components/CoworkingCabinetList.tsx'), 'utf8');
  assert.match(src, /cw-cabinet-pill__actions/);
  assert.match(src, /cw-cabinet-pill__group/);
  assert.match(src, /История/);
  assert.match(src, /Отменить участие/);
  assert.doesNotMatch(src, /className="cw-cabinet-pill__cancel">\s*Группа/);
});

test('coworking mine list keeps cancelled and past visits', () => {
  const src = readFileSync(join(root, 'src/app/api/coworking/route.ts'), 'utf8');
  assert.match(src, /orderBy: \{ startTime: 'desc' \}/);
  assert.doesNotMatch(src, /endTime: \{ gte: new Date\(Date.now\(\) - 2 \* 86400000\) \}/);
});
