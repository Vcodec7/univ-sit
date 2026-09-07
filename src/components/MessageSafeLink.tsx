'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { classifyLinkClient, type LinkRisk } from '@/lib/link-safety';

type Hit = { url: string; host: string; status: string };

function labelRisk(risk: LinkRisk, server?: string | null) {
  if (server === 'rkn') return 'Сайт в локальном списке ограничений. Лучше не открывать.';
  if (risk === 'blocked' || server === 'invalid') return 'Ссылку открывать нельзя.';
  if (risk === 'shortener' || server === 'shortener') return 'Сокращённая ссылка — не видно конечный адрес.';
  if (risk === 'suspicious' || server === 'suspicious') return 'Подозрительный адрес.';
  return 'Внешний сайт. Откройте, только если доверяете человеку в чате.';
}

export default function MessageSafeLink({
  href,
  children,
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const local = classifyLinkClient(href);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (local.risk === 'internal' && local.href) {
    return (
      <a className={className || 'msg-body-link'} href={local.href} rel="noopener noreferrer">
        {children || href}
      </a>
    );
  }

  const runCheck = async () => {
    setOpen(true);
    setChecking(true);
    try {
      const res = await fetch('/api/messages/link-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: local.href || href }),
      });
      const data = (await res.json().catch(() => null)) as { hits?: Hit[] } | null;
      const hit = data?.hits?.[0];
      setServerStatus(hit?.status || null);
    } catch {
      setServerStatus(null);
    } finally {
      setChecking(false);
    }
  };

  const blocked =
    local.risk === 'blocked' ||
    local.risk === 'suspicious' ||
    serverStatus === 'rkn' ||
    serverStatus === 'invalid' ||
    serverStatus === 'suspicious';
  const display = local.href || href;
  const host = local.host || 'неизвестный адрес';

  return (
    <>
      <button type="button" className={className || 'msg-body-link msg-body-link--gate'} onClick={() => void runCheck()}>
        {children || href}
      </button>
      {open ? (
        <div
          className="msg-link-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="msg-link-gate-title"
          onClick={() => setOpen(false)}
        >
          <div className="msg-link-gate__card" onClick={(e) => e.stopPropagation()}>
            <p className="msg-link-gate__kicker">
              <ShieldAlert size={16} aria-hidden /> Безопасный переход
            </p>
            <h2 id="msg-link-gate-title">Ссылка из чата</h2>
            <p className="msg-link-gate__host">{host}</p>
            <p className="msg-link-gate__url">{display}</p>
            <p className="msg-link-gate__verdict">
              {checking ? 'Проверяем адрес…' : labelRisk(local.risk, serverStatus)}
            </p>
            <ul className="msg-link-gate__tips">
              <li>Открывайте ссылки только от людей, которым доверяете.</li>
              <li>Не вводите пароль портала на чужом сайте.</li>
              <li>Сокращённые и «похожие» адреса часто ведут не туда.</li>
              <li>Если просят срочно перевести деньги или код из СМС — это обман.</li>
            </ul>
            <div className="msg-link-gate__actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Не открывать
              </button>
              {!blocked && !checking && local.href ? (
                <a
                  className="btn btn-primary"
                  href={local.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  Открыть сайт
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
