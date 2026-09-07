import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const picker = readFileSync(join(root, '../src/components/admin/GalleryPickerField.tsx'), 'utf8');
const places = readFileSync(join(root, '../src/app/admin/places/page.tsx'), 'utf8');
const cover = readFileSync(join(root, '../src/components/admin/CoverImageField.tsx'), 'utf8');

test('gallery picker uploads device photos instead of requiring URLs', () => {
  assert.match(picker, /type="file"/);
  assert.match(picker, /multiple/);
  assert.match(picker, /accept="image\/\*"/);
  assert.match(picker, /\/api\/upload/);
  assert.match(picker, /gallery-picker-field__drop/);
  assert.doesNotMatch(picker, /capture=/);
});

test('places admin uses gallery picker not a URL textarea', () => {
  assert.match(places, /GalleryPickerField/);
  assert.doesNotMatch(places, /Галерея \(URL через запятую\)/);
});

test('cover field accepts any image from the device library', () => {
  assert.match(cover, /accept="image\/\*"/);
});
