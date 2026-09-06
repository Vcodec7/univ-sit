import { Suspense } from 'react';
import HomeServiceHero, { HomeSochiStrip } from '@/components/HomeServiceHero';
import HomeGallery from '@/components/HomeGallery';
import { getSiteIdentity } from '@/lib/site-identity';
import { clubCover, projectCover, spaceCover } from '@/lib/theme-covers';
import { getHomeCatalog } from '@/lib/home-catalog';
import { formatRuDate } from '@/lib/format-date';
import { getModuleFlags } from '@/lib/module-flags';
import HomeGalleryAuth from '@/components/HomeGalleryAuth';
import AuthAfishaSection from '@/components/AuthAfishaSection';
import FreeNowSpaces from '@/components/FreeNowSpaces';
import UpcomingEvents from '@/components/UpcomingEvents';
import GovWidgetsSection from '@/components/GovWidgetsSection';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import NewsCoverImage from '@/components/NewsCoverImage';
import EntityCoverImage from '@/components/EntityCoverImage';
import NewsMediaBadge from '@/components/NewsMediaBadge';
import Link from 'next/link';
import { Metadata } from 'next';
import { ruCount } from '@/lib/catalog-query';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, publicOrigin } = await getSiteIdentity();
  return {
    title: { absolute: `${siteName} | Официальный портал` },
    description: `Официальный портал ${siteName}. Участвуй в проектах, находи единомышленников в клубах и бронируй пространства.`,
    alternates: { canonical: publicOrigin },
  };
}

