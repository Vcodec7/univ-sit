import Skeleton from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="admin-page-shell" style={{ padding: '1rem 0 4rem', display: 'grid', gap: 12 }} aria-busy>
      <Skeleton height={28} width="40%" />
      <Skeleton height={88} />
      <Skeleton height={160} />
    </div>
  );
}
