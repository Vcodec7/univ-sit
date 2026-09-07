'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function RknChatBlocklistPanel() {
  const [seed, setSeed] = useState<string[]>([]);
  const [extraText, setExtraText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/rkn-blocklist');
      const data = await res.json();
      if (!res.ok) return;
      setSeed(data.seed || []);
      setExtraText((data.extra || []).join('\n'));
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/rkn-blocklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostsText: extraText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Не сохранено');
      toast.success(`Сохранено доменов: ${(data.extra || []).length}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass" style={{ padding: '1rem', display: 'grid', gap: 10, marginTop: 16 }}>
      <h2 style={{ margin: 0, fontSize: '1.05rem' }}>База ссылок РКН для чата</h2>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
        Если в сообщении есть домен из списка — участник видит предупреждение, админы получают уведомление.
        Базовая выборка из публичного реестра (торренты / нелегальные зеркала). Свои домены — по одному на строку.
      </p>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
        Вшито: {seed.slice(0, 8).join(', ')}
        {seed.length > 8 ? ` и ещё ${seed.length - 8}` : ''}
      </p>
      <textarea
        value={extraText}
        onChange={(e) => setExtraText(e.target.value)}
        rows={8}
        placeholder="example-blocked.ru"
        style={{ width: '100%', font: 'inherit', borderRadius: 12, padding: '0.65rem 0.75rem' }}
      />
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()} style={{ justifySelf: 'start' }}>
        Сохранить список
      </button>
    </section>
  );
}
