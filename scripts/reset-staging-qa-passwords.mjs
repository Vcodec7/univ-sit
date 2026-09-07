/**
 * Reset passwords for documented staging QA emails only.
 * Never touches admin@sochi.ru.
 *
 *   QA_RESET_STAGING=1 QA_SEED_PASSWORD='RolePass123!' node scripts/reset-staging-qa-passwords.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const hash = await bcrypt.hash(pass, 10);
  let updated = 0;
  let created = 0;
  for (const email of QA_EMAILS) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hash, deletedAt: null, blockedAt: null },
      });
      updated += 1;
      continue;
    }
    const role =
      email.startsWith('qa-admin')
        ? 'ADMIN'
        : email.startsWith('mod')
          ? 'MODERATOR'
          : email.startsWith('part')
            ? 'PARTICIPANT'
            : email.startsWith('scanner')
              ? 'SCANNER'
              : 'USER';
    await prisma.user.create({
      data: {
        email,
        name: email,
        role,
        password: hash,
        city: 'Сочи',
        isDemoData: true,
        privacyAcceptedAt: new Date(),
        rulesAcceptedAt: new Date(),
        cookiesAcceptedAt: new Date(),
      },
    });
    created += 1;
  }
  console.log(JSON.stringify({ ok: true, updated, created, emails: QA_EMAILS.length }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
