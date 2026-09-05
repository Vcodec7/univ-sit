import Link from 'next/link';
import { Building2, CalendarDays, CalendarPlus } from 'lucide-react';
import GuestAuthPrompt from '@/components/GuestAuthPrompt';
import HomeHeroMedia from '@/components/HomeHeroMedia';

type Cta = { href: string; label: string };

type Props = {
  siteName: string;
  imageUrl: string;
  videoUrl?: string | null;
  mediaKind?: 'image' | 'video';
  primary?: Cta | null;
  secondary?: Cta | null;
  faceUrls?: string[];
};

function needsAuth(href: string) {
  return href.startsWith('/coworking') || href.includes('/book');
}

/** Full-bleed banner: media + copy + CTAs in one frame. */
export default function HomeServiceHero({
  siteName,
  imageUrl,
  videoUrl,
  mediaKind = 'image',
  primary,
  secondary,
}: Props) {
  const poster = (imageUrl || '/brand/hero-cover.jpg').trim();
  const video = (videoUrl || '').trim();
  const wantVideo = mediaKind === 'video' && Boolean(video);
  const brand = (siteName || 'Молодёжь Сочи').trim();

  return (
    <section className="svc-hero svc-hero--banner" aria-label="Главный баннер">
      <HomeHeroMedia poster={poster} video={video} wantVideo={wantVideo} />
      <div className="svc-hero__overlay">
        <div className="container svc-hero__content">
          <div>
            <p className="svc-hero__eyebrow">Официальный портал</p>
            <h1 className="svc-hero__title">{brand}</h1>
            <p className="svc-hero__lead">
              Свободные залы, коворкинг и афиша — без лишних шагов.
            </p>
            {(primary || secondary) && (
              <div className="svc-hero__switch" role="navigation" aria-label="Быстрые действия на главной">
                {primary ? (
                  needsAuth(primary.href) ? (
                    <GuestAuthPrompt href={primary.href} className="svc-hero__switch-btn is-on" asButton>
                      <CalendarPlus size={18} aria-hidden />
                      {primary.label}
                    </GuestAuthPrompt>
                  ) : (
                    <Link href={primary.href} className="svc-hero__switch-btn is-on" prefetch>
                      <CalendarPlus size={18} aria-hidden />
                      {primary.label}
                    </Link>
                  )
                ) : null}
                {secondary ? (
                  needsAuth(secondary.href) ? (
                    <GuestAuthPrompt href={secondary.href} className="svc-hero__switch-btn" asButton>
                      <Building2 size={18} aria-hidden />
                      {secondary.label}
                    </GuestAuthPrompt>
                  ) : (
                    <Link href={secondary.href} className="svc-hero__switch-btn" prefetch>
                      <Building2 size={18} aria-hidden />
                      {secondary.label}
                    </Link>
                  )
                ) : null}
              </div>
            )}
            <Link href="/events" className="svc-hero__afisha" prefetch>
              <CalendarDays size={16} aria-hidden />
              Афиша
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
