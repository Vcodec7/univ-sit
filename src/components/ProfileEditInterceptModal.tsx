'use client';

import { useRouter } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export default function ProfileEditInterceptModal() {
  const router = useRouter();
  return (
    <div className="yp-edit-intercept" role="dialog" aria-modal="true" aria-labelledby="yp-edit-intercept-title">
      <button
        type="button"
        className="yp-edit-intercept__backdrop"
        aria-label="Закрыть"
        onClick={() => router.back()}
      />
      <div className="yp-edit-intercept__sheet">
        <h2 id="yp-edit-intercept-title" className="sr-only">
          Редактирование профиля
        </h2>
        <DashboardClient view="edit" embedded />
      </div>
    </div>
  );
}
