import { createHash } from 'crypto';
import {
  COOKIES_POLICY_VERSION,
  PRIVACY_POLICY_VERSION,
  RULES_POLICY_VERSION,
} from '@/lib/consent-versions';

export {
  COOKIES_POLICY_VERSION,
  PRIVACY_POLICY_VERSION,
  RULES_POLICY_VERSION,
} from '@/lib/consent-versions';

/** Stable digital signature for consent records */
export function buildConsentSignature(opts: {
  userId?: string | null;
  email?: string | null;
  kind: 'privacy' | 'cookies' | 'rules';
  version: string;
  at?: Date;
}) {
  const at = (opts.at || new Date()).toISOString();
  const payload = [
    opts.kind,
    opts.version,
    opts.userId || 'guest',
    (opts.email || '').toLowerCase(),
    at,
  ].join('|');
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 32);
  return `yp.${opts.kind}.${opts.version}.${hash}`;
}

/** Older accounts accepted privacy (and rules in the same checkbox) before `rulesAcceptedAt` existed. */
export function rulesFieldsIfMissing(opts: {
  userId: string;
  email?: string | null;
  rulesAcceptedAt?: Date | string | null;
  privacyAcceptedAt?: Date | string | null;
}) {
  if (opts.rulesAcceptedAt) return null;
  if (!opts.privacyAcceptedAt) return null;
  const at =
    opts.privacyAcceptedAt instanceof Date
      ? opts.privacyAcceptedAt
      : new Date(opts.privacyAcceptedAt);
  if (Number.isNaN(at.getTime())) return null;
  return {
    rulesAcceptedAt: at,
    rulesPolicyVersion: RULES_POLICY_VERSION,
    rulesSignature: buildConsentSignature({
      userId: opts.userId,
      email: opts.email,
      kind: 'rules' as const,
      version: RULES_POLICY_VERSION,
      at,
    }),
  };
}

export function formatConsentDate(value?: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
