import Link from 'next/link';
import { Building2, Landmark, Sparkles, Users } from 'lucide-react';
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
  showSpaces?: boolean;
  showClubs?: boolean;
  showProjects?: boolean;
  showEvents?: boolean;
};

function needsAuth(href: string) {
  return href.startsWith('/coworking') || href.includes('/book');
}

const DECK = [
  {
    id: 'halls',
    href: '/spaces',
    auth: false,
    icon: Landmark,
    kicker: 'Площадки',
    title: 'Залы',
    text: 'Встреча, концерт или сбор команды — слоты видно сразу.',
    flag: 'showSpaces' as const,
  },
  {
    id: 'cowork',
    href: '/coworking',
    auth: true,
    icon: Building2,
    kicker: 'Работа',
    title: 'Коворкинг',
    text: 'Час за столом: для себя или открытой группой.',
    flag: 'showSpaces' as const,
  },
  {
    id: 'clubs',
    href: '/clubs',
    auth: false,
    icon: Users,
    kicker: 'Люди',
    title: 'Клубы',
    text: 'Свои по интересу — каждую неделю, не разовый заход.',
    flag: 'showClubs' as const,
  },
  {
    id: 'projects',
    href: '/projects',
    auth: false,
    icon: Sparkles,
    kicker: 'Дело',
    title: 'Проекты',
    text: 'Команда, результат и строка в портфолио.',
    flag: 'showProjects' as const,
  },
];

/** Cinematic Sochi lift-off hero: media + huge type + product deck. */
export default function HomeServiceHero({
  siteName,
  imageUrl,
  videoUrl,
  mediaKind = 'image',
  primary,
  secondary,
  showSpaces = true,
  showClubs = true,
  showProjects = true,
  showEvents = true,
}: Props) {
  const poster = (imageUrl || '/brand/hero-cover.jpg').trim();
  const video = (videoUrl || '').trim();
  const wantVideo = mediaKind === 'video' && Boolean(video);
  const brand = (siteName || 'Молодёжь Сочи').trim();
  const flags = { showSpaces, showClubs, showProjects, showEvents };
  const deck = DECK.filter((c) => flags[c.flag]);

  return (
    <section className="lift-hero" aria-label="Главный баннер">
      <div className="lift-hero__stage">
        <HomeHeroMedia poster={poster} video={video} wantVideo={wantVideo} />
        <div className="lift-hero__veil" aria-hidden />
        <div className="lift-hero__glow" aria-hidden />
        <div className="container lift-hero__copy">
          <p className="lift-hero__eyebrow">Чёрное море · Кавказ · {brand}</p>
          <h1 className="lift-hero__title">
            Старт с Сочи
            <span>к своим людям и проектам</span>
          </h1>
          <p className="lift-hero__lead">
            Залы, коворкинг, клубы и афиша города — один портал, без десяти чатов и пустых «напиши организатору».
          </p>
          <div className="lift-hero__cta">
            {primary ? (
              needsAuth(primary.href) ? (
                <GuestAuthPrompt href={primary.href} className="lift-hero__btn lift-hero__btn--lime" asButton>
                  {primary.label}
                </GuestAuthPrompt>
              ) : (
                <Link href={primary.href} className="lift-hero__btn lift-hero__btn--lime" prefetch>
                  {primary.label}
                </Link>
              )
            ) : null}
            {secondary ? (
              needsAuth(secondary.href) ? (
                <GuestAuthPrompt href={secondary.href} className="lift-hero__btn lift-hero__btn--ghost" asButton>
                  {secondary.label}
                </GuestAuthPrompt>
              ) : (
                <Link href={secondary.href} className="lift-hero__btn lift-hero__btn--ghost" prefetch>
                  {secondary.label}
                </Link>
              )
            ) : null}
            {showEvents ? (
              <Link href="/events" className="lift-hero__btn lift-hero__btn--ghost" prefetch>
                Афиша
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {deck.length > 0 ? (
        <div className="container lift-deck" role="navigation" aria-label="Сценарии портала">
          {deck.map((card) => {
            const Icon = card.icon;
            const inner = (
              <>
                <span className="lift-deck__kicker">
                  <Icon size={16} aria-hidden /> {card.kicker}
                </span>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </>
            );
            return card.auth ? (
              <GuestAuthPrompt key={card.id} href={card.href} className="lift-deck__card" asButton>
                {inner}
              </GuestAuthPrompt>
            ) : (
              <Link key={card.id} href={card.href} className="lift-deck__card" prefetch>
                {inner}
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function HomeSochiStrip() {
  const moments = [
    {
      title: 'Море и город',
      text: 'Набережная, события на открытом воздухе и точки, куда можно дойти пешком.',
    },
    {
      title: 'Горы рядом',
      text: 'Выезды клубов, сборы команд и другой ритм — не только зал в центре.',
    },
    {
      title: 'Дом молодёжи',
      text: 'Точка сборки: бронь, коворкинг, парламент и понятные правила дома.',
    },
  ];
  return (
    <section className="lift-sochi" aria-labelledby="lift-sochi-title">
      <div className="container">
        <p className="lift-sochi__eyebrow">Собрано для Сочи</p>
        <h2 id="lift-sochi-title">Не абстрактный «молодёжный портал» — карта живого города</h2>
        <div className="lift-sochi__grid">
          {moments.map((m) => (
            <article key={m.title} className="lift-sochi__card">
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
