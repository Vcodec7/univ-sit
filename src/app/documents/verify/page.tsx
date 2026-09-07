import DocumentVerifyClient from '@/components/DocumentVerifyClient';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { brandedMetadata } = await import('@/lib/branded-metadata');
  return brandedMetadata('Проверить документ', {
    description: 'Проверка подлинности PDF и политики конфиденциальности портала',
    canonicalPath: '/documents/verify',
  });
}

export default function DocumentVerifyPage() {
  return <DocumentVerifyClient />;
}
