import { ScrollText } from 'lucide-react';
import LegalDocShell from '@/components/LegalDocShell';
import LegalMdxShell from '@/components/LegalMdxShell';
import { LegalMdxBody, readLegalMdx, tocFromMdx } from '@/lib/legal-mdx';
import { getSiteIdentity } from '@/lib/site-identity';
import { brandedMetadata } from '@/lib/branded-metadata';
import { RULES_POLICY_VERSION } from '@/lib/consent-versions';

export const revalidate = 3600;

export async function generateMetadata() {
  const { siteName } = await getSiteIdentity();
  return brandedMetadata('Правила сайта', {
    description: `Правила пользования порталом ${siteName}`,
    canonicalPath: '/rules',
  });
}

export default async function RulesPage() {
  const identity = await getSiteIdentity();
  const source = readLegalMdx('rules');
  return (
    <LegalDocShell
      brand={identity.siteName}
      icon={<ScrollText size={26} strokeWidth={2.2} />}
      title="Правила сайта"
      lead={<>Коротко и по делу: кто может пользоваться порталом и что нельзя делать.</>}
      meta={<span className="legal-pill">Версия {RULES_POLICY_VERSION}</span>}
      toc={tocFromMdx(source)}
    >
      <LegalMdxShell>
        <LegalMdxBody source={source} />
      </LegalMdxShell>
    </LegalDocShell>
  );
}
