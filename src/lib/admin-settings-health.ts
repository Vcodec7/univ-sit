import { prisma } from '@/lib/prisma';
import { identityFromSettings, isLocalOrigin } from '@/lib/site-identity-shared';

export type SettingsHealthItem = { id: string; label: string; ok: boolean; href: string; group: 'core' | 'more' };

export async function getSettingsHealth() {
  const s = await prisma.siteSettings.findUnique({ where: { id: '1' } });
  const origin = identityFromSettings(s).publicOrigin;
  const urlOk = Boolean(s?.publicSiteUrl) || Boolean(origin && !isLocalOrigin(origin));
  const core: SettingsHealthItem[] = [
    { id: 'name', label: 'Название портала', ok: Boolean(s?.siteName), href: '/admin/settings?tab=general', group: 'core' },
    { id: 'logo', label: 'Логотип', ok: Boolean(s?.logoUrl), href: '/admin/settings?tab=general', group: 'core' },
    { id: 'url', label: 'Публичный адрес', ok: urlOk, href: '/admin/settings?tab=general', group: 'core' },
    {
      id: 'contact',
      label: 'Контакты',
      ok: Boolean(s?.contactEmail || s?.contactPhone),
      href: '/admin/settings?tab=appearance',
      group: 'core',
    },
  ];
  const more: SettingsHealthItem[] = [
    { id: 'social', label: 'Соцсети', ok: Boolean(s?.vkLink || s?.tgLink || s?.maxLink), href: '/admin/settings?tab=social', group: 'more' },
    { id: 'smtp', label: 'Почта', ok: Boolean(s?.smtpHost), href: '/admin/settings?tab=smtp', group: 'more' },
    { id: 'legal', label: '152-ФЗ / cookie', ok: true, href: '/admin/settings?tab=legal', group: 'more' },
  ];
  const [projects, clubs, pending] = await Promise.all([
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.club.count({ where: { status: 'ACTIVE' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
  ]);
  const filled = [...core, ...more].filter((i) => i.ok).length;
  return { core, more, filled, total: core.length + more.length, projects, clubs, pending };
}