export const revalidate = 60;
// Do not force-static: admin hero mediaKind must apply after deploy without a
// long stale bake that shows photo while DB says video.

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function Home() {
  const [{ latestProjects, latestClubs, latestSpaces, latestNews, siteSettings }, modules, { siteName }] =
    await Promise.all([getHomeCatalog(), getModuleFlags(), getSiteIdentity()]);
  const heroUrl = (siteSettings?.heroImageUrl || '').trim() || '/brand/hero-cover.jpg';
  // Both assets may be stored; display mode is exclusive (image | video).
  const heroVideo = (siteSettings?.heroVideoUrl || '').trim() || null;
  const storedKind = (siteSettings?.heroMediaKind || '').trim().toLowerCase();
  // Strictly follow admin radio: video only when kind is video AND a file exists.
  const heroMediaKind: 'image' | 'video' =
    storedKind === 'video' && Boolean(heroVideo) ? 'video' : 'image';
  const galleryPublic =
    modules.gallery !== false &&
    Boolean(siteSettings?.galleryHomepageEnabled) &&
    Boolean(siteSettings?.galleryPublicEnabled);
  const galleryAuthOnly =
    modules.gallery !== false &&
    Boolean(siteSettings?.galleryHomepageEnabled) &&
    !siteSettings?.galleryPublicEnabled;

  const showProjects = modules.projects !== false;
  const showClubs = modules.clubs !== false;
  const showSpaces = modules.spaces !== false;
  const showEvents = modules.events !== false;
  const showNews = modules.news !== false;
  const showDocuments = modules.documents !== false;

  const heroPrimary = showSpaces
        ? { href: '/spaces', label: 'Залы' }
    : showEvents
      ? { href: '/events', label: 'Записаться на событие' }
      : showProjects
        ? { href: '/projects', label: 'Проекты' }
        : null;
  const heroSecondary = showSpaces
    ? { href: '/coworking', label: 'Коворкинг' }
    : showEvents
      ? { href: '/events', label: 'Афиша' }
      : null;

  return (
    <div className="home-page home-page--lift">
      {heroMediaKind === 'image' ? (
        <link rel="preload" as="image" href={heroUrl} fetchPriority="high" />
      ) : null}
      <HomeServiceHero
        siteName={siteName}
        imageUrl={heroUrl}
        videoUrl={heroVideo}
        mediaKind={heroMediaKind === 'video' && heroVideo ? 'video' : 'image'}
        primary={heroPrimary}
        secondary={heroSecondary}
        faceUrls={latestSpaces.slice(0, 3).map((s, i) => spaceCover(s, i))}
        showSpaces={showSpaces}
        showClubs={showClubs}
        showProjects={showProjects}
        showEvents={showEvents}
      />
      <HomeSochiStrip />

      <div className="container home-sections">
        {showSpaces ? (
          <Suspense fallback={<div className="home-deferred-skel" aria-hidden />}>
            <FreeNowSpaces limit={6} />
          </Suspense>
        ) : null}

        {showProjects && (
        <section className="home-section">
          <div className="home-section-head">
            <div className="home-section-kicker">
              <h2 className="home-section-title">Свежие проекты</h2>
              {latestProjects.length ? (
                <p className="catalog-page-header__count">
                  {ruCount(latestProjects.length, 'проект', 'проекта', 'проектов')}
                </p>
              ) : null}
            </div>
            <Link href="/projects" className="home-section-link">
              Смотреть все <ArrowRight size={18} />
            </Link>
          </div>
          {latestProjects.length === 0 ? (
            <p className="home-empty">Пока нет опубликованных проектов.</p>
          ) : (
            <div className="home-feed-grid">
              {latestProjects.map((project, idx) => (
                <Link key={project.id} href={`/projects/${encodeURIComponent(project.id)}`} className="catalog-card">
                  <div className="catalog-img-wrap" style={{ position: 'relative' }}>
                    <EntityCoverImage
                      src={projectCover(project, idx)}
                      alt={project.title}
                      fallback={projectCover(project, idx + 3)}
                      className="catalog-img"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={idx < 2}
                    />
                  </div>
                  <div className="catalog-card-body">
                    <h3 className="catalog-card-title">{project.title}</h3>
                    <p className="line-clamp-3 catalog-card-text">{stripHtml(project.description)}</p>
                    <div className="catalog-card-meta">
                      <span>Открыт для заявок</span>
                      <span className="catalog-card-more">Подробнее</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        )}

        {showClubs && (
        <section className="home-section">
          <div className="home-section-head">
            <div className="home-section-kicker">
              <h2 className="home-section-title">Клубы по интересам</h2>
              {latestClubs.length ? (
                <p className="catalog-page-header__count">
                  {ruCount(latestClubs.length, 'клуб', 'клуба', 'клубов')}
                </p>
              ) : null}
            </div>
            <Link href="/clubs" className="home-section-link">
              Все клубы <ArrowRight size={18} />
            </Link>
          </div>
          {latestClubs.length === 0 ? (
            <p className="home-empty">Клубы скоро появятся в каталоге.</p>
          ) : (
            <div className="home-feed-grid">
              {latestClubs.map((club, idx) => (
                <Link key={club.id} href={`/clubs/${encodeURIComponent(club.id)}`} className="catalog-card">
                  <div className="catalog-img-wrap" style={{ position: 'relative' }}>
                    <EntityCoverImage
                      src={clubCover(club, idx)}
                      alt={club.title}
                      fallback={clubCover(club, idx + 3)}
                      className="catalog-img"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="catalog-card-body">
                    <h3 className="catalog-card-title">{club.title}</h3>
                    <p className="line-clamp-3 catalog-card-text">{stripHtml(club.description)}</p>
                    <div className="catalog-card-meta">
                      <span>
                        <Users size={16} /> Открыт для заявок
                      </span>
                      <span className="catalog-card-more">Подробнее</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        )}

        {showSpaces && (
        <section className="home-section">
          <div className="home-section-head">
            <div className="home-section-kicker">
              <h2 className="home-section-title">Пространства</h2>
              {latestSpaces.length ? (
                <p className="catalog-page-header__count">
                  {ruCount(latestSpaces.length, 'площадка', 'площадки', 'площадок')}
                </p>
              ) : null}
            </div>
            <Link href="/spaces" className="home-section-link">
              Все пространства <ArrowRight size={18} />
            </Link>
          </div>
          {latestSpaces.length === 0 ? (
            <p className="home-empty">Свободных пространств пока нет в каталоге.</p>
          ) : (
            <div className="home-feed-grid">
              {latestSpaces.map((space, idx) => (
                <article key={space.id} className="catalog-card catalog-card--hit" style={{ position: 'relative' }}>
                  <Link
                    href={`/spaces/${encodeURIComponent(space.id)}`}
                    className="catalog-card__hit-link"
                    aria-label={space.title}
                  />
                  <div className="catalog-img-wrap" style={{ position: 'relative' }}>
                    <EntityCoverImage
                      src={spaceCover(space, idx)}
                      alt={space.title}
                      fallback={spaceCover(space, idx + 3)}
                      className="catalog-img"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="catalog-card-body">
                    <h3 className="catalog-card-title">{space.title}</h3>
                    <p className="line-clamp-3 catalog-card-text">
                      {space.description ? stripHtml(space.description) : 'Молодёжная площадка для ваших событий'}
                    </p>
                    <div className="catalog-card-meta">
                      <span>
                        <MapPin size={16} /> {space.address || `до ${space.capacity} чел.`}
                      </span>
                      <span className="catalog-card-more">Подробнее</span>
                    </div>
                    <div className="catalog-card__interactive" style={{ marginTop: '0.65rem' }}>
                      <Link
                        href={`/spaces/${encodeURIComponent(space.id)}/book`}
                        className="btn btn-primary"
                        title="Забронировать зал"
                      >
                        Забронировать
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        )}

        {showEvents && (
        <section className="home-section">
          <div className="home-section-head">
            <div>
              <h2 className="home-section-title">Ближайшие мероприятия</h2>
              <p className="home-section-sub">События в молодёжных пространствах города</p>
            </div>
            <Link href="/events" className="home-section-link">
              Календарь <ArrowRight size={18} />
            </Link>
          </div>
          {siteSettings?.publicEventsVisibility ? (
            <Suspense fallback={<div className="home-deferred-skel" aria-hidden />}>
              <UpcomingEvents hideTitle compact withinDays={21} mode="carousel" />
            </Suspense>
          ) : (
            <AuthAfishaSection hideTitle />
          )}
        </section>
        )}

        {galleryPublic ? (
          <Suspense fallback={null}>
            <HomeGallery
              enabled
              orgGalleryJson={siteSettings?.orgGalleryJson}
              title="Деятельность портала"
            />
          </Suspense>
        ) : galleryAuthOnly ? (
          <HomeGalleryAuth homepageEnabled title="Деятельность портала" />
        ) : null}

        {showNews && (
        <section className="home-section">
          <div className="home-section-head">
            <div className="home-section-kicker">
              <h2 className="home-section-title">Новости</h2>
              {latestNews.length ? (
                <p className="catalog-page-header__count">
                  {ruCount(latestNews.length, 'новость', 'новости', 'новостей')}
                </p>
              ) : null}
            </div>
            <Link href="/news" className="home-section-link">
              Все новости <ArrowRight size={18} />
            </Link>
          </div>
          {latestNews.length === 0 ? (
            <p className="home-empty">Новостей пока нет — загляните позже.</p>
          ) : (
            <div className="home-feed-grid">
              {latestNews.map((item) => {
                const when = item.publishedAt || item.createdAt;
                const title = item.title?.trim() || stripHtml(item.text).slice(0, 80) || 'Новость';
                return (
                  <Link key={item.id} href={`/news/${item.id}`} className="catalog-card">
                    <div className="catalog-img-wrap" style={{ position: 'relative' }}>
                      <NewsCoverImage
                        src={item.imageUrl}
                        alt={title}
                        className="catalog-img"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <NewsMediaBadge hasVideo={!!item.videoEmbedUrl} />
                    </div>
                    <div className="catalog-card-body">
                      <h3 className="catalog-card-title">{title}</h3>
                      <p className="line-clamp-3 catalog-card-text">{stripHtml(item.text)}</p>
                      <div className="catalog-card-meta">
                        <span>
                          <Calendar size={16} />{' '}
                          {formatRuDate(when, { day: 'numeric', month: 'long' })}
                        </span>
                        <span className="catalog-card-more">Читать</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        )}

        <GovWidgetsSection
          enabled={Boolean(siteSettings?.govWidgetsEnabled)}
          title={siteSettings?.govWidgetsTitle || 'Госуслуги'}
          widgetsJson={siteSettings?.govWidgetsJson}
          variant="compact"
        />

        <section className="home-cta home-cta--split" aria-label="Два сценария">
          <div className="home-cta-split">
            <article>
              <p>Для себя</p>
              <h2>Сесть и сделать</h2>
              <p className="home-cta-text">Коворкинг на час, без переписки и без «есть ли место».</p>
              {showSpaces ? (
                <Link href="/coworking" className="lift-hero__btn lift-hero__btn--lime">
                  Записаться
                </Link>
              ) : (
                <Link href="/contacts" className="lift-hero__btn lift-hero__btn--lime">
                  Контакты
                </Link>
              )}
            </article>
            <article>
              <p>Командой</p>
              <h2>Собрать людей</h2>
              <p className="home-cta-text">Зал под встречу или проект, который видно в портфолио.</p>
              {showSpaces ? (
                <Link href="/spaces" className="lift-hero__btn lift-hero__btn--ghost">
                  К площадкам
                </Link>
              ) : showProjects ? (
                <Link href="/projects" className="lift-hero__btn lift-hero__btn--ghost">
                  К проектам
                </Link>
              ) : (
                <Link href="/contacts" className="lift-hero__btn lift-hero__btn--ghost">
                  Контакты
                </Link>
              )}
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
