import Link from 'next/link';

export type AdminTabItem = {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
  tone?: 'primary' | 'muted' | 'warning' | 'success' | 'danger';
};

/** Compact pill tabs for admin list filters (status / type). */
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
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            prefetch
            scroll={false}
            className={`admin-filter-tab${active ? ' is-active' : ''}${item.tone ? ` is-${item.tone}` : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <span className="admin-filter-tab__count">{item.count > 999 ? '999+' : item.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
