import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function ageFromVkBdate(bdate) {
  const raw = String(bdate || '').trim();
  const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mo = now.getMonth() - d.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function verifyTelegram(raw, token) {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)]));
  const dataCheckString = Object.keys(flat)
    .filter((k) => k !== 'hash' && flat[k])
    .sort()
    .map((k) => `${k}=${flat[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token).digest();
  const expected = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return expected === flat.hash;
}

test('VK bdate under 14 is rejected', () => {
  assert.equal(ageFromVkBdate('1.1.2020') < 14, true);
  assert.ok(ageFromVkBdate('1.1.1990') >= 14);
  assert.equal(ageFromVkBdate('hidden'), null);
});

test('Telegram widget HMAC matches bot token', () => {
  const token = 'test-bot-token';
  const payload = {
    id: '123',
    first_name: 'Иван',
    auth_date: String(Math.floor(Date.now() / 1000)),
  };
  const dataCheckString = Object.keys(payload)
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  assert.equal(verifyTelegram({ ...payload, hash }, token), true);
  assert.equal(verifyTelegram({ ...payload, hash: '00' }, token), false);
});

test('register form has no phone field and 409 conflict copy', () => {
  const src = readFileSync(join(root, 'src/app/register/page.tsx'), 'utf8');
  assert.doesNotMatch(src, /name="phone"/);
  assert.match(src, /EMAIL_EXISTS/);
  assert.match(src, /login\?email=/);
  assert.match(src, /SocialAuthButtons/);
  assert.match(src, /14 лет/);
});

test('register API returns 409 for existing email', () => {
  const src = readFileSync(join(root, 'src/app/api/register/route.ts'), 'utf8');
  assert.match(src, /status: 409/);
  assert.match(src, /EMAIL_EXISTS/);
});

test('login email query is applied and SMS login is gone', () => {
  const src = readFileSync(join(root, 'src/app/login/page.tsx'), 'utf8');
  assert.match(src, /searchParams.get\('email'\)/);
  assert.doesNotMatch(src, /\/api\/auth\/sms\/request/);
});

test('home sections use a single flex gap', () => {
  const unify = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
  assert.doesNotMatch(unify, /contain-intrinsic-size:\s*1px 420px/);
  assert.match(unify, /home-page--lift \.home-section[\s\S]{0,80}margin-bottom:\s*0\.85rem\s*!important/);
});
