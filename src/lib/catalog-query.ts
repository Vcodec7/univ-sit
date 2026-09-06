/** Compare catalog query strings ignoring pagination. */
export function catalogFiltersKey(params: URLSearchParams | string): string {
  const src = typeof params === 'string' ? new URLSearchParams(params) : params;
  const pairs: string[] = [];
  for (const [k, v] of src.entries()) {
    if (k === 'page' || !v) continue;
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  return pairs.join('&');
}

export function ruCount(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}
