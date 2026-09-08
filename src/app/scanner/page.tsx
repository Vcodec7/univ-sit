import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ScannerHub from '@/components/ScannerHub';
import { canUseScanner } from '@/lib/acl';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Сканер',
};

export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/scanner&staff=1');
  if (!canUseScanner(session.user?.role, session.user?.permissions)) {
    redirect('/dashboard');
  }

  const role = session.user?.role || '';
  const { tab } = await searchParams;
  if (role === 'ADMIN' || role === 'MODERATOR') {
    redirect(tab === 'pass' ? '/admin/scanner?tab=pass' : '/admin/scanner');
  }

  return (
    <div className="scanner-shell">
      <ScannerHub initialTab={tab} />
    </div>
  );
}
