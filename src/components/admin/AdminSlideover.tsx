'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AdminSlideover({
  titleId,
  title,
  kicker,
  subtitle,
  onClose,
  children,
  footer,
}: {
  titleId: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="admin-slideover" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="admin-slideover__backdrop" aria-label="Закрыть" onClick={onClose} />
      <aside className="admin-slideover__panel">
        <header className="admin-slideover__head">
          <div>
            {kicker ? <p className="admin-slideover__kicker">{kicker}</p> : null}
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="yp-modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>
        <div className="admin-slideover__body">{children}</div>
        {footer ? <footer className="admin-slideover__foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}
