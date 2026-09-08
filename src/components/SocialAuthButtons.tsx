'use client';

import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export type SocialAuthFlags = {
  vk?: boolean;
  yandex?: boolean;
  telegram?: boolean;
  telegramBot?: string;
  esia?: boolean;
};

const DISCLAIMER =
  'Авторизуясь, вы подтверждаете, что вам исполнилось 14 лет, и соглашаетесь с Политикой конфиденциальности';

export default function SocialAuthButtons({
  oauth,
  callbackUrl,
  showEsia = false,
}: {
  oauth: SocialAuthFlags;
  callbackUrl: string;
  showEsia?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hasAny = Boolean(oauth.vk || oauth.yandex || oauth.telegram || (showEsia && oauth.esia));

  useEffect(() => {
    if (!oauth.telegram || !oauth.telegramBot || !hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = '';
    (window as unknown as { TelegramLoginWidget?: { dataOnauth?: (u: Record<string, string>) => void } }).TelegramLoginWidget =
      {
        dataOnauth: (user) => {
          void signIn('telegram', {
            redirect: true,
            callbackUrl,
            payload: JSON.stringify(user),
          });
        },
      };
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', oauth.telegramBot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    host.appendChild(script);
    return () => {
      host.innerHTML = '';
    };
  }, [oauth.telegram, oauth.telegramBot, callbackUrl]);

  if (!hasAny) return null;

  return (
    <div className="yp-sso">
      <p className="yp-sso__or">или войти через соцсеть</p>
      <div className="yp-sso__grid">
        {oauth.vk ? (
          <button type="button" className="btn btn-secondary yp-sso__btn" onClick={() => void signIn('vk', { callbackUrl })}>
            Войти через VK
          </button>
        ) : null}
        {oauth.yandex ? (
          <button
            type="button"
            className="btn btn-secondary yp-sso__btn"
            onClick={() => void signIn('yandex', { callbackUrl })}
          >
            Войти через Яндекс
          </button>
        ) : null}
        {oauth.telegram && oauth.telegramBot ? <div ref={hostRef} className="yp-sso__tg" /> : null}
        {showEsia && oauth.esia ? (
          <button type="button" className="btn btn-secondary yp-sso__btn" onClick={() => void signIn('esia', { callbackUrl })}>
            Войти через Госуслуги
          </button>
        ) : null}
      </div>
      <p className="yp-sso__legal">
        {DISCLAIMER}{' '}
        <Link href="/privacy" target="_blank" rel="noreferrer">
          Политика
        </Link>
        .
      </p>
    </div>
  );
}
