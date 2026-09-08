import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function src(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const SUPER_ROUTES = [
  'src/app/api/admin/backup/route.ts',
  'src/app/api/admin/backup/[id]/download/route.ts',
  'src/app/api/admin/system/route.ts',
  'src/app/api/admin/bots/route.ts',
  'src/app/api/admin/lea-export/route.ts',
  'src/app/api/admin/lea-export/[id]/download/route.ts',
  'src/app/api/admin/eco/route.ts',
  'src/app/api/admin/online-users/route.ts',
  'src/app/api/admin/online-users/pdf/route.ts',
];

test('super-admin APIs require requireSuperAdmin, not mere ADMIN', () => {
  for (const file of SUPER_ROUTES) {
    const text = src(file);
    assert.match(text, /requireSuperAdmin/, file);
    assert.doesNotMatch(text, /requireAdmin\(\)/, file);
    assert.doesNotMatch(text, /role !== 'ADMIN'/, file);
  }
});

test('occupancy writes need bookings permission; scanner stays on GET', () => {
  const text = src('src/app/api/admin/occupancy/route.ts');
  assert.match(text, /canUseScanner/);
  assert.match(text, /requirePermission\('bookings'\)/);
  assert.doesNotMatch(text, /role === 'SCANNER'/);
});

test('TECH is not on admin password reset; ADMIN reset needs super-admin', () => {
  const text = src('src/app/api/admin/users/[id]/reset-password/route.ts');
  assert.match(text, /requireAdmin/);
  assert.match(text, /isSuperAdmin/);
  assert.match(text, /target\.role === 'TECH'/);
  assert.doesNotMatch(text, /role !== 'ADMIN' && role !== 'TECH'/);
});

test('hall booking rejects coworking-only, closures, and uses space hours', () => {
  const text = src('src/app/api/bookings/route.ts');
  assert.match(text, /isHallBookable/);
  assert.match(text, /spaceClosure/);
  assert.match(text, /space\.openTime/);
  assert.match(text, /space\.closeTime/);
});

test('scores API requires moderation permission', () => {
  const text = src('src/app/api/admin/scores/route.ts');
  assert.match(text, /requirePermission\('moderation'\)/);
  assert.doesNotMatch(text, /role === 'MODERATOR'/);
});

test('end-user mutation APIs call requireEndUser', () => {
  assert.match(src('src/app/api/messages/route.ts'), /requireEndUser\(\)/);
  assert.match(src('src/app/api/friends/route.ts'), /requireEndUser\(\)/);
  assert.match(src('src/app/api/user/bookings/invite/route.ts'), /requireEndUser\(\)/);
});

test('booking PATCH censors like create', () => {
  assert.match(src('src/app/api/user/bookings/[id]/route.ts'), /profanityResponse/);
});

test('coworking BOTH overlap and transactional capacity', () => {
  const text = src('src/app/api/coworking/route.ts');
  assert.match(text, /\$transaction/);
  assert.match(text, /spaceBookingMode\(space\) === 'BOTH'/);
  assert.match(text, /tx\.booking\.findFirst/);
});
