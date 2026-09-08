'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type ClauseProps = {
  legalText: string;
  simpleText: string;
  human?: boolean;
};

/** MDX/React clause: legal vs plain language. */
export function LegalClause({ legalText, simpleText, human = false }: ClauseProps) {
  return <p>{human ? simpleText : legalText}</p>;
}

export function LegalHumanProvider({
  children,
  human,
}: {
  children: ReactNode;
  human: boolean;
}) {
  void human;
  return <>{children}</>;
}

export default function LegalDiffBlock({
  lines,
}: {
  lines: { type: 'same' | 'add' | 'del'; text: string }[];
}) {
  const [open, setOpen] = useState(true);
  const meaningful = useMemo(
    () => lines.filter((l) => l.type !== 'same').length,
    [lines]
  );
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
