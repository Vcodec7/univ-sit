/**
 * Phone + SMS one-time codes for optional passwordless login.
 * Requires SiteSettings.smsLoginEnabled and a configured SMS gateway.
 */
import { createHash, randomInt } from 'crypto';
import { getSharedRedis } from '@/lib/rateLimit';
import { normalizePhone } from '@/lib/phone';
import { dispatchSms, loadSmsDispatchConfig, smsConfigReady } from '@/lib/sms-dispatch';

const TTL_SEC = 5 * 60;
const MEM = new Map<string, { hash: string; exp: number; tries: number }>();

export { smsProviderConfigured } from '@/lib/sms-dispatch';

export function nationalPhoneKey(raw: string) {
  const d = normalizePhone(raw);
  return d.length >= 10 ? d.slice(-10) : '';
}

function hashCode(phoneKey: string, code: string) {
  return createHash('sha256').update(`yp-sms:${phoneKey}:${code}`).digest('hex');
}

async function store(phoneKey: string, hash: string) {
  const redis = getSharedRedis();
  if (redis) {
    await redis.set(`sms-otp:${phoneKey}`, JSON.stringify({ hash, tries: 0 }), 'EX', TTL_SEC);
    return;
  }
  MEM.set(phoneKey, { hash, exp: Date.now() + TTL_SEC * 1000, tries: 0 });
}

export async function issueSmsOtp(phoneRaw: string): Promise<{ ok: true; codeLength: number } | { ok: false; message: string }> {
  const phoneKey = nationalPhoneKey(phoneRaw);
  if (phoneKey.length !== 10) {
    return { ok: false, message: 'Укажите российский телефон' };
  }
  const cfg = await loadSmsDispatchConfig();
  if (!smsConfigReady(cfg)) {
    return { ok: false, message: 'SMS-вход не настроен' };
  }
  const code = String(randomInt(100000, 1000000));
  await store(phoneKey, hashCode(phoneKey, code));
  const sent = await dispatchSms(`+7${phoneKey}`, `Код входа: ${code}. Действует 5 минут.`, cfg);
  if (!sent.ok) {
    return { ok: false, message: sent.message || 'Не удалось отправить SMS' };
  }
  return { ok: true, codeLength: 6 };
}

export async function verifySmsOtp(phoneRaw: string, codeRaw: string): Promise<boolean> {
  const phoneKey = nationalPhoneKey(phoneRaw);
  const code = String(codeRaw || '').replace(/\D/g, '');
  if (phoneKey.length !== 10 || code.length !== 6) return false;
  const want = hashCode(phoneKey, code);
  const redis = getSharedRedis();
  if (redis) {
    try {
      const raw = await redis.get(`sms-otp:${phoneKey}`);
      if (!raw) return false;
      const row = JSON.parse(raw) as { hash?: string; tries?: number };
      const tries = Number(row.tries || 0) + 1;
      if (tries > 5) {
        await redis.del(`sms-otp:${phoneKey}`);
        return false;
      }
      if (row.hash !== want) {
        await redis.set(`sms-otp:${phoneKey}`, JSON.stringify({ hash: row.hash, tries }), 'KEEPTTL');
        return false;
      }
      await redis.del(`sms-otp:${phoneKey}`);
      return true;
    } catch {
      return false;
    }
  }
  const row = MEM.get(phoneKey);
  if (!row || Date.now() > row.exp) {
    MEM.delete(phoneKey);
    return false;
  }
  row.tries += 1;
  if (row.tries > 5 || row.hash !== want) {
    if (row.tries > 5) MEM.delete(phoneKey);
    return false;
  }
  MEM.delete(phoneKey);
  return true;
}
