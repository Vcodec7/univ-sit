import { FileText } from 'lucide-react';
import LegalDocShell from '@/components/LegalDocShell';
import LegalMdxShell from '@/components/LegalMdxShell';
import { LegalMdxBody, readLegalMdx, tocFromMdx } from '@/lib/legal-mdx';
import { getSiteIdentityStatic } from '@/lib/site-identity';
import { brandedMetadata } from '@/lib/branded-metadata';
import { TERMS_POLICY_VERSION } from '@/lib/consent-versions';

export const revalidate = 3600;
export const dynamic = 'force-static';

export async function generateMetadata() {
  const { siteName } = await getSiteIdentityStatic();
  return brandedMetadata('Пользовательское соглашение', {
    description: `Условия использования портала ${siteName}`,
    canonicalPath: '/terms',
  });
}

export default async function TermsPage() {
  const identity = await getSiteIdentityStatic();
  const source = readLegalMdx('terms');
  return (
    <LegalDocShell
      brand={identity.siteName}
      icon={<FileText size={26} strokeWidth={2.2} />}
      title="Пользовательское соглашение"
      lead={<>Условия безвозмездного использования. Не является коммерческой офертой.</>}
      meta={<span className="legal-pill">Версия {TERMS_POLICY_VERSION}</span>}
      toc={tocFromMdx(source)}
    >
      <LegalMdxShell>
        <LegalMdxBody source={source} />
      </LegalMdxShell>
    </LegalDocShell>
  );
}
