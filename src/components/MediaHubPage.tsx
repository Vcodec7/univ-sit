import Link from 'next/link';
import { Camera, Clapperboard, ExternalLink, Megaphone, Newspaper } from 'lucide-react';
import { publicCmsLead, publicCmsTitle } from '@/lib/cms-page-copy';
import { MEDIA_FORMATS, MEDIA_PARTNERS, MEDIA_STEPS } from '@/lib/media-hub';

type Page = {
  slug?: string;
  title: string;
  content: string;
  images?: string;
};

export default function MediaHubPage({
  page,
  siteName = '',
  publicOrigin = '',
}: {
  page: Page;
  siteName?: string;
  publicOrigin?: string;
}) {
  const heading = publicCmsTitle(page.slug, page.title);
  const lead = publicCmsLead(page.slug);
  const cover = page.images && page.images !== '[]' ? page.images : '/covers/project-media.svg';

  return (
    <div className="media-hub">
      <header className="media-hub__hero" style={{ backgroundImage: `url(${cover})` }}>
        <div className="media-hub__veil" aria-hidden />
        <div className="container media-hub__hero-inner">
          <p className="media-hub__kicker">
            <Clapperboard size={16} aria-hidden /> Медиацентр{siteName ? ` · ${siteName}` : ''}
          </p>
          <h1>{heading}</h1>
          <p className="media-hub__lead">{lead}</p>
          <div className="media-hub__cta">
            <a className="btn btn-primary" href="https://vk.ru/crm.sochi" target="_blank" rel="noopener noreferrer">
              Написать в группу
            </a>
            <Link className="btn btn-secondary" href="/contacts">
              Контакты Центра
            </Link>
          </div>
        </div>
      </header>

      <div className="container media-hub__body">
        <section className="media-hub__section">
          <h2>Партнёры и площадки</h2>
          <p className="media-hub__section-lead">
            Не отдельный «сайт в сайте», а сетка: всероссийская премия, группа VK и запуски Центра. Заявки на «ШУМ» —
            на сайте премии, съёмки и блоги — у нас.
          </p>
          <div className="media-hub__partners">
            {MEDIA_PARTNERS.map((p) => {
              const inner = (
                <>
                  <span className={`media-hub__badge media-hub__badge--${p.kind}`}>{p.role}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  <span className="media-hub__more">
                    {p.cta}
                    {p.external ? <ExternalLink size={14} aria-hidden /> : null}
                  </span>
                </>
              );
              if (p.external) {
                return (
                  <a key={p.id} className="media-hub__card" href={p.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                );
              }
              return (
                <Link key={p.id} className="media-hub__card" href={p.href}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="media-hub__section">
          <h2>Чем можно заняться</h2>
          <div className="media-hub__formats">
            {MEDIA_FORMATS.map((f) => (
              <article key={f.title} className="media-hub__format">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="media-hub__section media-hub__steps-wrap">
          <h2>Как войти в команду</h2>
          <ol className="media-hub__steps">
            {MEDIA_STEPS.map((s) => (
              <li key={s.n}>
                <span aria-hidden>{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="media-hub__links">
          <Link href="/news" className="media-hub__link-pill">
            <Newspaper size={16} /> Новости
          </Link>
          <Link href="/gallery" className="media-hub__link-pill">
            <Camera size={16} /> Галерея
          </Link>
          <Link href="/projects" className="media-hub__link-pill">
            <Megaphone size={16} /> Проекты
          </Link>
        </section>
      </div>
    </div>
  );
}
