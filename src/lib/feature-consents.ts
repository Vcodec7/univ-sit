export const FEATURE_CONSENT_KEYS = ['coworking', 'portfolio'] as const;
export type FeatureConsentKey = (typeof FEATURE_CONSENT_KEYS)[number];

export const FEATURE_CONSENT_COPY: Record<
  FeatureConsentKey,
  { title: string; lines: string[] }
> = {
  coworking: {
    title: 'Правила коворкинга',
    lines: [
      'Приходите вовремя и освобождайте место к концу слота.',
      'Не мешайте другим: тихий разговор, наушники для видео.',
      'Оставляйте стол чистым. Неявки портят рейтинг записи.',
    ],
  },
  portfolio: {
    title: 'Правила портфолио',
    lines: [
      'Публикуйте только свои работы или материалы с правом размещения.',
      'Не размещайте персональные данные третьих лиц без согласия.',
      'Модерация может скрыть материал, если он нарушает правила портала.',
    ],
  },
};

function asRecord(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function parseFeatureConsents(prefsJson: string | null | undefined): Partial<Record<FeatureConsentKey, string>> {
  const parsed = asRecord(prefsJson);
  const nestedRaw = parsed.featureConsents;
  const nested =
    nestedRaw && typeof nestedRaw === 'object' && !Array.isArray(nestedRaw)
      ? (nestedRaw as Record<string, unknown>)
      : {};
  const out: Partial<Record<FeatureConsentKey, string>> = {};
  for (const key of FEATURE_CONSENT_KEYS) {
    const v = nested[key];
    if (typeof v === 'string' && v.trim()) out[key] = v;
  }
  return out;
}

export function writeFeatureConsent(
  prefsJson: string | null | undefined,
  key: FeatureConsentKey,
  at: string
): string {
  const parsed = asRecord(prefsJson);
  const current = parseFeatureConsents(prefsJson);
  current[key] = at;
  parsed.featureConsents = current;
  return JSON.stringify(parsed);
}

export function hasFeatureConsent(
  prefsJson: string | null | undefined,
  key: FeatureConsentKey
): boolean {
  return Boolean(parseFeatureConsents(prefsJson)[key]);
}
