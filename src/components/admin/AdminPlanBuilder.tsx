'use client';

import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

type Props = {
  name: string;
  title: string;
  addLabel: string;
  fields: Array<{ key: string; label: string; placeholder?: string }>;
  initialJson?: string | null;
  hint?: string;
};

/** Visual list editor that posts JSON through a hidden input (no raw JSON for staff). */
export default function AdminPlanBuilder({ name, title, addLabel, fields, initialJson, hint }: Props) {
  const parse = () => {
    try {
      const raw = JSON.parse(initialJson || '[]');
      return Array.isArray(raw) ? raw.map((row) => ({ ...Object.fromEntries(fields.map((f) => [f.key, ''])), ...row })) : [];
    } catch {
      return [];
    }
  };
  const [rows, setRows] = useState<Record<string, string>[]>(parse);

  const serialized = JSON.stringify(
    rows.filter((r) => fields.some((f) => String(r[f.key] || '').trim()))
  );

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div className="admin-plan-builder">
      <input type="hidden" name={name} value={serialized} />
      <div className="admin-plan-builder__head">
        <h3>{title}</h3>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setRows((p) => [...p, Object.fromEntries(fields.map((f) => [f.key, '']))])}
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      {hint ? <p className="admin-studio-hint">{hint}</p> : null}
      {rows.length === 0 ? <p className="admin-studio-hint">Пока пусто — добавьте первый пункт.</p> : null}
      <ul className="admin-plan-builder__list">
        {rows.map((row, i) => (
          <li key={i} className="admin-plan-builder__row">
            <div className="admin-plan-builder__move">
              <button type="button" aria-label="Выше" onClick={() => move(i, -1)}>
                <GripVertical size={14} />
              </button>
            </div>
            <div className="admin-plan-builder__fields">
              {fields.map((f) => (
                <label key={f.key}>
                  <span>{f.label}</span>
                  <input
                    value={row[f.key] || ''}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [f.key]: e.target.value } : r)))
                    }
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label="Удалить"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
