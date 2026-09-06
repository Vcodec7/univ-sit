import Link from 'next/link';

export type AdminTabItem = {
  href?: string;
  onSelect?: () => void;
  label: string;
  count?: number;
  active?: boolean;
  tone?: 'primary' | 'muted' | 'warning' | 'success' | 'danger';
};

/** Compact pill tabs (links or buttons) — one horizontal row, scroll if needed. */
export default function AdminFilterTabs({
  items,
  ariaLabel = 'Фильтры',
}: {
  items: AdminTabItem[];
  ariaLabel?: string;
}) {
  return (
    <nav className="admin-filter-tabs" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = Boolean(item.active);
        const className = `admin-filter-tab${active ? ' is-active' : ''}${item.tone ? ` is-${item.tone}` : ''}`;
        const inner = (
          <>
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <span className="admin-filter-tab__count">{item.count > 999 ? '999+' : item.count}</span>
            ) : null}
          </>
        );
        if (item.href) {
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              prefetch
              scroll={false}
              className={className}
              aria-current={active ? 'page' : undefined}
            >
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            className={className}
            aria-current={active ? 'page' : undefined}
            onClick={() => item.onSelect?.()}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
