import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(join(root, 'src/lib/vacancy-content.ts'), 'utf8');
const apply = readFileSync(join(root, 'src/app/api/vacancies/apply/route.ts'), 'utf8');
const detail = readFileSync(join(root, 'src/components/VacancyDetailClient.tsx'), 'utf8');
const pub = readFileSync(join(root, 'src/app/api/users/[id]/public/route.ts'), 'utf8');
const admin = readFileSync(join(root, 'src/app/api/admin/vacancies/route.ts'), 'utf8');

function parseVacancyRequirements(raw) {
  if (!raw?.trim()) return { items: [], salaryText: null, paid: null };
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return { items: parsed.map(String), salaryText: null, paid: null };
  return {
    items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
    salaryText: parsed.salaryText || null,
    paid: typeof parsed.paid === 'boolean' ? parsed.paid : null,
  };
}

function vacancyIsApplyOpen(opts) {
  if (opts.status !== 'OPEN') return false;
  if (opts.closesAt && new Date(opts.closesAt).getTime() < Date.now()) return false;
  if (opts.seats != null && (opts.seatsTaken || 0) >= opts.seats) return false;
  return true;
}

test('legacy requirements array still parses', () => {
  const c = parseVacancyRequirements(JSON.stringify(['Возраст 14+', 'Инструктаж']));
  assert.equal(c.items[0], 'Возраст 14+');
  assert.equal(c.salaryText, null);
});

test('structured vacancy JSON keeps salary and paid', () => {
  const c = parseVacancyRequirements(
    JSON.stringify({ items: ['Инструктаж'], salaryText: '25 000 ₽', paid: true, employmentType: 'internship' })
  );
  assert.equal(c.salaryText, '25 000 ₽');
  assert.equal(c.paid, true);
});

test('expired or full vacancy is not apply-open', () => {
  assert.equal(
    vacancyIsApplyOpen({ status: 'OPEN', closesAt: '2020-01-01T00:00:00.000Z', seats: 3, seatsTaken: 0 }),
    false
  );
  assert.equal(vacancyIsApplyOpen({ status: 'OPEN', seats: 3, seatsTaken: 3 }), false);
  assert.equal(vacancyIsApplyOpen({ status: 'OPEN', seats: 3, seatsTaken: 1 }), true);
});

test('logged-in apply does not require captcha token', () => {
  assert.match(apply, /captchaToken: z.string\(\)\.optional\(\)/);
  assert.match(apply, /Отклик отправлен/);
  assert.doesNotMatch(detail, /CaptchaField/);
  assert.match(content, /export function vacancyIsApplyOpen/);
  assert.match(pub, /vacancyWins:/);
  assert.match(admin, /Отклик не принят/);
});
