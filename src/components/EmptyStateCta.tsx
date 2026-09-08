import Link from 'next/link';

type Props = {
  title: string;
  text: string;
  href: string;
  cta: string;
};

export default function EmptyStateCta({ title, text, href, cta }: Props) {
  return (
    <div className="yp-empty-cta">
      <svg className="yp-empty-cta__art" viewBox="0 0 120 80" aria-hidden>
        <rect x="8" y="18" width="104" height="50" rx="12" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="42" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M58 36 h36 M58 46 h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <strong>{title}</strong>
      <p>{text}</p>
      <Link href={href} className="btn btn-primary">
        {cta}
      </Link>
    </div>
  );
}
