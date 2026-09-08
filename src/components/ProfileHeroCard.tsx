'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  Camera,
  Check,
  Compass,
  Copy,
  Crown,
  Eye,
  Flame,
  Gamepad2,
  Gauge,
  Handshake,
  Heart,
  Leaf,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Pencil,
  Phone,
  Puzzle,
  QrCode,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Ticket,
  User,
  UserCircle,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useVoice, useVoiceCopy } from '@/components/VoiceProvider';
import {
  ACHIEVEMENTS,
  type AchievementDef,
} from '@/lib/achievements';
import {
  SHOWCASE_MAX,
  parseShowcaseBadges,
  resolveShowcaseCodes,
  type UnlockedShowcase,
} from '@/lib/showcase-badges';
import { shouldShowLegalSub } from '@/lib/profile-display';
import { equippedLoadoutItems, shopFrameStyle } from '@/lib/eco-loadout';

const ICONS = {
  Sparkles,
  Ticket,
  QrCode,
  Shield,
  Users,
  Flame,
  Star,
  Heart,
  Mail,
  MapPin,
  Award,
  Zap,
  Crown,
  MessageCircle,
  Camera,
  Compass,
  CalendarCheck,
  Building2,
  Medal,
  Rocket,
  Eye,
  Gamepad2,
  Puzzle,
  Target,
  BookOpen,
  BadgeCheck,
  Briefcase,
  Leaf,
  Handshake,
} as const;

type AchItem = AchievementDef & {
  unlocked?: boolean;
  unlockedAt?: string | null;
};

export type ProfileStatKey = 'LEVEL' | 'AUTHORITY' | 'SOCIAL' | 'ECO';

type LevelMeta = {
  level: number;
  title: string;
  color: string;
  pct: number;
  blurb?: string;
  bandTitle?: string;
  bandId?: string;
  toNext?: number | null;
  nextReward?: { level: number; title: string; eco: number; perk: string } | null;
  prestige?: {
    star: number;
    seasonTitle: string;
    perk: string;
    pct: number;
    toNext: number;
    ecoReward: number;
  } | null;
};

type Props = {
  name: string | null | undefined;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  roleLabel?: string | null;
  image?: string | null;
  publicCode?: string | null;
  bio?: string | null;
  legend?: boolean;
  modernBadge?: boolean;
  showcaseStored?: string | null | string[];
  showcaseHref?: string;
  instructionsVersion?: string | null;
  instructionsCompletedAt?: string | null;
  authority?: number | null;
  authorityLabel?: string;
  social?: number;
  ecoPoints?: number;
  /** Parent-provided level — avoids a second /api/user/eco fetch */
  levelMeta?: LevelMeta | null;
  editHref?: string;
  settingsHref?: string;
  publicHref?: string;
  onEdit?: () => void;
  onEditBio?: () => void;
  onPreview?: () => void;
  onSettings?: () => void;
  onAvatarPick?: (file: File) => void;
  editSectionHref?: string;
  onShowcaseSaved?: (codes: string[]) => void;
  onStatClick?: (key: ProfileStatKey) => void;
  onPassClick?: () => void;
  showRatings?: boolean;
  showEco?: boolean;
  showShowcase?: boolean;
  /** Own cabinet: show full email and phone. Public views stay masked. */
  revealContacts?: boolean;
};

function BadgeIcon({ def, size = 12 }: { def: AchievementDef; size?: number }) {
  const Icon = ICONS[def.icon as keyof typeof ICONS] || Award;
  return <Icon size={size} strokeWidth={2.4} />;
}

