'use client';

import { useMemo, useState } from 'react';
import type { DiffLine } from '@/lib/legal-diff';

const LONG_DIFF = 12;

export default function LegalDiffBlock({
  lines,
}: {
  lines: DiffLine[];
}) {
  const changes = useMemo(() => lines.filter((l) => l.type !== 'same'), [lines]);
  const long = changes.length > LONG_DIFF;
  const [open, setOpen] = useState(!long);
  const [showContext, setShowContext] = useState(false);
  if (!changes.length) return null;
  const visible = showContext ? lines : changes;
  return (
    <div className="legal-diff">
      <button type="button" className="legal-diff__toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Скрыть, что изменилось' : 'Показать, что изменилось'}
      </button>
      {open ? (
        <>
          <div className="legal-diff__body" aria-label="Изменения документа">
            {visible.map((line, i) => (
              <p key={`${line.type}-${i}`} className={`legal-diff__line is-${line.type}`}>
                {line.text}
              </p>
            ))}
          </div>
          {lines.some((l) => l.type === 'same') ? (
            <button
              type="button"
              className="legal-diff__toggle legal-diff__toggle--ctx"
              onClick={() => setShowContext((v) => !v)}
            >
              {showContext ? 'Только добавления и удаления' : 'Показать полный текст'}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
