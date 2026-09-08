'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardClient from '@/components/DashboardClient';
import MobileSheet from '@/components/ui/MobileSheet';

export default function ProfileEditInterceptModal() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) router.back();
  }, [open, router]);
  return (
    <MobileSheet open={open} onOpenChange={setOpen} title="Редактирование профиля">
      <DashboardClient view="edit" embedded />
    </MobileSheet>
  );
}
