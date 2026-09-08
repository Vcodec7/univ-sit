import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('login and register are force-dynamic', () => {
  const loginLayout = readFileSync(join(root, 'src/app/login/layout.tsx'), 'utf8');
  const regLayout = readFileSync(join(root, 'src/app/register/layout.tsx'), 'utf8');
  assert.match(loginLayout, /force-dynamic/);
  assert.match(regLayout, /force-dynamic/);
});

test('legal interactive and search', () => {
  const shell = readFileSync(join(root, 'src/components/LegalDocShell.tsx'), 'utf8');
  const interactive = readFileSync(join(root, 'src/components/LegalInteractive.tsx'), 'utf8');
  assert.match(shell, /interactiveHtml/);
  assert.match(interactive, /fuse\.js/i);
  assert.match(interactive, /Человеческий язык/);
});

test('feature consents and coworking 412', () => {
  const cw = readFileSync(join(root, 'src/app/api/coworking/route.ts'), 'utf8');
  assert.match(cw, /NEED_FEATURE_CONSENT/);
  const lib = readFileSync(join(root, 'src/lib/feature-consents.ts'), 'utf8');
  assert.match(lib, /coworking/);
});

test('backup offsite and restore drill', () => {
  const full = readFileSync(join(root, 'scripts/full-backup.sh'), 'utf8');
  assert.match(full, /backup-offsite/);
  const off = readFileSync(join(root, 'scripts/backup-offsite.sh'), 'utf8');
  assert.match(off, /BACKUP_RCLONE_REMOTE/);
  const drill = readFileSync(join(root, 'scripts/restore-db-drill.sh'), 'utf8');
  assert.match(drill, /pg_restore/);
});
