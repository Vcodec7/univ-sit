/** Safe label when Prisma include user/space is missing (deleted user). */
export function staffUserLabel(
  user?: { name?: string | null; email?: string | null } | null
): string {
  const n = (user?.name || '').trim();
  if (n) return n;
  const e = (user?.email || '').trim();
  if (e) return e;
  return 'Пользователь';
}

export function staffSpaceLabel(space?: { title?: string | null; name?: string | null } | null): string {
  return (space?.title || space?.name || 'Площадка').trim() || 'Площадка';
}
