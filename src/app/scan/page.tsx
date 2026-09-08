import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Canonical staff scanner is /scanner. Keep this file so old bookmarks hit a 308. */
export default function ScanAliasPage() {
  permanentRedirect('/scanner?tab=pass');
}