export default function ProfileHeroCard({
  name,
  nickname,
  email,
  phone,
  roleLabel,
  image,
  publicCode,
  bio,
  legend,
  modernBadge,
  showcaseStored,
  showcaseHref = '/dashboard/showcase',
  instructionsVersion,
  instructionsCompletedAt,
  authority = null,
  authorityLabel,
  social = 50,
  ecoPoints = 0,
  levelMeta,
  editHref,
  settingsHref,
  publicHref,
  onEdit,
  onEditBio,
  onPreview,
  onSettings,
  onAvatarPick,
  editSectionHref = '/dashboard/edit',
  onShowcaseSaved,
  onStatClick,
  onPassClick,
  showRatings = true,
  showEco = true,
  showShowcase = true,
  revealContacts = true,
}: Props) {
  const emptyAch = useVoiceCopy('profile.empty.achievements', 'Пока нет открытых достижений');
  const { loadout } = useVoice();
  const equipped = useMemo(() => equippedLoadoutItems(loadout), [loadout]);
  const frameLook = shopFrameStyle(loadout.frame);
  const openEdit = onEdit || onEditBio;
  const [items, setItems] = useState<AchItem[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [achLoading, setAchLoading] = useState(true);
  const [gearOpen, setGearOpen] = useState(false);
  const saveLock = useRef(false);

  const loadAchievements = useCallback(() => {
    setAchLoading(true);
    fetch('/api/user/achievements?lite=1', { cache: 'no-store' })
      .then(async (r) => {
        const raw = await r.text();
        try {
          return JSON.parse(raw) as { items?: AchItem[] };
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (!data || !Array.isArray(data?.items)) {
          setItems([]);
          setCodes([]);
          return;
        }
        const all = data.items as AchItem[];
        setItems(all);
        const unlocked = all.filter((i) => i.unlocked);
        const unlockedMeta: UnlockedShowcase[] = unlocked.map((i) => ({
          code: i.code,
          unlockedAt: i.unlockedAt || null,
        }));
        const stored = parseShowcaseBadges(showcaseStored);
        // Explicit empty array in DB means user cleared; missing → defaults
        const hasStored =
          showcaseStored !== null &&
          showcaseStored !== undefined &&
          !(typeof showcaseStored === 'string' && !showcaseStored.trim());
        const resolved = hasStored
          ? resolveShowcaseCodes(stored, unlockedMeta)
          : resolveShowcaseCodes(null, unlockedMeta);
        setCodes(resolved);
      })
      .catch(() => undefined)
      .finally(() => setAchLoading(false));
  }, [showcaseStored]);

  useEffect(() => {
    let idle = 0;
    const start = () => loadAchievements();
    const ric = (window as Window & { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback;
    if (typeof ric === 'function') {
      idle = ric(start, { timeout: 1800 });
      return () => {
        if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
      };
    }
    const t = window.setTimeout(start, 350);
    return () => window.clearTimeout(t);
  }, [loadAchievements, instructionsVersion, instructionsCompletedAt]);

  const unlockedItems = useMemo(() => items.filter((i) => i.unlocked), [items]);
  const lockedItems = useMemo(() => items.filter((i) => !i.unlocked).slice(0, 12), [items]);
  const unlockedMeta = useMemo<UnlockedShowcase[]>(
    () => unlockedItems.map((i) => ({ code: i.code, unlockedAt: i.unlockedAt || null })),
    [unlockedItems]
  );

  const activeCodes = editing ? draft : codes;

  const defs = useMemo(
    () =>
      activeCodes
        .map((c) => unlockedItems.find((i) => i.code === c) || ACHIEVEMENTS.find((a) => a.code === c))
        .filter(Boolean) as AchievementDef[],
    [activeCodes, unlockedItems]
  );

  const startEdit = () => {
    setDraft([...codes]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft([...codes]);
    setEditing(false);
  };

  const toggleDraft = (code: string) => {
    setDraft((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= SHOWCASE_MAX) {
        toast.error(`Можно выбрать не больше ${SHOWCASE_MAX}`);
        return prev;
      }
      return [...prev, code];
    });
  };

  const saveDraft = async () => {
    if (saveLock.current) return;
    const cleaned = Array.from(
      new Set(draft.filter((c) => unlockedMeta.some((u) => u.code === c)))
    ).slice(0, SHOWCASE_MAX);
    saveLock.current = true;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showcaseBadges: cleaned }),
      });
      const raw = await res.text();
      let data: { message?: string; user?: { showcaseBadges?: string | string[] } } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.message || 'fail');
      const saved = parseShowcaseBadges(data?.user?.showcaseBadges ?? cleaned);
      setCodes(saved);
      setDraft(saved);
      setEditing(false);
      onShowcaseSaved?.(saved);
      toast.success(saved.length ? 'Значки сохранены' : 'Значки сняты');
    } catch (e) {
      toast.error(e instanceof Error && e.message !== 'fail' ? e.message : 'Не удалось сохранить значки');
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  };

  const displayName = nickname || name || 'Профиль';
  const showLegal = shouldShowLegalSub(nickname, name);
  const [stableImage, setStableImage] = useState(image || null);
  useEffect(() => {
    if (image) {
      setStableImage(image);
      try {
        if (publicCode) sessionStorage.setItem(`yp-avatar:${publicCode}`, image);
      } catch {
        /* ignore */
      }
    } else if (!stableImage && publicCode) {
      try {
        const cached = sessionStorage.getItem(`yp-avatar:${publicCode}`);
        if (cached) setStableImage(cached);
      } catch {
        /* ignore */
      }
    }
  }, [image, publicCode, stableImage]);
  const avatarStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const showHud = showRatings || showEco;
  const contactsBlock = email || phone || publicCode ? (
    <ul className="profile-hero__contacts">
      {email ? (
        <li>
          <Mail size={14} aria-hidden />
          {revealContacts ? <a href={`mailto:${email}`}>{email}</a> : <span>{email}</span>}
        </li>
      ) : null}
      {phone ? (
        <li>
          <Phone size={14} aria-hidden />
          {revealContacts ? <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a> : <span>{phone}</span>}
        </li>
      ) : null}
      {publicCode ? (
        <li>
          <button
            type="button"
            className="profile-hero__id"
            title="Скопировать публичный ID"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicCode);
                toast.success('ID скопирован');
              } catch {
                toast.error('Не удалось скопировать');
              }
            }}
          >
            ID {publicCode} <Copy size={11} />
          </button>
        </li>
      ) : null}
    </ul>
  ) : null;

  return (
    <section className={`profile-hero profile-hero--cabinet profile-hero--bento${legend ? ' is-legend' : ''}`}>
      <div className="profile-hero__zone-a">
        <div className="profile-hero__main">
          <div className="profile-hero__avatar-col">
            <div
              className={`profile-hero__avatar${onAvatarPick ? ' is-editable' : ''}${stableImage ? ' has-photo' : ' is-fallback'}`}
              title={frameLook ? 'Рамка из магазина' : undefined}
            >
              <div className="profile-hero__avatar-inner">
                {stableImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stableImage} alt="" style={avatarStyle} />
                ) : (
                  <span className="profile-hero__avatar-fallback">
                    {displayName.charAt(0).toUpperCase() || <User size={22} />}
                  </span>
                )}
                {onAvatarPick && !stableImage ? (
                  <span className="profile-hero__avatar-add">
                    <Camera size={16} aria-hidden />
                    Фото
                  </span>
                ) : null}
              </div>
              {onAvatarPick ? (
                <label className="profile-hero__avatar-edit" title="Добавить фото" aria-label="Добавить фото">
                  <Camera size={11} />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onAvatarPick(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
          <div className="profile-hero__meta">
            <div className="profile-hero__name-row">
              <h1 className="profile-hero__name">{displayName}</h1>
              {roleLabel ? <span className="profile-hero__role">{roleLabel}</span> : null}
            </div>
            {showLegal ? <p className="profile-hero__sub">{name}</p> : null}
            {bio ? <p className="profile-hero__bio">{bio}</p> : null}
            {!bio && openEdit ? (
              <button type="button" className="profile-hero__bio-cta" onClick={openEdit}>
                Добавьте пару слов о себе →
              </button>
            ) : null}
            {!bio && !openEdit ? (
              <a href={editSectionHref} className="profile-hero__bio-cta">
                Добавьте пару слов о себе →
              </a>
            ) : null}
          </div>
        </div>
        <div className="profile-hero__gear">
          <button
            type="button"
            className="profile-hero__tool is-icon"
            aria-label="Настройки"
            aria-expanded={gearOpen}
            onClick={() => setGearOpen((v) => !v)}
          >
            <Settings size={18} aria-hidden />
          </button>
          {gearOpen ? (
            <div className="profile-hero__gear-menu" role="menu">
              {openEdit ? (
                <button type="button" role="menuitem" onClick={() => { setGearOpen(false); openEdit(); }}>
                  <Pencil size={14} /> Правка
                </button>
              ) : (
                <a href={editSectionHref} role="menuitem">
                  <Pencil size={14} /> Правка
                </a>
              )}
              {contactsBlock ? (
                <details>
                  <summary>Контакты и ID</summary>
                  {contactsBlock}
                </details>
              ) : null}
              {onPreview ? (
                <button type="button" role="menuitem" onClick={() => { setGearOpen(false); onPreview(); }}>
                  <UserCircle size={14} /> Как видят
                </button>
              ) : publicHref ? (
                <Link href={publicHref} role="menuitem" onClick={() => setGearOpen(false)}>
                  <UserCircle size={14} /> Как видят
                </Link>
              ) : null}
              {onSettings ? (
                <button type="button" role="menuitem" onClick={() => { setGearOpen(false); onSettings(); }}>
                  <Settings size={14} /> Настройки
                </button>
              ) : settingsHref ? (
                <Link href={settingsHref} role="menuitem">
                  <Settings size={14} /> Настройки
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showHud ? (
        <div className="profile-hero__bento-b" aria-label="Пропуск, репутация и М-баллы">
          {onPassClick ? (
            <button type="button" className="profile-hero__meter is-qr" onClick={onPassClick}>
              <QrCode size={22} aria-hidden />
              <span>
                <small>QR-пропуск</small>
                <strong>Открыть</strong>
              </span>
            </button>
          ) : (
            <a className="profile-hero__meter is-qr" href="/dashboard?action=showQR#pass">
              <QrCode size={22} aria-hidden />
              <span>
                <small>QR-пропуск</small>
                <strong>QR</strong>
              </span>
            </a>
          )}
          <div className="profile-hero__bento-side">
            <button type="button" className="profile-hero__meter" onClick={() => onStatClick?.('AUTHORITY')}>
              <Shield size={14} aria-hidden />
              <span>
                <small>Репутация</small>
                <strong title={authorityLabel || undefined}>{authority == null ? '—' : `${authority}%`}</strong>
              </span>
            </button>
            {showEco ? (
              <button type="button" className="profile-hero__meter" onClick={() => onStatClick?.('ECO')}>
                <Leaf size={14} aria-hidden />
                <span>
                  <small>М-баллы</small>
                  <strong>{Number(ecoPoints || 0).toLocaleString('ru-RU')}</strong>
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showShowcase ? (
        <div className="profile-hero__showcase profile-hero__showcase--shelf profile-hero__zone-c">
          {levelMeta ? (
            <div className="profile-hero__progress" aria-label="Прогресс уровня">
              <div className="profile-hero__progress-label">
                Прогресс · ур. {levelMeta.level}
                {levelMeta.title ? ` · ${levelMeta.title}` : ''}
              </div>
              <div className="profile-hero__progress-bar">
                <span style={{ width: `${Math.max(4, Math.min(100, levelMeta.pct || 0))}%` }} />
              </div>
            </div>
          ) : null}
          <div className="profile-hero__showcase-head">
            <div className="profile-hero__showcase-label">
              Значки
              <span>
                {achLoading ? '…' : `${unlockedItems.length}`}
                {equipped.length ? ` · стиль ${equipped.length}` : ''}
              </span>
            </div>
            <div className="profile-hero__showcase-actions">
              <Link href="/dashboard/shop" className="profile-hero__edit-btn">
                Магазин
              </Link>
              <Link href={showcaseHref} className="profile-hero__edit-btn">
                Собрать
              </Link>
            </div>
          </div>
          <div className="profile-hero__showcase-body" aria-busy={achLoading}>
            {achLoading ? (
              <div className="profile-hero__showcase-skel" aria-hidden />
            ) : (
              <div className="profile-hero__selected" aria-label="Значки">
                {defs.map((def) => (
                  <span
                    key={def.code}
                    className="profile-hero__chip"
                    style={{ '--chip-accent': def.accent } as CSSProperties}
                    title={def.description}
                  >
                    <BadgeIcon def={def} size={13} />
                    {def.title}
                  </span>
                ))}
                {lockedItems.map((def) => (
                  <span
                    key={def.code}
                    className="profile-hero__chip is-locked"
                    title={def.description || 'Сходи ещё на мероприятия, чтобы разблокировать'}
                  >
                    <BadgeIcon def={def} size={13} />
                    {def.title}
                  </span>
                ))}
                {!defs.length && !lockedItems.length ? (
                  <p className="profile-hero__hint">{emptyAch}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
