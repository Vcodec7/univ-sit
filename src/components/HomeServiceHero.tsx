import Link from 'next/link';
import { ArrowRight, Building2, CalendarPlus } from 'lucide-react';
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

/**
 * Hero: brand + short lead + media, then practical full-width CTAs.
 */
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
    <section className="svc-hero" aria-label="Главный баннер">
      <div className="container svc-hero__grid">
        <div className="svc-hero__copy">
          <p className="svc-hero__eyebrow">Официальный портал</p>
          <h1 className="svc-hero__title">{brand}</h1>
          <p className="svc-hero__lead">
            Свободные залы, коворкинг и афиша — без лишних шагов.
          </p>
        </div>

        <HomeHeroMedia poster={poster} video={video} wantVideo={wantVideo} />
      </div>

      {(primary || secondary) && (
        <div className="container svc-hero__actions svc-hero__actions--practical">
          {primary ? (
            needsAuth(primary.href) ? (
              <GuestAuthPrompt href={primary.href} className="btn btn-primary svc-hero__cta" asButton>
                <CalendarPlus size={18} aria-hidden />
                {primary.label}
              </GuestAuthPrompt>
            ) : (
              <Link href={primary.href} className="btn btn-primary svc-hero__cta" prefetch>
                <CalendarPlus size={18} aria-hidden />
                {primary.label}
              </Link>
            )
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="btn btn-secondary svc-hero__cta" prefetch>
              <Building2 size={18} aria-hidden />
              {secondary.label}
              <ArrowRight size={16} aria-hidden />
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
