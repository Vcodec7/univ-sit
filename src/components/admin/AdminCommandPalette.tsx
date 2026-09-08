'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { searchAdminCommands } from '@/lib/admin-commands';

type Props = {
  userRole: string;
  userPermissions: string[];
};

type Hit = { href: string; label: string; hint: string };

export default function AdminCommandPalette({ userRole, userPermissions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const items = useMemo(
    () => searchAdminCommands(q, userRole, userPermissions).slice(0, 24),
    [q, userRole, userPermissions]
  );

  useEffect(() => {
    if (!open) return;
    const qq = q.trim();
    if (qq.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      void fetch(`/api/admin/cmdk?q=${encodeURIComponent(qq)}`, { credentials: 'same-origin' })
        .then(async (r) => (r.ok ? r.json() : null))
        .then((d) => {
          const users = Array.isArray(d?.users)
            ? d.users.map((u: { id: string; name?: string; email?: string }) => ({
                href: `/admin/users/${u.id}`,
                label: u.name || u.email || 'Пользователь',
                hint: u.email || 'карточка',
              }))
            : [];
          const news = Array.isArray(d?.news)
            ? d.news.map((n: { id: string; title?: string }) => ({
                href: `/admin/news?edit=${n.id}`,
                label: n.title || 'Новость',
                hint: 'Редактировать новость',
              }))
            : [];
          setHits([...users, ...news]);
        })
        .catch(() => setHits([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        className="admin-cmdk-fab"
        aria-label="Поиск по панели"
        title="Ctrl+K / ⌘K"
        data-admin-cmdk-fab="1"
        onClick={() => setOpen(true)}
      >
        <Search size={18} />
      </button>
      {open ? (
        <div className="admin-cmdk" role="dialog" aria-modal="true" aria-label="Командная строка" data-admin-cmdk="1">
          <button type="button" className="admin-cmdk__backdrop" aria-label="Закрыть" onClick={() => setOpen(false)} />
          <Command className="admin-cmdk__box" shouldFilter={false} label="Поиск раздела">
            <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Новость, заявки, пользователь, журнал…" />
            <Command.List>
              <Command.Empty>Ничего не найдено</Command.Empty>
              {hits.length > 0 ? (
                <Command.Group heading="Найдено">
                  {hits.map((item) => (
                    <Command.Item key={item.href + item.label} value={item.label} onSelect={() => go(item.href)}>
                      <strong>{item.label}</strong>
                      <span>{item.hint}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              <Command.Group heading="Команды">
                {items.map((item) => (
                  <Command.Item
                    key={item.href + item.label}
                    value={item.label + ' ' + item.keywords}
                    onSelect={() => go(item.href)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      ) : null}
    </>
  );
}
