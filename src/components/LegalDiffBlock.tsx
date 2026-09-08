'use client';

import { useMemo, useState } from 'react';
import type { DiffLine } from '@/lib/legal-diff';

export default function LegalDiffBlock({
  lines,
}: {
  lines: DiffLine[];
}) {
  const [open, setOpen] = useState(true);
  const meaningful = useMemo(() => lines.filter((l) => l.type !== 'same').length, [lines]);
  if (!meaningful) return null;
  return (
    <div className="legal-diff">
      <button type="button" className="legal-diff__toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Скрыть, что изменилось' : 'Показать, что изменилось'}
      </button>
      {open ? (
        <div className="legal-diff__body" aria-label="Изменения документа">
          {lines.map((line, i) => (
            <p key={`${line.type}-${i}`} className={`legal-diff__line is-${line.type}`}>
              {line.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
