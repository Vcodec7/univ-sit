import { logAdminAction } from '@/lib/admin-audit';

/** Who gets a copy of site-structure changes (env, not the public admin UI). */
export function developerNotifyTargets() {
  const emails = [process.env.DEVELOPER_EMAIL, process.env.TECH_EMAIL]
    .map((x) => (x || '').trim().toLowerCase())
    .filter((x, i, a) => x.includes('@') && a.indexOf(x) === i);
  const extraChats = (process.env.DEVELOPER_TELEGRAM_CHAT_ID || '')
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  return { emails, extraChats };
}

export async function notifySiteChange(opts: {
  actorId: string;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  await logAdminAction({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    actorRole: opts.actorRole,
    action: opts.action,
    targetType: 'site',
    targetId: 'settings',
    detail: opts.detail || null,
  });

  const who = `${opts.actorEmail || opts.actorId} (${opts.actorRole || '?'})`;
  const keys = opts.detail ? Object.keys(opts.detail).slice(0, 24).join(', ') : '';
  const text = [
    'YoungPortal: изменение сайта',
    `действие: ${opts.action}`,
    `кто: ${who}`,
    keys ? `детали: ${JSON.stringify(opts.detail).slice(0, 1200)}` : '',
    `время: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  const { emails, extraChats } = developerNotifyTargets();
  try {
    if (emails.length) {
      const { sendEmail } = await import('@/lib/email');
      await Promise.all(
        emails.map((to) =>
          sendEmail(to, `[YoungPortal] ${opts.action}`, `<pre>${escapeHtml(text)}</pre>`).catch(() => null)
        )
      );
    }
  } catch (e) {
    console.warn('[site-change] email', (e as Error)?.message);
  }

  try {
    const { tgSend } = await import('@/lib/telegram');
    const r = await tgSend(escapeHtml(text));
    if (extraChats.length) {
      await tgSend(escapeHtml(text), extraChats);
    }
    if (!r.ok && !extraChats.length && !emails.length) {
      console.warn('[site-change] no developer notify channel configured (DEVELOPER_EMAIL / Telegram alerts)');
    }
  } catch (e) {
    console.warn('[site-change] telegram', (e as Error)?.message);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c));
}
