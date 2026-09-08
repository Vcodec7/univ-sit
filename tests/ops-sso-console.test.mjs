import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('SSO keys live in ops console and DB, not only .env', () => {
  const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
  const ops = readFileSync(join(root, 'src/components/OpsSitePanel.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/app/api/ops/site/route.ts'), 'utf8');
  const auth = readFileSync(join(root, 'src/lib/auth.ts'), 'utf8');
  const nextauth = readFileSync(join(root, 'src/app/api/auth/[...nextauth]/route.ts'), 'utf8');
  const settings = readFileSync(join(root, 'src/lib/oauth-settings.ts'), 'utf8');
  const providers = readFileSync(join(root, 'src/lib/oauth-providers.ts'), 'utf8');

  assert.match(schema, /oauthSsoJson/);
  assert.match(api, /action === 'saveSso'/);
  assert.match(api, /saveOAuthSso/);
  assert.match(ops, /saveSso/);
  assert.match(ops, /callback\/yandex/);
  assert.match(ops, /callback\/vk/);
  assert.match(ops, /setdomain/);
  assert.match(ops, /Пересоздавать контейнер web не/);
  assert.doesNotMatch(ops, /После правки \.env/);
  assert.match(auth, /get providers\(\)/);
  assert.match(auth, /peekOAuthCreds/);
  assert.match(nextauth, /loadOAuthCreds/);
  assert.match(settings, /oauthSsoJson/);
  assert.match(providers, /peekOAuthCreds/);
});

test('oauth flags require both id and secret', () => {
  const src = readFileSync(join(root, 'src/lib/oauth-settings.ts'), 'utf8');
  assert.match(src, /yandex: Boolean\(c\.yandexId && c\.yandexSecret\)/);
  assert.match(src, /vk: Boolean\(c\.vkId && c\.vkSecret\)/);
  assert.match(src, /telegram: Boolean\(c\.telegramToken && c\.telegramUsername\)/);
});
