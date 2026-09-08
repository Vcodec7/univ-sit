import { NextResponse } from 'next/server';
import { getMaintenanceState } from '@/lib/maintenance';
import { getAccessSettings } from '@/lib/access-settings';
import { getModuleFlagsBundle } from '@/lib/module-flags';
import { oauthFlagsFromCreds, loadOAuthCreds } from '@/lib/oauth-settings';
import { smsProviderConfigured } from '@/lib/sms-otp';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Public lightweight status for middleware / PWA / uptime checks */
export async function GET() {
  const [state, access, bundle, visibility, smsReady, oauthCreds] = await Promise.all([
    getMaintenanceState(),
    getAccessSettings(),
    getModuleFlagsBundle(),
    prisma.siteSettings
      .findUnique({
        where: { id: '1' },
        select: {
          publicEventsVisibility: true,
          galleryPageEnabled: true,
          galleryPublicEnabled: true,
        },
      })
      .catch(() => null),
    smsProviderConfigured(),
    loadOAuthCreds(),
  ]);
  const oauth = oauthFlagsFromCreds(oauthCreds);
  return NextResponse.json(
    {
      ok: true,
      maintenanceMode: state.maintenanceMode,
      maintenanceMessage: state.maintenanceMessage,
      maintenanceEta: state.maintenanceEta,
      siteName: state.siteName,
      registrationEnabled: access.registrationEnabled,
      messagingEnabled: access.messagingEnabled,
      smsLoginEnabled: access.smsLoginEnabled,
      esiaLoginEnabled: access.esiaLoginEnabled,
      smsLoginReady: access.smsLoginEnabled && smsReady,
      esiaLoginReady: access.esiaLoginEnabled && oauth.esia,
      oauth,
      modules: bundle.flags,
      offModes: bundle.offModes,
      publicEventsVisibility: Boolean(visibility?.publicEventsVisibility),
      galleryPageEnabled: visibility?.galleryPageEnabled !== false,
      galleryPublicEnabled: Boolean(visibility?.galleryPublicEnabled),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=30',
      },
    }
  );
}
