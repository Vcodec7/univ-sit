import type { Metadata } from 'next';
import { getSiteIdentity, isLocalOrigin, publicAssetUrl, withSiteBrand } from '@/lib/site-identity';

/** Dynamic page metadata branded with current SiteSettings.siteName. */
export async function brandedMetadata(
  pageTitle: string,
  extras?: Omit<Metadata, 'title'> & { titleAbsolute?: boolean; canonicalPath?: string }
): Promise<Metadata> {
  const { siteName, publicOrigin } = await getSiteIdentity();
  const { titleAbsolute, canonicalPath, ...rest } = extras || {};
  const clean = withSiteBrand(pageTitle, siteName);
  const ogUrl =
    typeof rest.openGraph === 'object' && rest.openGraph && 'url' in rest.openGraph
      ? String((rest.openGraph as { url?: string }).url || '')
      : '';
  const canonical =
    (typeof rest.alternates?.canonical === 'string' && rest.alternates.canonical) ||
    ogUrl ||
    (canonicalPath
      ? `${publicOrigin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : undefined);
  const ogImage = publicAssetUrl(publicOrigin, '/icons/icon-512.png');
  const safeBase = isLocalOrigin(publicOrigin) ? undefined : new URL(publicOrigin);
  const restOg =
    rest.openGraph && typeof rest.openGraph === 'object' ? (rest.openGraph as Record<string, unknown>) : {};
  return {
    ...rest,
    // absolute: full "Page | Brand"; default: fragment for layout title.template
    title: titleAbsolute ? { absolute: `${clean} | ${siteName}` } : clean,
    ...(safeBase ? { metadataBase: rest.metadataBase || safeBase } : {}),
    alternates: {
      ...(canonical ? { canonical } : {}),
      ...(rest.alternates || {}),
    },
    openGraph: {
      ...restOg,
      ...(ogImage && !restOg.images ? { images: [{ url: ogImage, width: 512, height: 512, alt: siteName }] } : {}),
    },
  };
}
