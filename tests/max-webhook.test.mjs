import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('MAX webhook failure is explained in the activity log', () => {
  const max = readFileSync(join(root, 'src/lib/max.ts'), 'utf8');
  const bots = readFileSync(join(root, 'src/app/api/admin/bots/route.ts'), 'utf8');
  assert.match(max, /export function maxWebhookFailRu/);
  assert.match(bots, /maxWebhookFailRu/);
  assert.match(bots, /Ошибка вебхука MAX: \$\{failRu\}/);
});
