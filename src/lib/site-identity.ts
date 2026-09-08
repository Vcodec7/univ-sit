import { cache } from 'react';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isNextBuildPhase } from '@/lib/build-phase';
import {
  DEFAULT_SITE_NAME,
  hostFromOrigin,
  identityFromSettings,
  resolvePublicOrigin,
  shortSiteName,
  type SiteIdentity,
} from '@/lib/site-identity-shared';

export type { SiteIdentity };
export {
  DEFAULT_PUBLIC_ORIGIN,
  DEFAULT_SITE_NAME,
  applySitePlaceholders,
  hostFromOrigin,
  identityFromSettings,
  isLocalOrigin,
  normalizeOrigin,
  originFromEnv,
  resolvePublicOrigin,
  shortSiteName,
  withSiteBrand,
} from '@/lib/site-identity-shared';

async function requestOriginHint(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();
    if (!host) return '';
    const proto = (h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')).split(',')[0].trim();
    return `${proto}://${host}`;
  } catch {
    return '';
  }
}

function withRequestHost(base: SiteIdentity, requestOrigin: string): SiteIdentity {
  const publicOrigin = resolvePublicOrigin(base.publicOrigin, requestOrigin);
  return {
    ...base,
    publicOrigin,
    host: hostFromOrigin(publicOrigin),
  };
}

/**
 * Resolve site name + public domain from DB + env.
 * Server-only (uses Prisma). Prefer identityFromSettings / shared helpers on the client.
 */
export const getSiteIdentity = cache(async (): Promise<SiteIdentity> => {
  const hint = isNextBuildPhase() ? '' : await requestOriginHint();
  return loadSiteIdentity(hint);
});

/** ISR pages must not call headers() or they become request-dynamic. */
export async function getSiteIdentityStatic(): Promise<SiteIdentity> {
  return loadSiteIdentity('');
}

async function loadSiteIdentity(requestHint: string): Promise<SiteIdentity> {
  if (isNextBuildPhase()) {
    const publicOrigin = resolvePublicOrigin(null, requestHint);
    return {
      siteName: DEFAULT_SITE_NAME,
      publicOrigin,
      shortName: shortSiteName(DEFAULT_SITE_NAME),
      host: hostFromOrigin(publicOrigin),
    };
  }
  try {
    const s = await prisma.siteSettings.findUnique({
      where: { id: '1' },
      select: { siteName: true, publicSiteUrl: true },
    });
    return withRequestHost(identityFromSettings(s), requestHint);
  } catch {
    const publicOrigin = resolvePublicOrigin(null, requestHint);
    return {
      siteName: DEFAULT_SITE_NAME,
      publicOrigin,
      shortName: shortSiteName(DEFAULT_SITE_NAME),
      host: hostFromOrigin(publicOrigin),
    };
  }
}
