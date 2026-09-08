/**
 * Regression locks from the 2026-09-08 full-code audit.
 * Run via: npm test  OR  bash scripts/code-health-check.sh
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

test('code-health script is checked in', () => {
  assert.equal(existsSync(join(root, 'scripts/code-health-check.sh')), true);
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.health, 'bash scripts/code-health-check.sh');
  assert.equal(pkg.scripts['security:ty'], 'node scripts/security-live-check.mjs');
  assert.equal(existsSync(join(root, 'scripts/security-live-check.mjs')), true);
});

test('SW never caches HTML navigations (incl. /games)', () => {
  const sw = read('public/sw.js');
  assert.match(sw, /HTML is always network-first with no cache write/);
  assert.doesNotMatch(sw, /path\.startsWith\("\/games"\)/);
  const nav = sw.split('if (req.mode === "navigate")')[1] || '';
  assert.doesNotMatch(nav.slice(0, 400), /caches\.open/);
});

test('EtaCountdown hydrates without Date.now() in first render', () => {
  const src = read('src/components/EtaCountdown.tsx');
  assert.match(src, /useState<number \| null>\(null\)/);
  assert.doesNotMatch(src, /useState\(\(\) => Date\.now\(\)\)/);
});

test('PresenceScanner camera effect does not restart on busy', () => {
  const src = read('src/components/PresenceScanner.tsx');
  assert.match(src, /submitRef/);
  assert.match(src, /},\s*\[\]\);/);
  assert.doesNotMatch(src, /},\s*\[submit\]\);/);
});

test('booking and coworking create under Serializable isolation', () => {
  const bookings = read('src/app/api/bookings/route.ts');
  const coworking = read('src/app/api/coworking/route.ts');
  assert.match(bookings, /TransactionIsolationLevel\.Serializable/);
  assert.match(coworking, /TransactionIsolationLevel\.Serializable/);
});

test('eco points apply atomically with FOR UPDATE', () => {
  const eco = read('src/lib/eco-points.ts');
  assert.match(eco, /async function applyEcoDelta/);
  assert.match(eco, /FOR UPDATE/);
  assert.match(eco, /bumpEcoPoints[\s\S]*applyEcoDelta/);
});

test('admin CSV export and DM inbox are bounded', () => {
  const exp = read('src/app/api/admin/export/route.ts');
  const msg = read('src/app/api/messages/route.ts');
  assert.match(exp, /EXPORT_LIMIT/);
  assert.match(exp, /take: EXPORT_LIMIT/);
  assert.match(msg, /kind: 'DM'[\s\S]*take: 200/);
});

test('User and Booking have indexes used by admin badges / online list', () => {
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /@@index\(\[deletedAt\]\)/);
  assert.match(schema, /@@index\(\[lastActiveAt\]\)/);
  assert.match(schema, /@@index\(\[role, blockedAt\]\)/);
  assert.match(schema, /@@index\(\[status, endTime\]\)/);
});
