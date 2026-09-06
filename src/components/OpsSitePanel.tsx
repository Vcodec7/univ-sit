'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type SiteStatus = {
  publicSiteUrl: string;
  effectiveOrigin: string;
  max: {
    enabled: boolean;
    hasToken: boolean;
    webhookUrl: string;
    webhookRegisteredUrl: string | null;
    webhookActive: boolean;
  };
};

export default function OpsSitePanel() {
  const [data, setData] = useState<SiteStatus | null>(null);
  const [origin, setOrigin] = useState('');
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/ops/site', { cache: 'no-store' });
    const d = (await r.json()) as SiteStatus & { message?: string };
    if (!r.ok) throw new Error(d.message || 'Нет доступа');
    setData(d);
    setOrigin(d.publicSiteUrl || d.effectiveOrigin || '');
  }, []);

  useEffect(() => {
    void load().catch((e) => toast.error(e instanceof Error ? e.message : 'Ошибка'));
  }, [load]);

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      const r = await fetch('/api/ops/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Ошибка');
      toast.success(d.message || 'Сохранено');
      setToken('');
      setSecret('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="ops-site">
      <p className="ops-console__hint" style={{ marginTop: 0 }}>
        Публичный адрес писем и вебхуков. Админка центра его не меняет — только смотрит.
      </p>
      <section className="ops-site__card">
        <h2>Адрес сайта</h2>
        <label>
          Публичный HTTPS
          <input
            className="settings-input"
            type="url"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="https://ty.idivles.ru"
          />
        </label>
        <p className="bots-muted">
          Сейчас в работе: <code>{data?.effectiveOrigin || '—'}</code>
        </p>
        <button
          type="button"
          className="bots-btn bots-btn--primary"
          disabled={busy === 'saveOrigin'}
          onClick={() => void post('saveOrigin', { publicSiteUrl: origin })}
        >
          Сохранить адрес
        </button>
      </section>
      <section className="ops-site__card">
        <h2>MAX — ключи и вебхук</h2>
        <p className="bots-muted">
          Токен: {data?.max.hasToken ? 'задан' : 'нет'} · вебхук:{' '}
          {data?.max.webhookActive ? 'активен на этом хосте' : data?.max.webhookRegisteredUrl || 'не зарегистрирован'}
        </p>
        <label>
          Токен (пусто — не менять)
          <input
            className="settings-input"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label>
          Секрет вебхука (пусто — не менять)
          <input
            className="settings-input"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>
        <div className="bots-actions">
          <button
            type="button"
            className="bots-btn bots-btn--secondary"
            disabled={busy === 'saveMaxToken'}
            onClick={() => void post('saveMaxToken', { token, secret, enabled: true })}
          >
            Сохранить ключи
          </button>
          <button
            type="button"
            className="bots-btn bots-btn--primary"
            disabled={busy === 'ensureMaxWebhook'}
            onClick={() => void post('ensureMaxWebhook', { publicOrigin: origin || data?.effectiveOrigin })}
          >
            Зарегистрировать вебхук
          </button>
        </div>
        {data?.max.webhookUrl ? (
          <p className="bots-hint">
            Цель: <code>{data.max.webhookUrl}</code>
          </p>
        ) : null}
      </section>
    </div>
  );
}
