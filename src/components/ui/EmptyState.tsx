import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'Записей пока нет',
  hint,
  action,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="yp-empty" role="status">
      <Inbox size={36} aria-hidden className="yp-empty__icon" />
      <h3 className="yp-empty__title">{title}</h3>
      {hint ? <p className="yp-empty__hint">{hint}</p> : null}
      {action ? <div className="yp-empty__action">{action}</div> : null}
    </div>
  );
}
