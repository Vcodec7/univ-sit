/** Age in full years, or null if birth date is missing/invalid. */
export function ageFromBirthDate(value: Date | string | null | undefined, now = new Date()): number | null {
  if (!value) return null;
  const birth = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

function yearsWordRu(age: number) {
  const n = age % 100;
  const n1 = age % 10;
  if (n > 10 && n < 20) return 'лет';
  if (n1 === 1) return 'год';
  if (n1 >= 2 && n1 <= 4) return 'года';
  return 'лет';
}

/** Human label for admin lists. Always defined — never leave age blank. */
export function ageLabelRu(value: Date | string | null | undefined): string {
  const age = ageFromBirthDate(value);
  if (age == null) return 'возраст не указан';
  return `${age} ${yearsWordRu(age)}`;
}
