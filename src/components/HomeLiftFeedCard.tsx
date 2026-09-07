import type { ReactNode } from 'react';
import Link from 'next/link';

type Action = { href: string; label: string };

/** Homepage feed card in the same ink / lime language as «Сейчас свободно». */
export default function HomeLiftFeedCard({
  href,
  cover,
  badge,
  title,
  line,
  highlight,
  primary,
  secondary,
}: {
  href: string;
  cover: ReactNode;
  badge?: string;
  title: string;
  line?: string | null;
  highlight?: string | null;
  primary: Action;
  secondary?: Action | null;
}) {
  return (
    <article className="free-now-card yp-feed-card lift-feed-card">
      <Link href={href} className="lift-feed-card__media" aria-label={title}>
        <div className="free-now-avatar yp-feed-card__media">
          {cover}
          {badge ? <span className="free-now-badge">{badge}</span> : null}
        </div>
      </Link>
      <div className="free-now-body">
        <h3>{title}</h3>
        {line ? <p>{line}</p> : null}
        {highlight ? <strong className="free-now-slot">{highlight}</strong> : null}
        <div className="free-now-actions">
          {secondary ? (
            <Link href={secondary.href} className="lift-hero__btn lift-hero__btn--ghost">
              {secondary.label}
            </Link>
          ) : null}
          <Link href={primary.href} className="lift-hero__btn lift-hero__btn--lime">
            {primary.label}
          </Link>
        </div>
      </div>
    </article>
  );
}
