import type { ReactNode } from 'react';
import { requirePublicModulePage } from '@/lib/require-module-page';

export default async function Layout({ children }: { children: ReactNode }) {
  await requirePublicModulePage('registration');
  return children;
}
