import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export type Crumb = { href: string; label: string };

export function adminBreadcrumbs(pathname: string): Crumb[] {
  const path = (pathname || '/admin').split('?')[0];
  const crumbs: Crumb[] = [{ href: '/admin', label: 'Главная' }];
  if (path === '/admin') return crumbs;

  const match = ADMIN_NAV_ITEMS.filter((i) => i.href !== '/admin')
    .filter((i) => path === i.href || path.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) {
    crumbs.push({ href: match.href, label: match.label });
    if (path !== match.href) {
      const tail = path.slice(match.href.length).replace(/^\//, '');
      const last = tail.split('/').filter(Boolean).pop();
      if (last && last !== 'edit' && last !== 'new') {
        crumbs.push({ href: path, label: decodeURIComponent(last) });
      } else if (last === 'edit') {
        crumbs.push({ href: path, label: 'Редактирование' });
      } else if (last === 'new') {
        crumbs.push({ href: path, label: 'Создание' });
      }
    }
  }
  return crumbs;
}
