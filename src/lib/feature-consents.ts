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

export function parseFeatureConsents(raw: string | null | undefined): Partial<Record<FeatureConsentKey, string>> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<FeatureConsentKey, string>> = {};
    for (const key of FEATURE_CONSENT_KEYS) {
      const v = parsed[key];
      if (typeof v === 'string' && v.trim()) out[key] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function hasFeatureConsent(
  raw: string | null | undefined,
  key: FeatureConsentKey
): boolean {
  return Boolean(parseFeatureConsents(raw)[key]);
}
