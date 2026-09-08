'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type SiteStatus = {
  publicSiteUrl: string;
  effectiveOrigin: string;
  oauth?: { vk?: boolean; yandex?: boolean; telegram?: boolean; esia?: boolean; telegramBot?: string };
  sso?: {
    yandexClientId?: string;
    vkClientId?: string;
    telegramBotUsername?: string;
    hasYandexSecret?: boolean;
    hasVkSecret?: boolean;
    hasTelegramToken?: boolean;
  };
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
  const [yandexId, setYandexId] = useState('');
  const [yandexSecret, setYandexSecret] = useState('');
  const [vkId, setVkId] = useState('');
  const [vkSecret, setVkSecret] = useState('');
  const [tgToken, setTgToken] = useState('');
  const [tgUser, setTgUser] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/ops/site', { cache: 'no-store' });
    const d = (await r.json()) as SiteStatus & { message?: string };
    if (!r.ok) throw new Error(d.message || 'Нет доступа');
    setData(d);
    setOrigin(d.publicSiteUrl || d.effectiveOrigin || '');
    setYandexId(d.sso?.yandexClientId || '');
    setVkId(d.sso?.vkClientId || '');
    setTgUser(d.sso?.telegramBotUsername || '');
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
      setYandexSecret('');
      setVkSecret('');
      setTgToken('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const originBase = (data?.effectiveOrigin || origin || 'https://ty.idivles.ru').replace(/\/$/, '');
  let hostOnly = 'ty.idivles.ru';
  try {
    hostOnly = new URL(originBase).hostname;
  } catch {
    /* keep default */
  }

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
      <section className="ops-site__card">
        <h2>SSO (VK / Яндекс / Telegram)</h2>
        <p className="bots-muted">
          Сейчас на /login: VK {data?.oauth?.vk ? 'вкл' : 'выкл'} · Яндекс{' '}
          {data?.oauth?.yandex ? 'вкл' : 'выкл'} · Telegram {data?.oauth?.telegram ? 'вкл' : 'выкл'}
          {data?.sso?.telegramBotUsername ? ` (@${data.sso.telegramBotUsername})` : ''}.
        </p>
        <ol className="bots-hint" style={{ paddingLeft: '1.2rem' }}>
          <li>
            Создайте приложения:{' '}
            <a href="https://oauth.yandex.ru/" target="_blank" rel="noreferrer">
              Яндекс
            </a>
            ,{' '}
            <a href="https://id.vk.com/" target="_blank" rel="noreferrer">
              VK ID
            </a>
            , бот в Telegram (BotFather).
          </li>
          <li>
            В кабинетах укажите Redirect URI ровно так:
            <br />
            <code>{originBase}/api/auth/callback/yandex</code>
            <br />
            <code>{originBase}/api/auth/callback/vk</code>
            <br />
            Для Telegram в BotFather: <code>/setdomain</code> → хост{' '}
            <code>{hostOnly}</code> (без https).
          </li>
          <li>Вставьте ID и секреты ниже и нажмите «Сохранить SSO».</li>
          <li>
            Откройте <a href="/login">/login</a> — кнопки появятся сразу. Пересоздавать контейнер web не
            нужно.
          </li>
        </ol>
        <p className="bots-hint">
          Публичный HTTPS выше должен совпадать с адресом сайта (ty или py). Если OAuth ругается на
          redirect_uri — проверьте, что в кабинете Яндекса/VK тот же хост, что в «Адрес сайта».
        </p>
        <label>
          Яндекс Client ID
          <input
            className="settings-input"
            autoComplete="off"
            value={yandexId}
            onChange={(e) => setYandexId(e.target.value)}
          />
        </label>
        <label>
          Яндекс Client Secret {data?.sso?.hasYandexSecret ? '(задан, пусто — не менять)' : ''}
          <input
            className="settings-input"
            type="password"
            autoComplete="off"
            value={yandexSecret}
            onChange={(e) => setYandexSecret(e.target.value)}
          />
        </label>
        <label>
          VK Client ID
          <input
            className="settings-input"
            autoComplete="off"
            value={vkId}
            onChange={(e) => setVkId(e.target.value)}
          />
        </label>
        <label>
          VK Client Secret {data?.sso?.hasVkSecret ? '(задан, пусто — не менять)' : ''}
          <input
            className="settings-input"
            type="password"
            autoComplete="off"
            value={vkSecret}
            onChange={(e) => setVkSecret(e.target.value)}
          />
        </label>
        <label>
          Telegram username бота (без @)
          <input
            className="settings-input"
            autoComplete="off"
            value={tgUser}
            onChange={(e) => setTgUser(e.target.value)}
            placeholder="MyPortalBot"
          />
        </label>
        <label>
          Telegram Bot Token {data?.sso?.hasTelegramToken ? '(задан, пусто — не менять)' : ''}
          <input
            className="settings-input"
            type="password"
            autoComplete="off"
            value={tgToken}
            onChange={(e) => setTgToken(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="bots-btn bots-btn--primary"
          disabled={busy === 'saveSso'}
          onClick={() =>
            void post('saveSso', {
              yandexClientId: yandexId,
              yandexClientSecret: yandexSecret,
              vkClientId: vkId,
              vkClientSecret: vkSecret,
              telegramBotUsername: tgUser,
              telegramBotToken: tgToken,
            })
          }
        >
          Сохранить SSO
        </button>
      </section>
    </div>
  );
}
