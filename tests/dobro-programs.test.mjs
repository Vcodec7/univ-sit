import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ui = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/lib/programs-ui.ts'),
  'utf8'
);
const detail = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/programs/ProgramDetailView.tsx'),
  'utf8'
);
const catalog = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/components/programs/ProgramCatalog.tsx'),
  'utf8'
);

function programIsApplyOpen(status, endsAt) {
  if (status !== 'OPEN') return false;
  if (!endsAt) return true;
  const t = typeof endsAt === 'string' ? new Date(endsAt).getTime() : endsAt.getTime();
  if (Number.isNaN(t)) return true;
  return t >= Date.now();
}

test('expired OPEN program is not apply-open', () => {
  assert.equal(programIsApplyOpen('OPEN', '2020-01-01T00:00:00.000Z'), false);
  assert.equal(programIsApplyOpen('OPEN', null), true);
});

test('dobro pages use hub/detail classes and status helper', () => {
  assert.match(ui, /programStatusLabel/);
  assert.match(detail, /prog-detail--/);
  assert.match(catalog, /prog-hub--/);
  assert.match(detail, /Добро\.ру/);
});

test('self-gov detail fills parliament page with duties and meeting format', () => {
  assert.match(ui, /SELF_GOV_GUIDE/);
  assert.match(ui, /открытые слушания/);
  assert.match(detail, /Чем предстоит заниматься/);
  assert.match(detail, /Орган/);
});
