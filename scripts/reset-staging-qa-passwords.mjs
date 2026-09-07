/**
 * Reset or create documented staging QA emails. Never touches admin@sochi.ru.
 * Uses `pg` + `bcrypt` (in the standalone image).
 *
 *   QA_RESET_STAGING=1 QA_SEED_PASSWORD='RolePass123!' node scripts/reset-staging-qa-passwords.mjs
 */
import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const QA_USERS = [
  { email: 'qa-admin@sochi.ru', role: 'ADMIN', name: 'QA Администратор' },
  { email: 'mod@sochi.ru', role: 'MODERATOR', name: 'QA Модератор' },
  { email: 'part@sochi.ru', role: 'PARTICIPANT', name: 'QA Участник' },
  { email: 'user@sochi.ru', role: 'USER', name: 'QA Пользователь' },
  { email: 'scanner@sochi.ru', role: 'SCANNER', name: 'QA Сканер' },
  { email: 'private@sochi.ru', role: 'USER', name: 'QA Приватный' },
];

const connectionString = process.env.DATABASE_URL;
const pass = process.env.QA_SEED_PASSWORD || process.env.QA_PASS || '';
const nextAuth = process.env.NEXTAUTH_URL || '';
const allowed =
  process.env.QA_RESET_STAGING === '1' || /ty\.idivles\.ru/i.test(nextAuth);

if (!connectionString) {
  console.error('DATABASE_URL required');
  process.exit(1);
}
if (!pass) {
  console.error('QA_SEED_PASSWORD or QA_PASS required');
  process.exit(1);
}
if (!allowed) {
  console.error('refusing: set QA_RESET_STAGING=1 or NEXTAUTH_URL=https://ty.idivles.ru');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });

async function main() {
  const hash = await bcrypt.hash(pass, 10);
  let updated = 0;
  let created = 0;
  const total = await pool.query('SELECT count(*)::int AS n FROM "User"');
  for (const spec of QA_USERS) {
    const found = await pool.query('SELECT id FROM "User" WHERE lower(email) = lower($1)', [spec.email]);
    if (found.rowCount) {
      await pool.query(
        `UPDATE "User"
         SET password = $1, role = $2::"Role", name = $3, "deletedAt" = NULL, "blockedAt" = NULL, "mustChangePassword" = false
         WHERE id = $4`,
        [hash, spec.role, spec.name, found.rows[0].id],
      );
      updated += 1;
      continue;
    }
    const id = `c${randomBytes(12).toString('hex')}`;
    await pool.query(
      `INSERT INTO "User" (
         id, email, name, role, password, city, "isDemoData",
         "privacyAcceptedAt", "rulesAcceptedAt", "cookiesAcceptedAt",
         "createdAt", "updatedAt", "mustChangePassword"
       ) VALUES (
         $1, $2, $3, $4::"Role", $5, 'Сочи', true,
         NOW(), NOW(), NOW(), NOW(), NOW(), false
       )`,
      [id, spec.email, spec.name, spec.role, hash],
    );
    created += 1;
  }
  console.log(JSON.stringify({ ok: true, updated, created, usersInDb: total.rows[0].n }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
