import test from 'node:test';
import assert from 'node:assert/strict';

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

test('BOTH and category-коворк with default HALL still allow both uses', () => {
  assert.equal(isCoworkingSpace({ bookingMode: 'BOTH', title: 'Зал' }), true);
  assert.equal(isHallBookable({ bookingMode: 'BOTH', title: 'Зал' }), true);
  assert.equal(isCoworkingSpace({ category: 'Коворкинг', title: 'Центр' }), true);
  assert.equal(isHallBookable({ category: 'Коворкинг', title: 'Центр' }), true);
});
