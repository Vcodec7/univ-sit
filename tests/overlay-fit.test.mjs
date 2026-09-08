import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const unify = readFileSync(join(root, 'src/app/layout-unify.css'), 'utf8');
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const gate = readFileSync(join(root, 'src/components/PrivacyPolicyGate.tsx'), 'utf8');
const diff = readFileSync(join(root, 'src/components/LegalDiffBlock.tsx'), 'utf8');
const sheet = readFileSync(join(root, 'src/components/OnboardingSheet.tsx'), 'utf8');
const cookie = readFileSync(join(root, 'src/components/ConsentBanner.tsx'), 'utf8');
const ver = readFileSync(join(root, 'src/lib/app-version.ts'), 'utf8');

test('overlay last-win max-height stays inside the viewport', () => {
  assert.match(unify, /\.yp-onboard-sheet \{[\s\S]*?max-height:\s*min\(70dvh/);
  assert.match(unify, /\.privacy-gate__card \{[\s\S]*?max-height:\s*100%/);
  assert.match(unify, /\.yp-center-modal__panel \{[\s\S]*?max-height:\s*90dvh/);
  assert.match(unify, /\.yp-vaul-sheet \{[\s\S]*?max-height:\s*85dvh/);
  assert.match(unify, /\.feature-consent__card \{[\s\S]*?max-height:\s*min\(90dvh/);
  assert.match(unify, /\.yp-modal__panel \{[\s\S]*?max-height:\s*90dvh/);
  assert.match(unify, /\.svc-modal__dialog \{[\s\S]*?max-height:\s*90dvh/);
  assert.match(unify, /\.svc-modal__footer \{[\s\S]*?flex-shrink:\s*0/);
  assert.match(unify, /\.admin-modal-dialog \{[\s\S]*?max-height:\s*90dvh/);
  assert.match(unify, /\.rep-modal \{[\s\S]*?max-height:\s*min\(85dvh/);
});

test('privacy-gate scrolls the middle and keeps sticky actions', () => {
  assert.match(gate, /privacy-gate__scroll/);
  assert.match(gate, /privacy-gate__actions/);
  assert.ok(gate.indexOf('privacy-gate__scroll') < gate.indexOf('privacy-gate__actions'));
  assert.match(unify, /\.privacy-gate__scroll \{[\s\S]*?overflow-y:\s*auto/);
  assert.match(unify, /\.privacy-gate__actions \{[\s\S]*?sticky/);
  assert.match(globals, /\.privacy-gate__scroll/);
});

test('legal-diff collapses long diffs and shows add/del by default', () => {
  assert.match(diff, /LONG_DIFF/);
  assert.match(diff, /useState\(!long\)/);
  assert.match(diff, /l\.type !== 'same'/);
  assert.match(diff, /showContext/);
  assert.match(unify, /\.legal-diff__body \{[\s\S]*?max-height:\s*28vh/);
  assert.match(globals, /\.legal-diff__body \{[\s\S]*?max-height:\s*28vh/);
});

test('cookie sheet yields to privacy reconsent and keeps actions visible', () => {
  assert.match(cookie, /privacyBlocking/);
  assert.match(cookie, /needsPrivacyReconsent/);
  assert.match(cookie, /zIndex=\{10040\}/);
  assert.match(sheet, /yp-onboard-sheet__actions/);
  assert.ok(sheet.indexOf('yp-onboard-sheet__text') < sheet.indexOf('yp-onboard-sheet__actions'));
  assert.match(unify, /\.yp-onboard-sheet__actions \{[\s\S]*?flex-shrink:\s*0/);
  assert.match(unify, /z-index:\s*10040/);
  assert.match(ver, /APP_VERSION = '1\.6\.177'/);
});
