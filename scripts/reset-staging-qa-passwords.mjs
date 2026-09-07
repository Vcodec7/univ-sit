/**
 * Reset passwords for documented staging QA emails only.
 * Never touches admin@sochi.ru.
 * Uses `pg` + `bcrypt` (present in the standalone image); no Prisma adapter.
 *
 *   QA_RESET_STAGING=1 QA_SEED_PASSWORD='RolePass123!' node scripts/reset-staging-qa-passwords.mjs
 */
import pg from 'pg';
import bcrypt from 'bcrypt';

const QA_EMAILS = [
  'qa-admin@sochi.ru',
  'mod@sochi.ru',
  'part@sochi.ru',
  'user@sochi.ru',
  'scanner@sochi.ru',
  'private@sochi.ru',
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
  let missing = 0;
  for (const email of QA_EMAILS) {
    const found = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (!found.rowCount) {
      missing += 1;
      continue;
    }
    await pool.query(
      'UPDATE "User" SET password = $1, "deletedAt" = NULL, "blockedAt" = NULL WHERE email = $2',
      [hash, email],
    );
    updated += 1;
  }
  console.log(JSON.stringify({ ok: true, updated, missing, emails: QA_EMAILS.length }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
