/**
 * Locks from the 2026-09-08 security pass. Source assertions only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

test('CSRF allowlist ignores forwarded Host', () => {
  const csrf = read('src/lib/csrf-origin.ts');
  const proxy = read('src/proxy.ts');
  assert.match(csrf, /ty\.idivles\.ru/);
  assert.match(csrf, /csrfAllowedHosts/);
  assert.doesNotMatch(csrf, /x-forwarded-host/);
  assert.match(proxy, /assertSameOrigin/);
  assert.match(proxy, /\/api\/auth/);
});

test('profile cannot set messenger ids from the body', () => {
  const src = read('src/app/api/user/profile/route.ts');
  assert.doesNotMatch(src, /updateData\.telegramChatId/);
  assert.doesNotMatch(src, /updateData\.maxUserId/);
});

test('cron secrets are header-only', () => {
  const auth = read('src/lib/cron-auth.ts');
  const vk = read('src/app/api/vk-sync/route.ts');
  const reminders = read('src/app/api/cron/reminders/route.ts');
  const replica = read('src/app/api/cron/replica-sync/route.ts');
  const vkCron = read('scripts/install-vk-cron.sh');
  assert.match(auth, /x-cron-secret/);
  assert.doesNotMatch(auth, /searchParams/);
  assert.match(vk, /cronAuthorized/);
  assert.match(reminders, /cronAuthorized/);
  assert.match(replica, /cronAuthorized/);
  assert.match(vkCron, /Authorization: Bearer/);
  assert.doesNotMatch(vkCron, /vk-sync\?secret=/);
});

test('referral and invite redirects do not use Host header', () => {
  const r = read('src/app/r/[code]/route.ts');
  const invite = read('src/app/api/invite/[token]/route.ts');
  assert.match(r, /originFromEnv/);
  assert.doesNotMatch(r, /x-forwarded-host/);
  assert.doesNotMatch(invite, /x-forwarded-host/);
});

test('guest space calendar hides pending titles', () => {
  const src = read('src/app/api/spaces/[id]/bookings/route.ts');
  assert.match(src, /hidePendingDetails/);
  assert.match(src, /Интервал занят/);
});

test('auth tickets require NEXTAUTH_SECRET outside development', () => {
  const src = read('src/lib/auth-ticket.ts');
  assert.match(src, /NODE_ENV === 'development'/);
  assert.doesNotMatch(src, /NODE_ENV === 'production'/);
});

test('health monitor token is not CRON_SECRET', () => {
  const src = read('src/lib/health-access.ts');
  assert.match(src, /HEALTH_MONITOR_TOKEN/);
  assert.doesNotMatch(src, /CRON_SECRET/);
});

test('demo seed does not return a password', () => {
  const src = read('src/app/api/admin/demo-seed/route.ts');
  assert.doesNotMatch(src, /demo_password_123/);
  assert.match(src, /randomBytes/);
});
