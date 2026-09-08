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

export default function AdminCommandPalette({ userRole, userPermissions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

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

  const items = useMemo(() => searchAdminCommands(q, userRole, userPermissions).slice(0, 24), [q, userRole, userPermissions]);

  return (
    <>
      <button
        type="button"
        className="admin-cmdk-fab"
        aria-label="Поиск по панели"
        title="Ctrl+K"
        onClick={() => setOpen(true)}
      >
        <Search size={18} />
      </button>
      {open ? (
        <div className="admin-cmdk" role="dialog" aria-modal="true" aria-label="Командная строка">
          <button type="button" className="admin-cmdk__backdrop" aria-label="Закрыть" onClick={() => setOpen(false)} />
          <Command className="admin-cmdk__box" shouldFilter={false} label="Поиск раздела">
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              placeholder="Созд… новость, проект, заявки…"
            />
            <Command.List>
              <Command.Empty>Ничего не найдено</Command.Empty>
              {items.map((item) => (
                <Command.Item
                  key={item.href + item.label}
                  value={item.label}
                  onSelect={() => {
                    setOpen(false);
                    setQ('');
                    router.push(item.href);
                  }}
                >
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      ) : null}
    </>
  );
}
