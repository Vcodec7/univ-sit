#!/usr/bin/env node
/**
 * Developer-only public catalog seed.
 *
 * `db:seed` (seed-demo.mjs) creates rows flagged `isDemoData: true`, which the
 * public catalogs intentionally hide (see src/lib/publish.ts). That is correct
 * for production, but leaves a fresh local dev site with empty public catalogs.
 *
 * This script upserts a small set of PUBLISHED / ACTIVE, non-demo entries so a
 * developer immediately sees populated Projects / Clubs / Spaces / News pages.
 * It is idempotent (stable ids) and safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://sochi:sochi@127.0.0.1:5432/sochi_portal?schema=public';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const projects = [
  {
    id: 'dev-project-forum',
    title: 'Форум «Сочиняй смыслы»',
    description:
      'Образовательный форум для молодёжи: спикеры, проектные мастерские и грантовый конкурс.',
    goal: 'Собрать активную молодёжь города и запустить новые инициативы.',
  },
  {
    id: 'dev-project-kvn',
    title: 'Сочинская Лига КВН',
    description: 'Городская лига КВН — тренировки, игры сезона и фестивали юмора.',
    goal: 'Развивать команды и проводить регулярные игры.',
  },
  {
    id: 'dev-project-eco',
    title: 'Эко-марафон набережной',
    description: 'Волонтёрские субботники и раздельный сбор на морском побережье.',
    goal: 'Сделать набережную чище силами волонтёров.',
  },
];

const clubs = [
  {
    id: 'dev-club-boardgames',
    title: 'Клуб настольных игр',
    description: 'Встречи по выходным в Доме молодёжи — более 50 игр для любой компании.',
    meetingSchedule: 'По субботам в 17:00',
    meetingPlace: 'Дом молодёжи, ул. Навагинская, 9',
    tags: 'игры, общение, досуг',
  },
  {
    id: 'dev-club-it',
    title: 'IT-комьюнити Сочи',
    description: 'Встречи разработчиков, мини-хакатоны и обмен опытом.',
    meetingSchedule: 'Каждую вторую среду в 19:00',
    meetingPlace: 'Креативный кластер, ул. Тимирязева, 6',
    tags: 'it, разработка, хакатон',
  },
];

const spaces = [
  {
    id: 'dev-space-house',
    title: 'Дом молодёжи',
    address: 'г. Сочи, ул. Навагинская, 9',
    description: 'Многофункциональное пространство для встреч и мероприятий.',
    category: 'Зал мероприятий',
    capacity: 120,
  },
  {
    id: 'dev-space-cowork',
    title: 'Коворкинг «Тимирязева, 6»',
    address: 'г. Сочи, ул. Тимирязева, 6',
    description: 'Рабочие места и переговорные для проектных команд.',
    category: 'Коворкинг',
    bookingMode: 'COWORKING',
    capacity: 40,
  },
];

const news = [
  {
    id: 'dev-news-season',
    title: 'Старт нового сезона проектов',
    text: 'Открыт набор в молодёжные проекты Сочи на новый сезон. Подавайте заявки на портале.',
  },
  {
    id: 'dev-news-booking',
    title: 'Бронирование пространств онлайн',
    text: 'Теперь забронировать Дом молодёжи и другие площадки можно прямо на портале.',
  },
];

async function main() {
  const now = new Date();

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      create: { ...p, status: 'ACTIVE', isDemoData: false },
      update: { title: p.title, description: p.description, goal: p.goal, image: null, status: 'ACTIVE', isDemoData: false },
    });
  }

  for (const c of clubs) {
    await prisma.club.upsert({
      where: { id: c.id },
      create: { ...c, status: 'ACTIVE', isDemoData: false },
      update: { title: c.title, description: c.description, status: 'ACTIVE', isDemoData: false },
    });
  }

  for (const s of spaces) {
    await prisma.space.upsert({
      where: { id: s.id },
      create: { ...s, status: 'ACTIVE', isDemoData: false },
      update: { title: s.title, description: s.description, image: null, status: 'ACTIVE', isDemoData: false },
    });
  }

  for (const n of news) {
    await prisma.news.upsert({
      where: { id: n.id },
      create: { ...n, status: 'PUBLISHED', publishedAt: now, isDemoData: false },
      update: { title: n.title, text: n.text, status: 'PUBLISHED', publishedAt: now, isDemoData: false },
    });
  }

  console.log('seed-dev done:', {
    projects: projects.length,
    clubs: clubs.length,
    spaces: spaces.length,
    news: news.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
