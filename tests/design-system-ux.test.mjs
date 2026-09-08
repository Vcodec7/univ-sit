import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const g = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const unify = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
const cw = readFileSync(join(root, 'src/components/CoworkingSignupFlow.tsx'), 'utf8');
const date = readFileSync(join(root, 'src/components/SvcDateField.tsx'), 'utf8');
const scan = readFileSync(join(root, 'src/components/TicketScanner.tsx'), 'utf8');
const map = readFileSync(join(root, 'src/components/YandexDirections.tsx'), 'utf8');
const cover = readFileSync(join(root, 'src/components/EntityCoverImage.tsx'), 'utf8');
const pop = readFileSync(join(root, 'src/components/CatalogFilterPopover.tsx'), 'utf8');
const legal = readFileSync(join(root, 'src/components/LegalDocShell.tsx'), 'utf8');
const qr = readFileSync(join(root, 'src/components/PersonalQrPanel.tsx'), 'utf8');
const dash = readFileSync(join(root, 'src/components/DashboardClient.tsx'), 'utf8');
const reg = readFileSync(join(root, 'src/app/register/page.tsx'), 'utf8');
const ver = readFileSync(join(root, 'src/lib/app-version.ts'), 'utf8');

test('design system canvas and lime CTA discipline', () => {
  assert.match(g, /--background: #f9fafb/);
  assert.match(g, /body \{\s*background-color: #f9fafb/);
  assert.match(unify, /html, body \{[\s\S]*background-color: #f9fafb !important/);
  assert.match(g, /\.btn-primary \{[\s\S]*background-color: var\(--accent\)/);
  assert.match(g, /\.cw-today \{ display: block; color: #4b5563/);
});

test('coworking date rail and slot pills', () => {
  assert.match(date, /variant === 'rail'/);
  assert.match(cw, /variant="rail"/);
  assert.match(cw, /Осталось/);
  assert.match(unify, /\.cw-period--hour/);
});

test('scanner traffic light and invalid copy', () => {
  assert.match(scan, /ПРОПУСК НЕДЕЙСТВИТЕЛЕН/);
  assert.match(unify, /\.scanner-result-overlay\.is-bad/);
  assert.match(unify, /background: #dc2626/);
});

test('contacts map wake + catalog skeleton/tags', () => {
  assert.match(map, /Открыть интерактивную карту/);
  assert.match(cover, /yp-cover-skeleton/);
  assert.match(pop, /catalog-sticky-tags/);
});

test('legal centered reading, qr sheet, register CTA, dashboard settings sheet', () => {
  assert.match(legal, /toc\.length >= 4/);
  assert.match(qr, /MobileSheet/);
  assert.match(dash, /settingsSheet/);
  assert.match(reg, /Войти по этому Email/);
  assert.match(ver, /1\.6\.173/);
});
