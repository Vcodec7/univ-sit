import Link from 'next/link';
import { Building2, Landmark, Sparkles, Users } from 'lucide-react';
import GuestAuthPrompt from '@/components/GuestAuthPrompt';
import HomeHeroMedia from '@/components/HomeHeroMedia';
import { resolveHomeHeroPoster } from '@/lib/home-hero';

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

function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (needsAuth(href)) {
    return (
      <GuestAuthPrompt href={href} className={className} asButton>
        {children}
      </GuestAuthPrompt>
    );
  }
  return (
    <Link href={href} className={className} prefetch>
      {children}
    </Link>
  );
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
  const poster = resolveHomeHeroPoster(imageUrl);
  const video = (videoUrl || '').trim();
  const wantVideo = mediaKind === 'video' && Boolean(video);
  const brand = (siteName || 'Молодёжь Сочи').trim();
  const flags = { showSpaces, showClubs, showProjects, showEvents };
  const deck = DECK.filter((c) => flags[c.flag]);
  const extra =
    showEvents && primary?.href !== '/events' && secondary?.href !== '/events'
      ? { href: '/events', label: 'Афиша' }
      : null;
  const second = extra || secondary;

  return (
    <section className="lift-hero" aria-label="Главный баннер">
      <div className="lift-hero__stage">
        <HomeHeroMedia poster={poster} video={video} wantVideo={wantVideo} />
        <div className="lift-hero__veil" aria-hidden />
        <div className="lift-hero__glow" aria-hidden />
      </div>
      <div className="container lift-hero__copy">
        <p className="lift-hero__eyebrow">Чёрное море · Кавказ · {brand}</p>
        <h1 className="lift-hero__title">
          Старт с Сочи
          <span>к своим людям и проектам</span>
        </h1>
        <p className="lift-hero__lead">
          Залы, коворкинг, клубы и афиша — один портал, без десяти чатов.
        </p>
        <div className="lift-hero__cta">
          {primary ? (
            <CtaLink href={primary.href} className="lift-hero__btn lift-hero__btn--lime">
              {primary.label}
            </CtaLink>
          ) : null}
          {second ? (
            <CtaLink href={second.href} className="lift-hero__btn lift-hero__btn--ghost">
              {second.label}
            </CtaLink>
          ) : null}
        </div>
      </div>

      {deck.length > 0 ? (
        <div className="container lift-deck" role="navigation" aria-label="Сценарии портала">
          {deck.map((card) => {
            const Icon = card.icon;
            const inner = (
              <>
                <span className="lift-deck__glyph" aria-hidden>
                  <Icon size={18} />
                </span>
                <span className="lift-deck__kicker">
                  <Icon size={16} aria-hidden /> {card.kicker}
                </span>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
                <span className="lift-deck__go">Открыть</span>
              </>
            );
            return card.auth ? (
              <GuestAuthPrompt
                key={card.id}
                href={card.href}
                className="lift-deck__card"
                asButton
                title={card.title}
              >
                {inner}
              </GuestAuthPrompt>
            ) : (
              <Link key={card.id} href={card.href} className="lift-deck__card" prefetch aria-label={card.title}>
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
