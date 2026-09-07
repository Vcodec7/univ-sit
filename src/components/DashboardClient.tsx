'use client';

import { useSafeSearchParams } from '@/lib/use-safe-search-params';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { User, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import EventSoonNotifier from '@/components/EventSoonNotifier';
import TagPicker from '@/components/TagPicker';
import { collectDeviceFingerprint } from '@/lib/device-fingerprint';
import ProfileHeroCard from '@/components/ProfileHeroCard';
import PersonalQrPanel from '@/components/PersonalQrPanel';
import CoworkingCabinetList from '@/components/CoworkingCabinetList';
import { zodiacFromDate } from '@/lib/profile-meta';
import {
  QUICK_ACCESS_TUTORIAL_DONE_EVENT,
} from '@/lib/quick-access';
import { fetchPublicStatusCached } from '@/lib/public-status-client';
import { fetchProfileCached, fetchEcoCached } from '@/lib/user-data-client';
import { cabinetGet, readCabinetJson } from '@/lib/cabinet-fetch';
import { roleLabelRu } from '@/lib/role-labels';
import CabinetMenu from '@/components/CabinetMenu';

const ProfilePreviewModal = dynamic(() => import('@/components/ProfilePreviewModal'), { ssr: false });
const PersonalGalleryEditor = dynamic(() => import('@/components/PersonalGalleryEditor'), { ssr: false });
const ReputationHistoryModal = dynamic(() => import('@/components/ReputationHistoryModal'), { ssr: false });

export type DashboardView = 'overview' | 'edit';

type DashboardClientProps = {
  view?: DashboardView;
  /** Sidebar already provided by CabinetShell. */
  embedded?: boolean;
};

function DashboardInner({ view = 'overview', embedded = false }: DashboardClientProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const [participations, setParticipations] = useState<any[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState<{
    id?: string;
    publicCode?: string | null;
    nickname?: string | null;
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    socialScore?: number;
    ecoPoints?: number;
    reliabilityScore?: number;
    reliabilityPercent?: number | null;
    reliabilityLabel?: string;
    attendedCount?: number;
    noShowCount?: number;
    privacyAcceptedAt?: string | null;
    privacyFirstAcceptedAt?: string | null;
    privacyRefusedAt?: string | null;
    privacyPolicyVersion?: string | null;
    privacySignature?: string | null;
    cookiesAcceptedAt?: string | null;
    cookiesPolicyVersion?: string | null;
    cookiesSignature?: string | null;
    rulesAcceptedAt?: string | null;
    rulesPolicyVersion?: string | null;
    rulesSignature?: string | null;
    deletionRequestedAt?: string | null;
    deletionEffectiveAt?: string | null;
    birthDate?: string | null;
    gender?: 'MALE' | 'FEMALE' | null;
    bio?: string | null;
    city?: string | null;
    about?: string | null;
    hobbies?: string[];
    interests?: string[];
    zodiac?: string | null;
    instructionsVersion?: string | null;
    instructionsCompletedAt?: string | null;
    showcaseBadges?: string[] | null;
    profileVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
    friendInviteToken?: string | null;
    steamUrl?: string | null;
    vkUrl?: string | null;
    telegramUrl?: string | null;
    telegramChatId?: string | null;
    maxUserId?: string | null;
    maxUrl?: string | null;
  } | null>(null);
  const [profileHobbies, setProfileHobbies] = useState<string[]>([]);
  const [profileInterests, setProfileInterests] = useState<string[]>([]);
  const [profileBirthDate, setProfileBirthDate] = useState('');
  const [profileGender, setProfileGender] = useState<'' | 'MALE' | 'FEMALE'>('');
  const [profileVisibility, setProfileVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [onlineVisibility, setOnlineVisibility] = useState<'FRIENDS' | 'PUBLIC' | 'HIDDEN'>('FRIENDS');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState('');
  const [achievementLegend, setAchievementLegend] = useState(false);
  const [modernUserBadge, setModernUserBadge] = useState(false);
  const [repModalOpen, setRepModalOpen] = useState(false);
  const [repModalTab, setRepModalTab] = useState<'LEVEL' | 'AUTHORITY' | 'SOCIAL' | 'ECO'>('AUTHORITY');
  const [passOpen, setPassOpen] = useState(false);
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean> | null>(null);
  const [levelMeta, setLevelMeta] = useState<{
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
  }>({
    level: 1,
    title: 'Новичок',
    color: '#94a3b8',
    pct: 0,
  });
  const modOn = useCallback(
    (key: string) => moduleFlags == null || moduleFlags[key] !== false,
    [moduleFlags]
  );
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const setEcoBalance = useCallback((ecoPoints: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.ecoPoints === ecoPoints) return prev;
      return { ...prev, ecoPoints };
    });
  }, []);
  const openRepModal = (tab: 'LEVEL' | 'AUTHORITY' | 'SOCIAL' | 'ECO') => {
    setRepModalTab(tab);
    setRepModalOpen(true);
  };
  const openPass = () => setPassOpen(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#pass') setPassOpen(true);
    const onHash = () => {
      if (window.location.hash === '#pass') setPassOpen(true);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    fetchPublicStatusCached()
      .then((d) => {
        if (d?.modules && typeof d.modules === 'object') setModuleFlags(d.modules as Record<string, boolean>);
        else setModuleFlags({});
      })
      .catch(() => setModuleFlags({}));
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    if (moduleFlags == null) return;
    if (moduleFlags.messaging === false) return;
    let cancelled = false;
    const loadUnread = () => {
      if (document.visibilityState === 'hidden') return;
      void cabinetGet('/api/messages?lite=1', moduleFlags == null || moduleFlags.messaging !== false).then((d) => {
        if (cancelled || typeof d?.unreadTotal !== 'number') return;
        setUnreadMessages(d.unreadTotal);
      });
    };
    loadUnread();
    const t = window.setInterval(loadUnread, 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [status, session?.user?.id, moduleFlags]);

  // TECH works only in /ops — hide cabinet surface from staff admins' mental model
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'TECH') {
      router.replace('/ops');
    }
  }, [status, session?.user?.role, router]);



  // Thin compatibility redirects from legacy ?tab= / ?section= query URLs
  useEffect(() => {
    if (view !== 'overview') return;
    const tab = searchParams.get('tab');
    const section = searchParams.get('section');
    if (tab === 'tickets') {
      router.replace('/tickets');
      return;
    }
    if (tab === 'achievements') {
      router.replace('/dashboard/achievements');
      return;
    }
    if (tab === 'portfolio') {
      router.replace('/dashboard/portfolio');
      return;
    }
    if (tab === 'applications') {
      router.replace('/dashboard/applications');
      return;
    }
    if (tab === 'profile' && section === 'edit') {
      setEditOpen(true);
      router.replace('/dashboard#profile-edit');
      return;
    }
    if (tab === 'profile' && section === 'settings') {
      router.replace('/dashboard/settings');
      return;
    }
    if (tab === 'profile' && (section === 'overview' || !section)) {
      router.replace('/dashboard');
    }
  }, [searchParams, router, view]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    const onDone = () => setModernUserBadge(true);
    window.addEventListener(QUICK_ACCESS_TUTORIAL_DONE_EVENT, onDone);
    return () => window.removeEventListener(QUICK_ACCESS_TUTORIAL_DONE_EVENT, onDone);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;
    // @ts-ignore
    if (session?.user?.role === 'SCANNER') {
      router.push('/scanner');
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const data: any = await fetchProfileCached();
        if (cancelled || !data?.id) return;
        setProfile(data);
        setProfileHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
        setProfileInterests(Array.isArray(data.interests) ? data.interests : []);
        setProfileBirthDate(data.birthDate ? String(data.birthDate).slice(0, 10) : '');
        setProfileGender(data.gender === 'MALE' || data.gender === 'FEMALE' ? data.gender : '');
        if (data.profileVisibility === 'FRIENDS' || data.profileVisibility === 'PRIVATE') {
          setProfileVisibility(data.profileVisibility);
        }
        if (data.onlineVisibility === 'PUBLIC' || data.onlineVisibility === 'HIDDEN' || data.onlineVisibility === 'FRIENDS') {
          setOnlineVisibility(data.onlineVisibility);
        } else {
          setOnlineVisibility('FRIENDS');
        }
        if (data.profileVisibility === 'PUBLIC') {
          setProfileVisibility('PUBLIC');
        }
      } catch {
        /* toast handled in cabinet-fetch */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router, session?.user?.role]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (moduleFlags == null) return;
    let cancelled = false;
    const on = (key: string) => moduleFlags[key] !== false;

    const loadCabinetLists = async () => {
      if (cancelled) return;
      if (on('events')) {
        const data = await cabinetGet('/api/user/participations');
        if (!cancelled && Array.isArray(data)) setParticipations(data);
      }
    };

    void (async () => {
      if (on('achievements') && (view === 'overview' || view === 'edit')) {
        const data = await cabinetGet('/api/user/achievements?lite=1');
        if (cancelled) return;
        if (data?.progress?.complete || data?.legend) setAchievementLegend(true);
        const hasModern = Array.isArray(data?.items)
          ? data.items.some((i: { code?: string; unlocked?: boolean }) => i.code === 'MODERN_USER' && i.unlocked)
          : Boolean(data?.modernUser);
        setModernUserBadge(hasModern);
      }

      if (view !== 'overview') return;
      const later = (cb: () => void) => {
        const ric = (window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
        if (typeof ric === 'function') return ric(cb, { timeout: 2500 });
        return window.setTimeout(cb, 700);
      };
      later(() => {
        if (!cancelled) void loadCabinetLists();
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [status, moduleFlags, view]);


  const refreshProfileLive = useCallback((force = false) => {
    fetchProfileCached(force)
      .then((data: any) => {
        if (data?.id) {
          setProfile(data);
          setProfileHobbies(Array.isArray(data.hobbies) ? data.hobbies : []);
          setProfileInterests(Array.isArray(data.interests) ? data.interests : []);
          setProfileBirthDate(data.birthDate ? String(data.birthDate).slice(0, 10) : '');
          setProfileGender(data.gender === 'MALE' || data.gender === 'FEMALE' ? data.gender : '');
          if (data.levelProgress) {
            const lp = data.levelProgress;
            setLevelMeta({
              level: data.level || lp.current || 1,
              title: lp.title || 'Новичок',
              color: lp.color || '#94a3b8',
              pct: typeof lp.percentToNext === 'number' ? lp.percentToNext : 0,
              blurb: lp.blurb || undefined,
              bandTitle: lp.bandTitle || undefined,
              bandId: lp.bandId || undefined,
              toNext: typeof lp.toNext === 'number' ? lp.toNext : null,
              nextReward: lp.nextReward || null,
              prestige: lp.prestige || null,
            });
          }
          if (data.profileVisibility === 'FRIENDS' || data.profileVisibility === 'PRIVATE') {
            setProfileVisibility(data.profileVisibility);
          }
          if (
            data.onlineVisibility === 'PUBLIC' ||
            data.onlineVisibility === 'HIDDEN' ||
            data.onlineVisibility === 'FRIENDS'
          ) {
            setOnlineVisibility(data.onlineVisibility);
          }
        }
      })
      .catch(() => undefined);
    fetchEcoCached(force)
      .then((d: any) => {
        const lvl = d?.level?.level;
        if (!lvl) return;
        setLevelMeta({
          level: lvl.level || 1,
          title: lvl.title || 'Новичок',
          color: lvl.color || '#94a3b8',
          pct: typeof d.level?.pct === 'number' ? d.level.pct : 0,
          blurb: lvl.blurb || undefined,
          bandTitle: d.level?.band?.title || undefined,
          bandId: d.level?.band?.id || lvl.band || undefined,
          toNext: typeof d.level?.toNext === 'number' ? d.level.toNext : null,
          nextReward: d.level?.nextReward || null,
          prestige: d.level?.prestige || null,
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (t) clearTimeout(t);
      t = setTimeout(() => refreshProfileLive(false), 2500);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (t) clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [status, refreshProfileLive]);


  const upcomingTickets = useMemo(() => {
    const now = Date.now();
    return [...participations]
      .filter((p) => p?.booking?.endTime && new Date(p.booking.endTime).getTime() >= now - 6 * 3600000)
      .sort(
        (a, b) => new Date(a.booking.startTime).getTime() - new Date(b.booking.startTime).getTime()
      );
  }, [participations]);

  // Must stay above any early return — otherwise React #310 when session finishes loading
  // (admin/user landing on /dashboard after login → «Упс»).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status === 'loading' || !session) return;
    const applyHash = () => {
      const hash = window.location.hash;
      if (hash === '#profile-edit') {
        setPreviewOpen(false);
        setEditOpen(true);
        return;
      }
      if (hash === '#messengers' || hash === '#settings') {
        setEditOpen(false);
        setPreviewOpen(false);
        router.push(hash === '#messengers' ? '/dashboard/settings?section=messengers' : '/dashboard/settings');
        return;
      }
      if (hash === '#profile-hub') {
        document.getElementById('profile-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [view, status, session, router]);

  useEffect(() => {
    if (view === 'edit') setEditOpen(true);
  }, [view]);

  useEffect(() => {
    if (!editOpen && !previewOpen) {
      document.body.classList.remove('yp-sheet-open');
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('yp-sheet-open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setEditOpen(false);
      setPreviewOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('yp-sheet-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [editOpen, previewOpen]);

  if (status === 'loading') {
    if (embedded) {
      return (
        <div className="svc-skel" aria-busy="true" aria-label="Открываем кабинет">
          <div className="svc-skel__pill" />
          <div className="svc-skel__row" />
          <div className="svc-skel__row" />
        </div>
      );
    }
    return (
      <div className="container dashboard-shell dashboard-shell--boot" aria-busy="true">
        <div className="svc-skel" aria-hidden>
          <div className="svc-skel__pill" />
          <div className="svc-skel__row" />
          <div className="svc-skel__row" />
        </div>
        <p className="svc-empty-inline">Открываем кабинет…</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="container yp-surface yp-guest-gate" style={{ margin: '2rem auto', maxWidth: 420, padding: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Войдите в кабинет</h2>
        <p style={{ color: 'var(--muted)' }}>Профиль, QR и записи доступны после входа.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
          <a href="/login?callbackUrl=%2Fdashboard" className="btn btn-primary">
            Войти
          </a>
          <a href="/register?callbackUrl=%2Fdashboard" className="btn btn-secondary">
            Регистрация
          </a>
        </div>
      </div>
    );
  }

  const legalName = (profile?.name || session?.user?.name || '').trim();
  const pendingModeration = Boolean(session?.user?.moderationPending);
  const roleBadge = pendingModeration
    ? 'Гость'
    : session?.user?.role
      ? roleLabelRu(session.user.role)
      : null;

  const isOverview = view === 'overview';

  return (
    <div className={embedded ? undefined : 'container dashboard-page'}>
      <EventSoonNotifier tickets={upcomingTickets} />
      {pendingModeration ? (
        <div
          role="status"
          style={{
            margin: '0 0 1rem',
            padding: '0.85rem 1rem',
            borderRadius: 12,
            background: 'color-mix(in srgb, #f59e0b 16%, #fff)',
            border: '1px solid color-mix(in srgb, #d97706 35%, transparent)',
            fontWeight: 650,
            lineHeight: 1.45,
          }}
        >
          Ваш аккаунт находится на проверке. Полный функционал будет доступен после одобрения администратором
        </div>
      ) : null}
      {isOverview ? <h1 className="sr-only">Кабинет</h1> : null}
      {embedded ? null : (
        <CabinetMenu
          variant="strip"
          current="overview"
          upcomingCount={upcomingTickets.length}
          unreadMessages={unreadMessages}
          achievementLegend={achievementLegend}
          ecoPoints={profile?.ecoPoints ?? 0}
          role={session.user?.role}
        />
      )}
      <div>
        <div
          className={
            embedded
              ? undefined
              : `dashboard-layout dashboard-shell${isOverview ? ' is-overview' : ''} hide-aside-mobile`
          }
        >
          {embedded ? null : (
            <CabinetMenu
              current="overview"
              upcomingCount={upcomingTickets.length}
              unreadMessages={unreadMessages}
              achievementLegend={achievementLegend}
              ecoPoints={profile?.ecoPoints ?? 0}
              role={session.user?.role}
            />
          )}

                    <div className={embedded ? undefined : 'dashboard-main'}>
            {(view === 'overview' || view === 'edit') && (
              <div className="dashboard-stack" style={{ maxWidth: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div className="profile-overview-top" id="profile-hub">
                  <div className="profile-view profile-view--unified profile-view--modern profile-view--hub">
                    <ProfileHeroCard
                      name={legalName || session.user?.name}
                      nickname={profile?.nickname || session.user?.nickname}
                      email={profile?.email || session.user?.email}
                      phone={profile?.phone || session.user?.phone}
                      roleLabel={roleBadge}
                      image={avatarPreview || profile?.image || session.user?.image || null}
                      publicCode={profile?.publicCode}
                      bio={profile?.bio}
                      legend={achievementLegend}
                      modernBadge={modernUserBadge}
                      showcaseStored={profile?.showcaseBadges}
                      showcaseHref="/dashboard/showcase"
                      instructionsVersion={profile?.instructionsVersion}
                      instructionsCompletedAt={profile?.instructionsCompletedAt}
                      authority={
                        profile?.reliabilityPercent == null ? null : profile.reliabilityPercent
                      }
                      authorityLabel={profile?.reliabilityLabel}
                      social={profile?.socialScore ?? 50}
                      ecoPoints={profile?.ecoPoints ?? 0}
                      levelMeta={levelMeta}
                      editSectionHref="#profile-edit"
                      settingsHref="/dashboard/settings"
                      publicHref={
                        profile?.publicCode || session.user?.id
                          ? `/u/${encodeURIComponent(String(profile?.publicCode || session.user?.id))}`
                          : undefined
                      }
                      onEdit={() => {
                        setEditOpen(true);
                      }}
                      onPreview={() => setPreviewOpen(true)}
                      onSettings={() => {
                        setEditOpen(false);
                        router.push('/dashboard/settings');
                      }}
                      onAvatarPick={(file) => {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                        setAvatarName(file.name);
                        toast('Фото выбрано — сохраните в окне редактирования');
                        setEditOpen(true);
                      }}
                      onShowcaseSaved={(codes) =>
                        setProfile((prev) =>
                          prev ? { ...prev, showcaseBadges: codes } : prev
                        )
                      }
                      onStatClick={(key) => openRepModal(key)}
                      onPassClick={openPass}
                      showRatings
                      showEco
                      revealContacts
                    />
                    <PersonalQrPanel open={passOpen} onClose={() => setPassOpen(false)} />
                    <CoworkingCabinetList />

                  </div>

                  </div>
                {editOpen ? (
                <div className="yp-sheet yp-sheet--profile" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
                  <button type="button" className="yp-sheet__backdrop" aria-label="Закрыть" onClick={() => setEditOpen(false)} />
                  <div className="yp-sheet__panel">
                    <header className="yp-sheet__head">
                      <h2 id="profile-edit-title">Редактировать профиль</h2>
                      <button type="button" className="yp-sheet__close" onClick={() => setEditOpen(false)} aria-label="Закрыть">
                        ×
                      </button>
                    </header>
                <div className="yp-sheet__body">
                <form
                  id="profile-edit"
                  className="profile-unified-edit profile-edit-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (profileSaving) return;
                    const formEl = e.target as HTMLFormElement;
                    const formData = new FormData(formEl);
                    const nextName = String(formData.get('name') || '').trim();
                    const nextEmail = String(formData.get('email') || '').trim();
                    const nextPhone = String(formData.get('phone') || '').trim();
                    const prevName = String(profile?.name || session.user?.name || '').trim();
                    const prevEmail = String(profile?.email || session.user?.email || '').trim();
                    const prevPhone = String(profile?.phone || session.user?.phone || '').trim();
                    const identityChanged =
                      (nextName && nextName !== prevName) ||
                      (nextEmail && nextEmail.toLowerCase() !== prevEmail.toLowerCase()) ||
                      (nextPhone && nextPhone.replace(/\D/g, '') !== prevPhone.replace(/\D/g, ''));
                    if (identityChanged) {
                      const ok = window.confirm(
                        'Вы меняете имя, почту или телефон. Это можно сделать раз в 30 дней. Сохранить изменения?'
                      );
                      if (!ok) return;
                    }
                    setProfileSaving(true);
                    const data: Record<string, unknown> = Object.fromEntries(formData);
                    data.hobbies = profileHobbies;
                    data.interests = profileInterests;
                    data.birthDate = profileBirthDate || null;
                    data.gender = profileGender || null;
                    data.profileVisibility = profileVisibility;
                    data.onlineVisibility = onlineVisibility;

                    if (avatarFile) {
                      const fileFormData = new FormData();
                      fileFormData.append('file', avatarFile);
                      try {
                        const uploadRes = await fetch('/api/user/upload', {
                          method: 'POST',
                          body: fileFormData,
                        });
                        const uploadData = await uploadRes.json().catch(() => ({}));
                        if (uploadRes.status === 413) {
                          throw new Error('Фото слишком большое для сервера (лимит ~15–25 МБ)');
                        }
                        if (!uploadRes.ok) {
                          throw new Error(uploadData.message || 'Не удалось загрузить фото');
                        }
                        if (uploadData.url) data.image = uploadData.url;
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Ошибка загрузки фото');
                        setProfileSaving(false);
                        return;
                      }
                    }

                    try {
                      data.fingerprint = await collectDeviceFingerprint();
                      const res = await fetch('/api/user/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      const json = (await readCabinetJson(res)) || {};
                      if (res.ok) {
                        toast.success(json.message || 'Профиль успешно сохранен!');
                        setEditOpen(false);
                        const saved = json.user || {};
                        setProfile((prev) => ({ ...prev, ...saved }));
                        setProfileHobbies(Array.isArray(saved.hobbies) ? saved.hobbies : profileHobbies);
                        setProfileInterests(Array.isArray(saved.interests) ? saved.interests : profileInterests);
                        if (saved.birthDate) setProfileBirthDate(String(saved.birthDate).slice(0, 10));
                        setProfileGender(
                          saved.gender === 'MALE' || saved.gender === 'FEMALE' ? saved.gender : ''
                        );
                        if (saved.profileVisibility === 'FRIENDS' || saved.profileVisibility === 'PRIVATE') {
                          setProfileVisibility(saved.profileVisibility);
                        } else if (saved.profileVisibility) {
                          setProfileVisibility('PUBLIC');
                        }
                        if (
                          saved.onlineVisibility === 'PUBLIC' ||
                          saved.onlineVisibility === 'HIDDEN' ||
                          saved.onlineVisibility === 'FRIENDS'
                        ) {
                          setOnlineVisibility(saved.onlineVisibility);
                        }
                        setAvatarFile(null);
                        setAvatarName('');
                        if (saved.image) setAvatarPreview(saved.image);
                        await update({
                          name: saved.name || data.name,
                          nickname: saved.nickname ?? data.nickname ?? null,
                          email: saved.email || data.email,
                          phone: saved.phone || data.phone || '',
                          image: saved.image || data.image || session.user?.image,
                          ...(typeof json.keepAlive === 'string' && json.keepAlive
                            ? { keepAlive: json.keepAlive }
                            : {}),
                        });
                        fetch('/api/user/achievements')
                          .then((r) => readCabinetJson(r))
                          .then((d) => {
                            if (d?.progress?.complete || d?.legend) setAchievementLegend(true);
                          })
                          .catch(() => undefined);
                        router.refresh();
                      } else {
                        toast.error(json.message || 'Ошибка при сохранении');
                      }
                    } catch {
                      toast.error('Ошибка сети при сохранении профиля');
                    } finally {
                      setProfileSaving(false);
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <p className="profile-view__lead" style={{ margin: '0 0 0.35rem' }}>
                    Имя, почту и телефон можно менять раз в 30 дней.
                  </p>
                  <details className="profile-edit-fold" open>
                    <summary>Имя, фото, контакты и «о себе»</summary>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Аватар
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, var(--primary), #60a5fa)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          border: '2px solid rgba(37,99,235,0.15)',
                        }}
                      >
                        {(avatarPreview || profile?.image || session.user?.image) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarPreview || profile?.image || session.user?.image || ''}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          session.user?.name?.charAt(0) || <User size={28} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.65rem 1rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(37,99,235,0.25)',
                            background: 'rgba(37,99,235,0.06)',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                          }}
                        >
                          <ImagePlus size={16} />
                          Выбрать фото
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setAvatarFile(file);
                              if (file) {
                                setAvatarPreview(URL.createObjectURL(file));
                                setAvatarName(file.name);
                              } else {
                                setAvatarPreview(null);
                                setAvatarName('');
                              }
                            }}
                          />
                        </label>
                        <p
                          style={{
                            margin: '0.45rem 0 0',
                            fontSize: '0.8rem',
                            color: 'var(--muted)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {avatarName
                            ? avatarName
                            : 'PNG, JPG, WEBP или GIF — до 15 МБ'}
                        </p>
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                              setAvatarName('');
                            }}
                            style={{
                              marginTop: '0.35rem',
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              padding: 0,
                              fontWeight: 500,
                            }}
                          >
                            Убрать выбранный файл
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                      htmlFor="profile-name"
                    >
                      Имя <span style={{ fontWeight: 400 }}>(раз в 30 дней)</span>
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      key={`name-${profile?.name || session.user?.name || ''}`}
                      defaultValue={profile?.name || session.user?.name || ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Никнейм (публичный)
                    </label>
                    <input
                      name="nickname"
                      type="text"
                      key={`nickname-${profile?.nickname || ''}`}
                      defaultValue={profile?.nickname || ''}
                      placeholder="например sochi_leader"
                      maxLength={24}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      2–24 символа. Показывается вместо имени в профиле. ID:{' '}
                      <strong style={{ fontFamily: 'ui-monospace, monospace' }}>
                        {profile?.publicCode || '…'}
                      </strong>
                    </p>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Город
                    </label>
                    <input
                      name="city"
                      type="text"
                      key={`city-${profile?.city || ''}`}
                      defaultValue={profile?.city || 'Сочи'}
                      placeholder="Сочи"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Дата рождения
                    </label>
                    <input
                      type="date"
                      value={profileBirthDate}
                      onChange={(e) => setProfileBirthDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                    {(profileBirthDate || profile?.zodiac) && (
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Знак зодиака:{' '}
                        {zodiacFromDate(profileBirthDate) || profile?.zodiac || '—'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Пол
                    </label>
                    <select
                      value={profileGender}
                      onChange={(e) =>
                        setProfileGender(
                          e.target.value === 'MALE' || e.target.value === 'FEMALE'
                            ? e.target.value
                            : ''
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                        background: '#fff',
                      }}
                    >
                      <option value="">Не указан</option>
                      <option value="FEMALE">Женский</option>
                      <option value="MALE">Мужской</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Коротко о себе / вайб
                    </label>
                    <input
                      name="bio"
                      type="text"
                      key={`bio-${profile?.bio || ''}`}
                      defaultValue={profile?.bio || ''}
                      maxLength={280}
                      placeholder="Например: на вайбе после квиза 🎧"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                    >
                      О себе подробнее
                    </label>
                    <textarea
                      name="about"
                      key={`about-${profile?.about || ''}`}
                      defaultValue={profile?.about || ''}
                      rows={4}
                      placeholder="Чем занимаешься, чего хочешь на портале…"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <TagPicker
                    label="Увлечения / хобби"
                    kind="hobbies"
                    value={profileHobbies}
                    onChange={setProfileHobbies}
                    hint="Выберите из списка. Свой вариант — 1 раз в сутки, после проверки модератором"
                  />
                  <TagPicker
                    label="Интересы"
                    kind="interests"
                    value={profileInterests}
                    onChange={setProfileInterests}
                    hint="Тоже можно предложить свой вариант (общий лимит — 1 в сутки)"
                  />
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                      htmlFor="profile-email"
                    >
                      Электронная почта <span style={{ fontWeight: 400 }}>(раз в 30 дней)</span>
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      key={`email-${profile?.email || session.user?.email || ''}`}
                      defaultValue={profile?.email || session.user?.email || ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        color: 'var(--muted)',
                      }}
                      htmlFor="profile-phone"
                    >
                      Телефон <span style={{ fontWeight: 400 }}>(раз в 30 дней)</span>
                    </label>
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      key={`phone-${profile?.phone || session.user?.phone || ''}`}
                      defaultValue={profile?.phone || session.user?.phone || ''}
                      placeholder="+7 (900) 000-00-00"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 12,
                      border: '1px solid rgba(15,23,42,0.08)',
                      background: 'rgba(15,23,42,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Соцсети и Steam (по желанию)</div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Steam
                      </label>
                      <input
                        name="steamUrl"
                        type="url"
                        key={`steam-${profile?.steamUrl || ''}`}
                        defaultValue={profile?.steamUrl || ''}
                        placeholder="https://steamcommunity.com/id/…"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        ВКонтакте
                      </label>
                      <input
                        name="vkUrl"
                        type="text"
                        key={`vk-${profile?.vkUrl || ''}`}
                        defaultValue={profile?.vkUrl || ''}
                        placeholder="https://vk.ru/… или id123"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Telegram
                      </label>
                      <input
                        name="telegramUrl"
                        type="text"
                        key={`tg-${profile?.telegramUrl || ''}`}
                        defaultValue={profile?.telegramUrl || ''}
                        placeholder="@username или https://t.me/…"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div id="messengers" className="profile-messenger-ids" style={{ gridColumn: '1 / -1' }}>
                      <strong style={{ fontSize: '0.88rem' }}>Мессенджеры для ботов</strong>
                      <p className="profile-messenger-ids__hint">
                        Напишите боту /start, затем вставьте сюда свой числовой ID — так портал сможет присылать вам оповещения в MAX и Telegram.
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        ID чата Telegram (для бота)
                      </label>
                      <input
                        name="telegramChatId"
                        type="text"
                        inputMode="numeric"
                        key={`tgid-${profile?.telegramChatId || ''}`}
                        defaultValue={profile?.telegramChatId || ''}
                        placeholder="напр. 123456789 — узнать у бота командой /start"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        ID пользователя MAX (для бота)
                      </label>
                      <input
                        name="maxUserId"
                        type="text"
                        inputMode="numeric"
                        key={`maxid-${profile?.maxUserId || ''}`}
                        defaultValue={profile?.maxUserId || ''}
                        placeholder="напр. 13771314 — узнать у бота /start"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', color: 'var(--muted)' }}>
                        MAX
                      </label>
                      <input
                        name="maxUrl"
                        type="url"
                        key={`max-${profile?.maxUrl || ''}`}
                        defaultValue={profile?.maxUrl || ''}
                        placeholder="https://max.ru/…"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <PersonalGalleryEditor />
                  <p className="profile-settings-hub__hint" style={{ margin: '0.5rem 0 0.85rem' }}>
                    Конфиденциальность и смена пароля — во вкладке «Настройки».
                  </p>

                  </details>
                  <div className="profile-edit-sticky">
                    <button
                      type="button"
                      className="profile-edit-sticky__btn profile-edit-sticky__btn--ghost"
                      onClick={() => setEditOpen(false)}
                    >
                      Закрыть
                    </button>
                    <button
                      type="submit"
                      className="profile-edit-sticky__btn profile-edit-sticky__btn--primary"
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Сохранение…' : 'Сохранить профиль'}
                    </button>
                  </div>
                </form>
                </div>
                  </div>
                </div>
                ) : null}

              </div>
            )}
          </div>
        </div>
      </div>
      <ProfilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        name={profile?.nickname || legalName || session.user?.name}
        image={avatarPreview || profile?.image || session.user?.image || null}
        bio={profile?.bio}
        hobbies={profileHobbies}
        interests={profileInterests}
        publicCode={profile?.publicCode}
        publicHref={
          profile?.publicCode || session.user?.id
            ? `/u/${encodeURIComponent(String(profile?.publicCode || session.user?.id))}`
            : undefined
        }
        portfolioHref={modOn('portfolio') ? '/dashboard/portfolio' : undefined}
      />
      <ReputationHistoryModal
        open={repModalOpen}
        initialTab={repModalTab}
        onClose={() => setRepModalOpen(false)}
        onEcoChange={setEcoBalance}
        onOpenShop={() => {
          router.push('/dashboard/shop');
          setTimeout(() => {
            document.getElementById('eco-shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />
    </div>
  );
}

export default function DashboardClient({ view = 'overview', embedded = false }: DashboardClientProps) {
  return <DashboardInner view={view} embedded={embedded} />;
}
