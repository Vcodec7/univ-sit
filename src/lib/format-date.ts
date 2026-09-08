/** Coerce Prisma/JSON dates (Date | string | number) for display. */
export function asDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const raw = String(value).trim();
  const isoish = raw.includes('T') ? raw : raw.replace(/^(\d{4}-\d{2}-\d{2})[ ](\d)/, '$1T$2');
  let d = new Date(isoish);
  if (Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    d = new Date(raw.replace(/-/g, '/').replace('T', ' '));
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRuDate(
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = asDate(value);
  if (!d) return '';
  return d.toLocaleDateString('ru-RU', options);
}
