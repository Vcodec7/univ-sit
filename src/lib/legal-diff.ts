export type DiffLine = { type: 'same' | 'add' | 'del'; text: string };

function linesOf(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Линейный diff по строкам (без тяжёлых библиотек). */
export function diffPlainLines(oldText: string, newText: string): DiffLine[] {
  const a = linesOf(oldText);
  const b = linesOf(newText);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i += 1;
      j += 1;
      continue;
    }
    const laterInB = j < b.length ? a.indexOf(b[j], i) : -1;
    const laterInA = i < a.length ? b.indexOf(a[i], j) : -1;
    if (i < a.length && (j >= b.length || (laterInB === -1 && laterInA !== -1) || laterInB > i + 3)) {
      out.push({ type: 'del', text: a[i] });
      i += 1;
      continue;
    }
    if (j < b.length) {
      out.push({ type: 'add', text: b[j] });
      j += 1;
      continue;
    }
    break;
  }
  return out;
}
