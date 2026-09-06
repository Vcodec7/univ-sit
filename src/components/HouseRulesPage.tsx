import Link from 'next/link';
import {
  CalendarDays,
  Camera,
  ClipboardList,
  ExternalLink,
  FileText,
  Hash,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react';
import { publicCmsLead, publicCmsTitle } from '@/lib/cms-page-copy';
import { HOUSE_LINKS, HOUSE_RULES, HOUSE_VENUE } from '@/lib/house-rules';

const RULE_ICONS = {
  staff: ClipboardList,
  signup: CalendarDays,
  limit: Users,
  media: Camera,
} as const;

const LINK_ICONS = {
  tg: MessageCircle,
  vk: Hash,
  docs: FileText,
  afisha: CalendarDays,
} as const;

type Page = { slug?: string; title: string; images?: string | null };

export default function HouseRulesPage({ page, siteName = '' }: { page: Page; siteName?: string }) {
  const heading = publicCmsTitle(page.slug, page.title);
  const lead = publicCmsLead(page.slug);
  const cover =
    page.images && page.images !== '[]' ? page.images : '/covers/photo/sochi-navaginskaya.jpg';

  return (
    <div className="house-rules">
      <header className="house-rules__hero" style={{ backgroundImage: `url(${cover})` }}>
        <div className="house-rules__veil" aria-hidden />
        <div className="container house-rules__hero-inner">
          <p className="house-rules__kicker">{siteName || 'Центр развития молодёжи'}</p>
          <h1>{heading}</h1>
          <p className="house-rules__lead">{lead}</p>
          <div className="house-rules__cta">
            <a className="btn btn-primary" href={HOUSE_LINKS[0].href} target="_blank" rel="noopener noreferrer">
              Памятка в Telegram
            </a>
            <Link className="btn btn-secondary" href="/documents">
              Документы
            </Link>
          </div>
        </div>
      </header>

      <div className="container house-rules__body">
        <div className="house-rules__grid">
          <section>
            <h2>Кратко</h2>
            <div className="house-rules__cards">
              {HOUSE_RULES.map((r) => {
                const Icon = RULE_ICONS[r.id];
                return (
                  <article key={r.id} className="house-rules__card">
                    <span className="house-rules__icon" aria-hidden>
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3>{r.title}</h3>
                      <p>{r.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="house-rules__aside">
            <div className="house-rules__venue">
              <MapPin size={18} aria-hidden />
              <div>
                <strong>{HOUSE_VENUE.title}</strong>
                <p>{HOUSE_VENUE.address}</p>
                <p className="house-rules__muted">{HOUSE_VENUE.also}</p>
              </div>
            </div>
            <p className="house-rules__max">
              {HOUSE_VENUE.maxHint}: <strong>{HOUSE_VENUE.max}</strong>
            </p>
            <h2>Где ещё лежит текст</h2>
            <ul className="house-rules__links">
              {HOUSE_LINKS.map((l) => {
                const Icon = LINK_ICONS[l.id];
                const inner = (
                  <>
                    <Icon size={16} aria-hidden />
                    <span>
                      <strong>{l.title}</strong>
                      {l.text}
                    </span>
                    <em>
                      {l.cta}
                      {l.external ? <ExternalLink size={12} aria-hidden /> : null}
                    </em>
                  </>
                );
                return (
                  <li key={l.id}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {inner}
                      </a>
                    ) : (
                      <Link href={l.href}>{inner}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link href="/contacts" className="house-rules__contacts">
              Все контакты Центра
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
