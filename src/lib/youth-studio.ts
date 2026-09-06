/** Youth-facing catalog studio: join modes, templates, extras JSON. */

export const CATALOG_STATUSES = ['DRAFT', 'REVIEW', 'ACTIVE', 'INACTIVE', 'COMPLETED'] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export const CATALOG_STATUS_RU: Record<string, string> = {
  DRAFT: 'Черновик',
  REVIEW: 'На проверке',
  ACTIVE: 'Опубликован',
  INACTIVE: 'Скрыт',
  COMPLETED: 'Завершён',
};

export const JOIN_MODES = [
  { id: 'apply', label: 'Заявка на сайте', hint: 'Кнопка «Подать заявку» в кабинете' },
  { id: 'link', label: 'Запись по ссылке', hint: 'Кнопка ведёт в форму / Telegram / MAX' },
  { id: 'open', label: 'Открытая группа', hint: 'Можно приходить без записи' },
  { id: 'none', label: 'Без записи', hint: 'Только рассказ о проекте, без кнопки' },
] as const;
export type JoinMode = (typeof JOIN_MODES)[number]['id'];

export type YouthStudio = {
  audience: string;
  whatHappens: string;
  howToJoin: string;
  joinMode: JoinMode;
  curatorName: string;
  curatorContact: string;
  signupUrl: string;
  tags: string;
  format: string;
};

export const EMPTY_STUDIO: YouthStudio = {
  audience: '',
  whatHappens: '',
  howToJoin: '',
  joinMode: 'apply',
  curatorName: '',
  curatorContact: '',
  signupUrl: '',
  tags: '',
  format: '',
};

export const YOUTH_TEMPLATES: Record<
  string,
  { label: string; why: string; audience: string; offer: string; whatHappens: string; howToJoin: string }
> = {
  project: {
    label: 'Проект',
    why: 'Делаем вместе результат для города — видно в портфолио.',
    audience: 'Тем, кто хочет собрать команду и довести идею до запуска.',
    offer: 'Опыт, ментор, строка в портфолио и М-баллы за вклад.',
    whatHappens: 'Короткие спринты, разбор задач, публичный итог сезона.',
    howToJoin: 'Оставь заявку — куратор напишет в течение нескольких дней.',
  },
  club: {
    label: 'Клуб',
    why: 'Регулярные встречи с людьми с тем же интересом.',
    audience: 'Кто хочет ходить каждую неделю, а не разово.',
    offer: 'Свои люди, навыки и совместные выезды.',
    whatHappens: 'Встречи по расписанию, темы сезона, мини-проекты.',
    howToJoin: 'Подай заявку или приходи на открытую встречу.',
  },
  event: {
    label: 'Мероприятие',
    why: 'Один вечер — новая тема, люди и впечатление.',
    audience: 'Кто свободен в эту дату и хочет попробовать формат.',
    offer: 'Участие, фото и иногда сертификат.',
    whatHappens: 'Сбор, основная программа, нетворкинг.',
    howToJoin: 'Запишись по кнопке, пока есть места.',
  },
  intake: {
    label: 'Набор участников',
    why: 'Открыт набор в команду на сезон.',
    audience: '14–35 лет, готовность уделять время каждую неделю.',
    offer: 'Роль в команде и наставник.',
    whatHappens: 'Отбор по заявке, знакомство, старт работ.',
    howToJoin: 'Заполни заявку до даты закрытия набора.',
  },
  space: {
    label: 'Пространство',
    why: 'Место, куда можно прийти учиться, работать и встречаться.',
    audience: 'Кто ищет зал, коворкинг или площадку в Сочи.',
    offer: 'Расписание, бронь и понятные правила дома.',
    whatHappens: 'Свободные слоты, события, чекин по QR.',
    howToJoin: 'Забронируй слот или приходи в часы работы.',
  },
};

export function parseStudioJson(raw: string | null | undefined): YouthStudio {
  if (!raw?.trim()) return { ...EMPTY_STUDIO };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const mode = String(o.joinMode || 'apply');
    const joinMode = JOIN_MODES.some((m) => m.id === mode) ? (mode as JoinMode) : 'apply';
    return {
      audience: String(o.audience || '').slice(0, 400),
      whatHappens: String(o.whatHappens || '').slice(0, 400),
      howToJoin: String(o.howToJoin || '').slice(0, 400),
      joinMode,
      curatorName: String(o.curatorName || '').slice(0, 80),
      curatorContact: String(o.curatorContact || '').slice(0, 120),
      signupUrl: String(o.signupUrl || '').slice(0, 400),
      tags: String(o.tags || '').slice(0, 200),
      format: String(o.format || '').slice(0, 80),
    };
  } catch {
    return { ...EMPTY_STUDIO };
  }
}

export function serializeStudioJson(s: YouthStudio): string | null {
  const empty = Object.values({
    ...s,
    joinMode: s.joinMode === 'apply' ? '' : s.joinMode,
  }).every((v) => !String(v || '').trim());
  if (empty) return null;
  return JSON.stringify(s);
}

export function studioFromFormData(formData: FormData): YouthStudio {
  const mode = String(formData.get('joinMode') || 'apply');
  return {
    audience: String(formData.get('audience') || '').trim(),
    whatHappens: String(formData.get('whatHappens') || '').trim(),
    howToJoin: String(formData.get('howToJoin') || '').trim(),
    joinMode: JOIN_MODES.some((m) => m.id === mode) ? (mode as JoinMode) : 'apply',
    curatorName: String(formData.get('curatorName') || '').trim(),
    curatorContact: String(formData.get('curatorContact') || '').trim(),
    signupUrl: String(formData.get('signupUrl') || '').trim(),
    tags: String(formData.get('tags') || '').trim(),
    format: String(formData.get('format') || '').trim(),
  };
}

export function catalogStatusLabel(status?: string | null) {
  return CATALOG_STATUS_RU[status || 'ACTIVE'] || status || 'Опубликован';
}

export function isPublishedCatalogStatus(status?: string | null) {
  const s = status || 'ACTIVE';
  return s === 'ACTIVE' || s === 'COMPLETED';
}

export type StudioChecklistItem = { id: string; ok: boolean; label: string };

export function studioChecklist(opts: {
  title: string;
  description: string;
  mission?: string | null;
  goal?: string | null;
  image?: string | null;
  studio: YouthStudio;
}): StudioChecklistItem[] {
  const text = String(opts.description || '').replace(/<[^>]+>/g, '').trim();
  return [
    { id: 'title', ok: opts.title.trim().length >= 3, label: 'Название' },
    { id: 'desc', ok: text.length >= 80, label: 'Описание не короче 80 символов' },
    { id: 'why', ok: Boolean(opts.mission?.trim()), label: 'Зачем идти' },
    { id: 'offer', ok: Boolean(opts.goal?.trim()), label: 'Что получит участник' },
    { id: 'who', ok: Boolean(opts.studio.audience.trim()), label: 'Кому подойдёт' },
    { id: 'cover', ok: Boolean(opts.image), label: 'Обложка' },
    {
      id: 'join',
      ok:
        opts.studio.joinMode === 'none' ||
        opts.studio.joinMode === 'open' ||
        opts.studio.joinMode === 'apply' ||
        (opts.studio.joinMode === 'link' && Boolean(opts.studio.signupUrl.trim())),
      label: 'Понятный способ вступления',
    },
  ];
}

export function stripHtml(html: string, max = 160) {
  const t = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
