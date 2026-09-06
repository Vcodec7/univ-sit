'use client';

import { useEffect, useState } from 'react';
import DashboardSettingsHub from '@/components/DashboardSettingsHub';
import { fetchProfileCached } from '@/lib/user-data-client';
import { readCabinetJson } from '@/lib/cabinet-fetch';

type ProfileLite = {
  deletionRequestedAt?: string | null;
  deletionEffectiveAt?: string | null;
  privacyFirstAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  privacyPolicyVersion?: string | null;
  privacySignature?: string | null;
  rulesAcceptedAt?: string | null;
  rulesPolicyVersion?: string | null;
  rulesSignature?: string | null;
  cookiesAcceptedAt?: string | null;
  cookiesPolicyVersion?: string | null;
  cookiesSignature?: string | null;
  telegramChatId?: string | null;
  maxUserId?: string | null;
  profileVisibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  onlineVisibility?: 'FRIENDS' | 'PUBLIC' | 'HIDDEN';
};

export default function DashboardSettingsPageClient() {
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [profileVisibility, setProfileVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [onlineVisibility, setOnlineVisibility] = useState<'FRIENDS' | 'PUBLIC' | 'HIDDEN'>('FRIENDS');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    fetchProfileCached()
      .then((data: any) => {
        if (!data?.id) return;
        setProfile(data);
        if (data.profileVisibility === 'FRIENDS' || data.profileVisibility === 'PRIVATE') {
          setProfileVisibility(data.profileVisibility);
        } else {
          setProfileVisibility('PUBLIC');
        }
        if (
          data.onlineVisibility === 'PUBLIC' ||
          data.onlineVisibility === 'HIDDEN' ||
          data.onlineVisibility === 'FRIENDS'
        ) {
          setOnlineVisibility(data.onlineVisibility);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="profile-view svc-settings-page">
      <DashboardSettingsHub
        embedded
        profile={profile}
        profileVisibility={profileVisibility}
        onlineVisibility={onlineVisibility}
        profileSaving={profileSaving}
        setProfileVisibility={setProfileVisibility}
        setOnlineVisibility={setOnlineVisibility}
        setProfileSaving={setProfileSaving}
        setProfile={setProfile}
        readJsonSafe={readCabinetJson}
      />
    </div>
  );
}
