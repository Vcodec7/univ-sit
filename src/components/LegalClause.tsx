'use client';

import { useEffect, type ReactNode } from 'react';
import { useLegalHuman } from '@/components/LegalHumanContext';

export type LegalClauseProps = {
  id: string;
  title: string;
  legalText?: string;
  simpleText: string;
  children?: ReactNode;
};

/** MDX clause: тумблер «человеческий язык» выбирает simpleText или legalText. */
export function LegalClause({ id, title, legalText, simpleText, children }: LegalClauseProps) {
  const { human, hitId, register } = useLegalHuman();
  const legal =
    legalText ||
    (typeof children === 'string'
      ? children
      : Array.isArray(children)
        ? children.join('')
        : '');

  useEffect(() => {
    register({ id, title, legalText: String(legal), simpleText });
  }, [id, title, legal, simpleText, register]);

  return (
    <section id={id} className={hitId === id ? 'legal-flash legal-clause' : 'legal-clause'}>
      <h2>{title}</h2>
      <p>{human ? simpleText : legal}</p>
    </section>
  );
}

export default LegalClause;
