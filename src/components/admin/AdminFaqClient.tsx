'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminInterestStats from '@/components/admin/AdminInterestStats';

type FaqItemRow = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
  viewCount?: number;
};

type FaqCategoryRow = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  published: boolean;
  viewCount?: number;
  items: FaqItemRow[];
};

export default function AdminFaqClient() {
  const [categories, setCategories] = useState<FaqCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [draftQ, setDraftQ] = useState<Record<string, { q: string; a: string }>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/faq', { credentials: 'same-origin', cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.message || 'Не удалось загрузить FAQ');
        return;
      }
      const next = Array.isArray(data.categories) ? data.categories : [];
      setCategories(next);
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const api = async (method: string, body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/faq', {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.message || 'Ошибка сохранения');
        return data;
      }
      return data;
    } catch {
      setError('Ошибка сети');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const createCategory = async () => {
    const title = newCatTitle.trim();
    if (!title) return;
    const data = await api('POST', { kind: 'category', title });
    if (!data?.category) return;
    const row: FaqCategoryRow = {
      ...data.category,
      items: data.category.items || [],
    };
    setCategories((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
    setNewCatTitle('');
    setOpenId(row.id);
    setEditId(row.id);
    toast.success('Категория создана');
    void load(true);
  };

  const hasCats = categories.length > 0;

  return (
    <div className="admin-faq-page">
      <header className="admin-faq-page__head">
        <h1>FAQ — категории и вопросы</h1>
        <p>На одном экране: добавить тему, увидеть уже созданные и понять, что ищут посетители.</p>
      </header>

      {error ? (
        <p className="admin-faq-page__error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="admin-faq-block" aria-labelledby="faq-create-title">
        <h2 id="faq-create-title">Новая категория</h2>
        <div className="admin-faq-create-row">
          <input
            type="text"
            value={newCatTitle}
            onChange={(e) => setNewCatTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void createCategory();
              }
            }}
            placeholder="Например: Запись в коворкинг"
            className="settings-input"
          />
          <button type="button" className="btn btn-primary" disabled={busy || !newCatTitle.trim()} onClick={() => void createCategory()}>
            <Plus size={16} aria-hidden /> Добавить категорию
          </button>
          <button type="button" className="btn btn-secondary" disabled={busy || loading} onClick={() => void load(false)}>
            Обновить
          </button>
        </div>
      </section>

      <section className="admin-faq-block" aria-labelledby="faq-current-title">
        <h2 id="faq-current-title">Текущие категории</h2>
        {loading && !hasCats ? <p className="admin-studio-hint">Загрузка…</p> : null}
        {!loading && !hasCats ? (
          <div className="admin-faq-empty">Категорий пока нет — создайте первую.</div>
        ) : null}
        {hasCats ? (
          <ul className="admin-faq-cat-list">
            {categories.map((c) => {
              const open = openId === c.id;
              const editing = editId === c.id;
              return (
                <li key={c.id} className={`admin-faq-cat-card${open ? ' is-open' : ''}`} id={`faq-cat-${c.id}`}>
                  <div className="admin-faq-cat-card__top">
                    {editing ? (
                      <input
                        autoFocus
                        className="settings-input"
                        defaultValue={c.title}
                        onBlur={(e) => {
                          const title = e.target.value.trim();
                          setEditId(null);
                          if (title && title !== c.title) {
                            void api('PATCH', { kind: 'category', id: c.id, title }).then((d) => {
                              if (d?.category) {
                                setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, title } : x)));
                              }
                              void load(true);
                            });
                          }
                        }}
                      />
                    ) : (
                      <div>
                        <strong>{c.title}</strong>
                        <div className="admin-faq-cat-card__meta">
                          <span className={`admin-faq-status${c.published ? ' is-pub' : ''}`}>
                            {c.published ? 'Опубликована' : 'Черновик'}
                          </span>
                          <span>{c.items.length} вопр.</span>
                          {typeof c.viewCount === 'number' ? <span>{c.viewCount} просм.</span> : null}
                        </div>
                      </div>
                    )}
                    <div className="admin-faq-cat-card__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setEditId(c.id)}>
                        <Pencil size={14} /> Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setOpenId(open ? null : c.id)}
                      >
                        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
                        Открыть вопросы
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => {
                          if (!confirm(`Удалить категорию «${c.title}» и все вопросы?`)) return;
                          void api('DELETE', { kind: 'category', id: c.id }).then((d) => {
                            if (d?.ok !== false) {
                              setCategories((prev) => prev.filter((x) => x.id !== c.id));
                              if (openId === c.id) setOpenId(null);
                            }
                            void load(true);
                          });
                        }}
                      >
                        <Trash2 size={14} /> Удалить
                      </button>
                    </div>
                  </div>

                  {open ? (
                    <div className="admin-faq-questions">
                      <label className="admin-studio-hint">
                        <input
                          type="checkbox"
                          checked={c.published}
                          onChange={() =>
                            void api('PATCH', { kind: 'category', id: c.id, published: !c.published }).then(() => {
                              setCategories((prev) =>
                                prev.map((x) => (x.id === c.id ? { ...x, published: !c.published } : x))
                              );
                            })
                          }
                        />{' '}
                        Показывать на /faq
                      </label>
                      {c.items.length === 0 ? <p className="admin-studio-hint">Вопросов пока нет.</p> : null}
                      {c.items.map((item) => (
                        <div key={item.id} className="admin-faq-q">
                          <input
                            className="settings-input"
                            defaultValue={item.question}
                            onBlur={(e) => {
                              const question = e.target.value.trim();
                              if (question && question !== item.question) {
                                void api('PATCH', { kind: 'item', id: item.id, question });
                              }
                            }}
                          />
                          <textarea
                            className="settings-input"
                            rows={3}
                            defaultValue={item.answer}
                            onBlur={(e) => {
                              const answer = e.target.value.trim();
                              if (answer && answer !== item.answer) {
                                void api('PATCH', { kind: 'item', id: item.id, answer });
                              }
                            }}
                          />
                          <div className="admin-faq-q__row">
                            <small>{item.viewCount ?? 0} просм.</small>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => void api('PATCH', { kind: 'item', id: item.id, published: !item.published }).then(() => load(true))}
                            >
                              {item.published ? 'Опубликован' : 'Черновик'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                if (!confirm('Удалить вопрос?')) return;
                                void api('DELETE', { kind: 'item', id: item.id }).then(() => {
                                  setCategories((prev) =>
                                    prev.map((x) =>
                                      x.id === c.id ? { ...x, items: x.items.filter((i) => i.id !== item.id) } : x
                                    )
                                  );
                                });
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="admin-faq-q-new">
                        <input
                          className="settings-input"
                          placeholder="Новый вопрос"
                          value={(draftQ[c.id] || { q: '', a: '' }).q}
                          onChange={(e) =>
                            setDraftQ((s) => ({ ...s, [c.id]: { ...(s[c.id] || { q: '', a: '' }), q: e.target.value } }))
                          }
                        />
                        <textarea
                          className="settings-input"
                          rows={2}
                          placeholder="Ответ"
                          value={(draftQ[c.id] || { q: '', a: '' }).a}
                          onChange={(e) =>
                            setDraftQ((s) => ({ ...s, [c.id]: { ...(s[c.id] || { q: '', a: '' }), a: e.target.value } }))
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy || !(draftQ[c.id]?.q || '').trim() || !(draftQ[c.id]?.a || '').trim()}
                          onClick={() => {
                            const d = draftQ[c.id];
                            if (!d) return;
                            void api('POST', {
                              kind: 'item',
                              categoryId: c.id,
                              question: d.q.trim(),
                              answer: d.a.trim(),
                            }).then((res) => {
                              if (!res?.item) return;
                              setDraftQ((s) => ({ ...s, [c.id]: { q: '', a: '' } }));
                              setCategories((prev) =>
                                prev.map((x) => (x.id === c.id ? { ...x, items: [...x.items, res.item] } : x))
                              );
                            });
                          }}
                        >
                          <Save size={16} /> Добавить вопрос
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <AdminInterestStats compact faqOnly />
    </div>
  );
}
