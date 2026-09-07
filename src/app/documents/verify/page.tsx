import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata = { title: 'Проверка документа' };

export default function DocumentVerifyPage() {
  return (
    <div className="container catalog-page" style={{ paddingTop: '1rem', maxWidth: '40rem' }}>
      <h1 className="page-hero-title">Проверить документ</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
        Если файл или страница политики скачаны с этого портала, у них есть метка версии и цифровая подпись.
        Политику 152-ФЗ проверяйте по ссылке из скачанного PDF/HTML.
      </p>
      <p>
        <Link href="/privacy/verify">Проверить политику конфиденциальности</Link>
      </p>
      <p>
        <Link href="/documents">К списку документов</Link>
      </p>
      <p style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--muted)' }}>
        <Shield size={16} /> Документ подлинный, если совпадают версия, хеш текста и подпись сайта.
      </p>
    </div>
  );
}
