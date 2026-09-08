import { Shield, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import PrivacyDownloadButton from '@/components/PrivacyDownloadButton';
import LegalDocShell from '@/components/LegalDocShell';
import LegalMdxShell from '@/components/LegalMdxShell';
import { LegalMdxBody, readLegalMdx, tocFromMdx } from '@/lib/legal-mdx';
import { getSiteIdentityStatic } from '@/lib/site-identity';
import { brandedMetadata } from '@/lib/branded-metadata';
import { PRIVACY_POLICY_VERSION } from '@/lib/consent-versions';
import { PRIVACY_POLICY_TITLE } from '@/lib/privacy-document';

export const revalidate = 3600;
export const dynamic = 'force-static';

export async function generateMetadata() {
  const { siteName } = await getSiteIdentityStatic();
  return brandedMetadata('Политика конфиденциальности', {
    description: `Как портал «${siteName}» собирает, использует и защищает персональные данные.`,
    canonicalPath: '/privacy',
  });
}

export default async function PrivacyPolicy() {
  const identity = await getSiteIdentityStatic();
  const source = readLegalMdx('privacy');
  const toc = tocFromMdx(source);

  return (
    <LegalDocShell
      brand={identity.siteName}
      icon={<Shield size={26} strokeWidth={2.2} />}
      title={PRIVACY_POLICY_TITLE}
      lead={
        <>
          Как оператор обрабатывает персональные данные. Переключатель «человеческий язык» показывает короткую суть.
        </>
      }
      meta={
        <>
          <span className="legal-pill">
            <CalendarDays size={13} /> Версия {PRIVACY_POLICY_VERSION}
          </span>
          <span className="legal-pill">Подпись портала</span>
        </>
      }
      toc={toc}
      aside={
        <>
          <h2 className="legal-aside-title">Скачать и проверить</h2>
          <p className="legal-aside-text">
            HTML открывается на телефоне. В файле — электронная подпись: если текст подменят, проверка на сайте это покажет.
          </p>
          <PrivacyDownloadButton dark />
          <Link
            href="/contacts"
            className="btn btn-secondary"
            style={{ width: '100%', maxWidth: 420, marginTop: '0.65rem', justifyContent: 'center' }}
          >
            Вопросы — в контакты
          </Link>
        </>
      }
    >
      <LegalMdxShell>
        <LegalMdxBody source={source} />
      </LegalMdxShell>
    </LegalDocShell>
  );
}
