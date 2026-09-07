import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('online dashboard uses session touch and login events, not only a slow heartbeat', () => {
  const providers = readFileSync(join(root, 'src/components/Providers.tsx'), 'utf8');
  const auth = readFileSync(join(root, 'src/lib/auth.ts'), 'utf8');
  const query = readFileSync(join(root, 'src/lib/admin-online-users.ts'), 'utf8');
  const client = readFileSync(join(root, 'src/app/admin/online/AdminOnlineUsersClient.tsx'), 'utf8');
  const presence = readFileSync(join(root, 'src/lib/presence.ts'), 'utf8');

  assert.match(presence, /TOUCH_THROTTLE_MS/);
  assert.match(auth, /touchUserPresence/);
  assert.match(query, /loginEvent\.groupBy/);
  assert.match(providers, /schedule\(400\)/);
  assert.match(providers, /backoffMs = 50_000/);
  assert.match(client, /useState\('all'\)/);
  assert.match(client, /в сети/);
  assert.doesNotMatch(client, /online' : 'offline/);
});
