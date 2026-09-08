import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  COOKIES_POLICY_VERSION,
  PRIVACY_POLICY_VERSION,
  RULES_POLICY_VERSION,
  buildConsentSignature,
} from '@/lib/consent';
import { needsPrivacyReconsent } from '@/lib/privacy-consent';
import { unlockAchievement } from '@/lib/award-achievements';
import {
  FEATURE_CONSENT_COPY,
  mergeFeatureConsentSources,
  writeFeatureConsent,
  type FeatureConsentKey,
} from '@/lib/feature-consents';

function isFeatureKey(v: unknown): v is FeatureConsentKey {
  return v === 'coworking' || v === 'portfolio';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      privacyAcceptedAt: true,
      privacyFirstAcceptedAt: true,
      privacyRefusedAt: true,
      privacySignature: true,
      privacyPolicyVersion: true,
      cookiesAcceptedAt: true,
      cookiesSignature: true,
      cookiesPolicyVersion: true,
      notificationPrefsJson: true,
      featureConsentsJson: true,
    },
  });
  return NextResponse.json({
    ...(user || {}),
    featureConsents: mergeFeatureConsentSources(
      user?.featureConsentsJson,
      user?.notificationPrefsJson
    ),
    currentPrivacyVersion: PRIVACY_POLICY_VERSION,
    currentCookiesVersion: COOKIES_POLICY_VERSION,
    needsPrivacyReconsent: needsPrivacyReconsent(user),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const refusePrivacy = Boolean(body.refusePrivacy);
  const wantPrivacy = Boolean(body.privacy);
  const wantCookies = Boolean(body.cookies);
  const feature = isFeatureKey(body.feature) ? body.feature : null;

  if (refusePrivacy) {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { privacyRefusedAt: new Date() },
      select: {
        privacyAcceptedAt: true,
        privacyFirstAcceptedAt: true,
        privacyRefusedAt: true,
        privacyPolicyVersion: true,
      },
    });
    return NextResponse.json({
      ok: true,
      refused: true,
      user,
      needsPrivacyReconsent: true,
      currentPrivacyVersion: PRIVACY_POLICY_VERSION,
    });
  }

  if (feature) {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefsJson: true, featureConsentsJson: true },
    });
    const key: FeatureConsentKey = feature;
    const at = new Date().toISOString();
    const nextJson = writeFeatureConsent(existing?.notificationPrefsJson, key, at);
    const merged = mergeFeatureConsentSources(existing?.featureConsentsJson, nextJson);
    merged[key] = at;
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPrefsJson: nextJson,
        featureConsentsJson: JSON.stringify(merged),
      },
      select: { notificationPrefsJson: true, featureConsentsJson: true },
    });
    return NextResponse.json({
      ok: true,
      feature: key,
      copy: FEATURE_CONSENT_COPY[key],
      featureConsents: mergeFeatureConsentSources(
        user.featureConsentsJson,
        user.notificationPrefsJson
      ),
    });
  }

  if (!wantPrivacy && !wantCookies) {
    return NextResponse.json({ message: 'Нечего сохранять' }, { status: 400 });
  }

  const now = new Date();
  const email = session.user.email || '';
  const data: Record<string, unknown> = {};

  if (wantPrivacy) {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { privacyFirstAcceptedAt: true, privacyAcceptedAt: true },
    });
    data.privacyAcceptedAt = now;
    data.privacyRefusedAt = null;
    data.privacyPolicyVersion = PRIVACY_POLICY_VERSION;
    data.privacySignature = buildConsentSignature({
      userId: session.user.id,
      email,
      kind: 'privacy',
      version: PRIVACY_POLICY_VERSION,
      at: now,
    });
    if (!existing?.privacyFirstAcceptedAt) {
      data.privacyFirstAcceptedAt = existing?.privacyAcceptedAt || now;
    }
    data.rulesAcceptedAt = now;
    data.rulesPolicyVersion = RULES_POLICY_VERSION;
    data.rulesSignature = buildConsentSignature({
      userId: session.user.id,
      email,
      kind: 'rules',
      version: RULES_POLICY_VERSION,
      at: now,
    });
  }
  if (wantCookies) {
    data.cookiesAcceptedAt = now;
    data.cookiesPolicyVersion = COOKIES_POLICY_VERSION;
    data.cookiesSignature = buildConsentSignature({
      userId: session.user.id,
      email,
      kind: 'cookies',
      version: COOKIES_POLICY_VERSION,
      at: now,
    });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      privacyAcceptedAt: true,
      privacyFirstAcceptedAt: true,
      privacyRefusedAt: true,
      privacySignature: true,
      privacyPolicyVersion: true,
      cookiesAcceptedAt: true,
      cookiesSignature: true,
      cookiesPolicyVersion: true,
    },
  });

  if (wantPrivacy) {
    await unlockAchievement(session.user.id, 'PRIVACY_OK');
  }

  return NextResponse.json({
    ok: true,
    user,
    needsPrivacyReconsent: needsPrivacyReconsent(user),
    currentPrivacyVersion: PRIVACY_POLICY_VERSION,
  });
}
