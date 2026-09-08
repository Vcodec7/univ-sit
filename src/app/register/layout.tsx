import type { ReactNode } from 'react';
import { requirePublicModulePage } from '@/lib/require-module-page';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: ReactNode }) {
  await requirePublicModulePage('registration');
  return children;
}
