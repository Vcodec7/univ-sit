import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('admin settings expose SMS gateway tab', () => {
  const page = readFileSync(join(root, 'src/app/admin/settings/page.tsx'), 'utf8');
  const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
  const dispatch = readFileSync(join(root, 'src/lib/sms-dispatch.ts'), 'utf8');
  assert.match(page, /id: 'sms'/);
  assert.match(page, /name="smsProvider"/);
  assert.match(page, /name="smsApiKey"/);
  assert.match(page, /action=\{testSms\}/);
  assert.match(schema, /smsApiUrl/);
  assert.match(schema, /smsProvider/);
  assert.match(dispatch, /sms\.ru\/sms\/send/);
  assert.match(dispatch, /smsc\.ru\/sys\/send\.php/);
  assert.match(dispatch, /URL шлюза должен начинаться с https/);
});
