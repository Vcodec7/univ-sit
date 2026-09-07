/** Client-safe program catalog helpers (no Prisma). */

export const PROGRAM_KINDS = ['GRANT', 'DOBRO', 'SELF_GOV'] as const;
export type ProgramKind = (typeof PROGRAM_KINDS)[number];

export const PROGRAM_KIND_META: Record<
  ProgramKind,
  {
    slug: string;
    title: string;
    singular: string;
    applyLabel: string;
    approvedLabel: string;
    listDescription: string;
    adminTitle: string;
  }
> = {
  GRANT: {
    slug: 'grants',
    title: 'Гранты',
    singular: 'грант',
    applyLabel: 'Подать заявку на грант',
    approvedLabel: 'Заявка принята',
    listDescription:
      'Конкурсы и программы поддержки молодёжных инициатив Сочи: сроки, условия и подача заявки на портале.',
    adminTitle: 'Грантовые программы',
  },
  DOBRO: {
    slug: 'dobro',
    title: 'Добро',
    singular: 'акция',
    applyLabel: 'Записаться волонтёром',
    approvedLabel: 'Вы в команде',
    listDescription:
      'Волонтёрские акции и наборы Добро.Центра Сочи: смены, городские события и помощь городу.',
    adminTitle: 'Волонтёрские акции',
  },
  SELF_GOV: {
    slug: 'self-gov',
    title: 'Самоуправление',
    singular: 'орган',
    applyLabel: 'Подать заявку на участие',
    approvedLabel: 'Вы участник',
    listDescription:
      'Молодёжный совет, парламент и ученическое самоуправление — влияние на решения, важные для молодых жителей.',
    adminTitle: 'Самоуправление',
  },
};

export const PROGRAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  OPEN: 'Открыт набор',
  CLOSED: 'Набор закрыт',
  ARCHIVED: 'В архиве',
};

export const BODY_TYPE_LABELS: Record<string, string> = {
  COUNCIL: 'Молодёжный совет',
  PARLIAMENT: 'Молодёжный парламент',
  SCHOOL: 'Ученическое самоуправление',
  INITIATIVE: 'Инициативная группа',
};

export type SelfGovGuide = {
  format: string;
  duties: string[];
  who: string[];
  offer: string[];
};

/** Extra copy for self-gov cards so the page is not one thin paragraph. */
export const SELF_GOV_GUIDE: Record<string, SelfGovGuide> = {
  PARLIAMENT: {
    format: 'Очно: заседания, комитеты и открытые слушания',
    duties: [
      'Готовите резолюции и проекты нормативных инициатив по темам города',
      'Участвуете в дебатах и слушаниях, учитесь выступать коротко и по делу',
      'Работаете в комитете (право, образование, городская среда, медиа — по выбору)',
    ],
    who: [
      'Возраст 16–35, живёте или учитесь в Сочи',
      'Интерес к праву, управлению или публичным выступлениям — опыт не обязателен',
      'Готовность приходить на заседания в Доме молодёжи',
    ],
    offer: [
      'Практика «как у взрослых»: регламент, голос, протоколы',
      'Менторство и разбор выступлений',
      'Строка в портфолио и контакты с городскими площадками',
    ],
  },
  COUNCIL: {
    format: 'Очно: заседания совета и рабочие группы',
    duties: [
      'Собираете обратную связь молодых жителей и формулируете предложения',
      'Сопровождаете инициативы до уровня молодёжной политики города',
      'Участвуете в рабочих группах по направлениям',
    ],
    who: [
      'Возраст 16–35',
      'Готовность к регулярным заседаниям, не разовым акциям',
      'Интерес к городским темам, которые хотите курировать',
    ],
    offer: [
      'Прямой канал к администрации через совет',
      'Опыт проектной и представительской работы',
      'Сеть сверстников из разных районов Сочи',
    ],
  },
  SCHOOL: {
    format: 'Школа + городские встречи кураторов',
    duties: [
      'Транслируете афишу и наборы портала в свой школьный совет',
      'Помогаете одноклассникам с заявками и событиями',
      'Привозите школьные инициативы на городской уровень',
    ],
    who: [
      'Ученик или педагог-куратор самоуправления в школе Сочи',
      'Есть контакт со школьным советом или готов его собрать',
    ],
    offer: [
      'Связка «школа — Дом молодёжи»',
      'Приоритет на городские смены и форумы',
      'Опыт координации, а не только участия',
    ],
  },
  INITIATIVE: {
    format: 'Гибкий: встречи по проекту',
    duties: [
      'Собираете команду вокруг конкретной городской темы',
      'Готовите предложение и защищаете его на совете или парламенте',
    ],
    who: ['Есть идея и 2–3 человека, готовых её вести'],
    offer: ['Площадка, наставник и маршрут, куда нести инициативу'],
  },
};

export function programPublicPath(kind: ProgramKind, id?: string) {
  const base = `/${PROGRAM_KIND_META[kind].slug}`;
  return id ? `${base}/${id}` : base;
}

export function formatProgramDate(d: Date | string | null | undefined) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function programIsApplyOpen(status: string, endsAt?: Date | string | null) {
  if (status !== 'OPEN') return false;
  if (!endsAt) return true;
  const t = typeof endsAt === 'string' ? new Date(endsAt).getTime() : endsAt.getTime();
  if (Number.isNaN(t)) return true;
  return t >= Date.now();
}

export function programStatusLabel(status: string, endsAt?: Date | string | null) {
  if (status === 'OPEN' && !programIsApplyOpen(status, endsAt)) return 'Срок набора вышел';
  return PROGRAM_STATUS_LABELS[status] || status;
}
