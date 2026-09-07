/** Client-safe vacancy catalog helpers (no Prisma). */

export const VACANCY_FORMAT_RU: Record<string, string> = {
  offline: 'Очно',
  hybrid: 'Гибрид',
  remote: 'Удалённо',
};

export const VACANCY_EMPLOYMENT = ['internship', 'part_time', 'full_time', 'project', 'volunteer'] as const;
export type VacancyEmployment = (typeof VACANCY_EMPLOYMENT)[number];

export const VACANCY_EMPLOYMENT_RU: Record<VacancyEmployment, string> = {
  internship: 'Стажировка',
  part_time: 'Подработка',
  full_time: 'Полная занятость',
  project: 'Проект / смена',
  volunteer: 'Волонтёрство',
};

export type VacancyContent = {
  items: string[];
  salaryText: string | null;
  paid: boolean | null;
  employmentType: VacancyEmployment | null;
  duties: string[];
  offer: string[];
  about: string | null;
};

const EMPTY: VacancyContent = {
  items: [],
  salaryText: null,
  paid: null,
  employmentType: null,
  duties: [],
  offer: [],
  about: null,
};

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function asEmployment(v: unknown): VacancyEmployment | null {
  const s = String(v || '');
  return (VACANCY_EMPLOYMENT as readonly string[]).includes(s) ? (s as VacancyEmployment) : null;
}

/** Legacy string[] or structured object in requirementsJson. */
export function parseVacancyRequirements(raw: string | null | undefined): VacancyContent {
  if (!raw?.trim()) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { ...EMPTY, items: strList(parsed) };
    }
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY };
    const o = parsed as Record<string, unknown>;
    const paid =
      typeof o.paid === 'boolean' ? o.paid : o.paid === 'true' ? true : o.paid === 'false' ? false : null;
    return {
      items: strList(o.items ?? o.requirements),
      salaryText: o.salaryText ? String(o.salaryText).trim() || null : null,
      paid,
      employmentType: asEmployment(o.employmentType),
      duties: strList(o.duties),
      offer: strList(o.offer),
      about: o.about ? String(o.about).trim() || null : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function serializeVacancyRequirements(c: {
  items?: unknown;
  salaryText?: string | null;
  paid?: boolean | null;
  employmentType?: unknown;
  duties?: unknown;
  offer?: unknown;
  about?: string | null;
}): string {
  const paid = c.paid === true ? true : c.paid === false ? false : null;
  return JSON.stringify({
    items: strList(c.items),
    salaryText: c.salaryText ? String(c.salaryText).trim() || null : null,
    paid,
    employmentType: asEmployment(c.employmentType),
    duties: strList(c.duties),
    offer: strList(c.offer),
    about: c.about ? String(c.about).trim() || null : null,
  });
}

export function vacancyHtmlToPlain(html: string) {
  return String(html || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function vacancyPlainToHtml(text: string) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (/<[a-z][\s\S]*>/i.test(t)) return t;
  const escaped = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<p>${escaped.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
}

export function vacancyIsApplyOpen(opts: {
  status: string;
  closesAt?: Date | string | null;
  seats?: number | null;
  seatsTaken?: number | null;
}) {
  if (opts.status !== 'OPEN') return false;
  if (opts.closesAt) {
    const t = typeof opts.closesAt === 'string' ? new Date(opts.closesAt).getTime() : opts.closesAt.getTime();
    if (!Number.isNaN(t) && t < Date.now()) return false;
  }
  if (opts.seats != null && (opts.seatsTaken || 0) >= opts.seats) return false;
  return true;
}

export function vacancyPhaseLabel(opts: {
  status: string;
  closesAt?: Date | string | null;
  seats?: number | null;
  seatsTaken?: number | null;
}) {
  if (opts.status !== 'OPEN') {
    if (opts.status === 'CLOSED') return 'Набор закрыт';
    if (opts.status === 'DRAFT') return 'Черновик';
    if (opts.status === 'ARCHIVED') return 'В архиве';
    return opts.status;
  }
  if (opts.closesAt) {
    const t = typeof opts.closesAt === 'string' ? new Date(opts.closesAt).getTime() : opts.closesAt.getTime();
    if (!Number.isNaN(t) && t < Date.now()) return 'Срок приёма вышел';
  }
  if (opts.seats != null && (opts.seatsTaken || 0) >= opts.seats) return 'Мест нет';
  return 'Идёт набор';
}

export function paidLabel(paid: boolean | null, salaryText: string | null) {
  if (salaryText) return salaryText;
  if (paid === true) return 'Оплачивается';
  if (paid === false) return 'Без оплаты';
  return null;
}

/** Drop requirement bullets that only repeat the age gate. */
export function filterAgeDuplicateItems(items: string[], ageMin: number | null, ageMax: number | null) {
  if (ageMin == null && ageMax == null) return items;
  return items.filter((s) => !/^возраст\b/i.test(s.trim()));
}
