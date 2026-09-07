/**
 * SMS gateway used for login OTP. Config: SiteSettings (admin) with env fallback.
 */
import { prisma } from '@/lib/prisma';

export type SmsProviderKind = 'generic' | 'smsru' | 'smsc';

export type SmsDispatchConfig = {
  kind: SmsProviderKind;
  url: string;
  key: string;
  login: string;
  from: string;
};

export function parseSmsProvider(raw: unknown): SmsProviderKind {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'smsru' || v === 'sms.ru') return 'smsru';
  if (v === 'smsc' || v === 'smsc.ru') return 'smsc';
  return 'generic';
}

export function smsConfigReady(cfg: SmsDispatchConfig): boolean {
  if (cfg.kind === 'smsru') return Boolean(cfg.key);
  if (cfg.kind === 'smsc') return Boolean(cfg.login && cfg.key);
  return Boolean(cfg.url);
}

export function mergeSmsConfig(row: {
  smsProvider?: string | null;
  smsApiUrl?: string | null;
  smsApiKey?: string | null;
  smsApiLogin?: string | null;
  smsFrom?: string | null;
} | null): SmsDispatchConfig {
  return {
    kind: parseSmsProvider(row?.smsProvider || process.env.SMS_PROVIDER),
    url: String(row?.smsApiUrl || process.env.SMS_API_URL || '').trim(),
    key: String(row?.smsApiKey || process.env.SMS_API_KEY || '').trim(),
    login: String(row?.smsApiLogin || process.env.SMS_LOGIN || '').trim(),
    from: String(row?.smsFrom || process.env.SMS_FROM || '').trim(),
  };
}

export async function loadSmsDispatchConfig(): Promise<SmsDispatchConfig> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: {
        smsProvider: true,
        smsApiUrl: true,
        smsApiKey: true,
        smsApiLogin: true,
        smsFrom: true,
      },
    });
    return mergeSmsConfig(row);
  } catch {
    return mergeSmsConfig(null);
  }
}

export async function smsProviderConfigured(): Promise<boolean> {
  return smsConfigReady(await loadSmsDispatchConfig());
}

type SendResult = { ok: boolean; message?: string };

async function postJson(url: string, key: string, body: Record<string, unknown>): Promise<SendResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, message: 'SMS-провайдер отклонил запрос' };
    return { ok: true };
  } catch {
    return { ok: false, message: 'SMS-провайдер недоступен' };
  }
}

export async function dispatchSms(
  to: string,
  text: string,
  cfg: SmsDispatchConfig,
): Promise<SendResult> {
  if (!smsConfigReady(cfg)) {
    return { ok: false, message: 'SMS-шлюз не настроен' };
  }
  const from = cfg.from || undefined;

  if (cfg.kind === 'smsru') {
    const params = new URLSearchParams({
      api_id: cfg.key,
      to,
      msg: text,
      json: '1',
    });
    if (from) params.set('from', from);
    try {
      const res = await fetch(`https://sms.ru/sms/send?${params}`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      const json = (await res.json().catch(() => null)) as { status?: string; status_code?: number } | null;
      if (json?.status === 'OK' || json?.status_code === 100) return { ok: true };
      return { ok: false, message: 'SMS.ru отклонил отправку' };
    } catch {
      return { ok: false, message: 'SMS.ru недоступен' };
    }
  }

  if (cfg.kind === 'smsc') {
    const params = new URLSearchParams({
      login: cfg.login,
      psw: cfg.key,
      phones: to,
      mes: text,
      charset: 'utf-8',
      fmt: '3',
    });
    if (from) params.set('sender', from);
    try {
      const res = await fetch(`https://smsc.ru/sys/send.php?${params}`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      const json = (await res.json().catch(() => null)) as { id?: number; error?: string; error_code?: number } | null;
      if (json && json.id && !json.error_code) return { ok: true };
      return { ok: false, message: json?.error || 'SMSC отклонил отправку' };
    } catch {
      return { ok: false, message: 'SMSC недоступен' };
    }
  }

  if (!/^https:\/\//i.test(cfg.url)) {
    return { ok: false, message: 'URL шлюза должен начинаться с https://' };
  }
  return postJson(cfg.url, cfg.key, { to, text, from });
}
