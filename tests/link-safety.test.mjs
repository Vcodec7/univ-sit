import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('chat links are gated and classified', () => {
  const safety = readFileSync(join(root, 'src/lib/link-safety.ts'), 'utf8');
  const body = readFileSync(join(root, 'src/components/MessageBodyText.tsx'), 'utf8');
  const gate = readFileSync(join(root, 'src/components/MessageSafeLink.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/app/api/messages/link-check/route.ts'), 'utf8');
  const rkn = readFileSync(join(root, 'src/lib/rkn-link-guard.ts'), 'utf8');
  const media = readFileSync(join(root, 'src/lib/message-body-media.ts'), 'utf8');
  assert.match(safety, /javascript\|data\|vbscript\|file/);
  assert.match(safety, /SHORTENERS/);
  assert.match(safety, /xn--/);
  assert.match(body, /MessageSafeLink/);
  assert.match(gate, /Безопасный переход/);
  assert.match(gate, /Не вводите пароль портала/);
  assert.match(gate, /\/api\/messages\/link-check/);
  assert.match(api, /checkSingleUrl/);
  assert.match(rkn, /suspicious/);
  assert.match(media, /type: 'link'/);
  assert.match(media, /www\\./);
});
