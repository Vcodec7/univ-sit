import ScannerHub from '@/components/ScannerHub';
import OrgEntranceQr from '@/components/OrgEntranceQr';
import { requirePermissionPage } from '@/lib/acl';
import { buildOrgEntranceCheckInUrl, buildOrgEntranceCode } from '@/lib/tickets';

export const metadata = {
  title: 'Сканер',
};

export default async function AdminScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requirePermissionPage('scanner');
  const { tab } = await searchParams;

  const orgUrl = buildOrgEntranceCheckInUrl();
  const orgCode = buildOrgEntranceCode();

  return (
    <div className="admin-scanner-page">
      <details className="admin-scanner-page__org-details card-surface">
        <summary className="admin-scanner-page__org-summary">
          QR на вход в организацию — для печати у двери
        </summary>
        <OrgEntranceQr url={orgUrl} codeLabel={orgCode} />
      </details>
      <div className="admin-scanner-page__scanner">
        <ScannerHub initialTab={tab} />
      </div>
    </div>
  );
}
