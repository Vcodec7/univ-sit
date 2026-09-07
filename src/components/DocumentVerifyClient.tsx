'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { FileCheck2, ScrollText, Shield } from 'lucide-react';

export default function DocumentVerifyClient() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [err, setErr] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    const value = raw.trim();
    if (!value) {
      setErr('Вставьте ссылку проверки из скачанного PDF.');
      return;
    }
    try {
      const url = value.startsWith('http') ? new URL(value) : new URL(value, window.location.origin);
      if (url.pathname.includes('/privacy/verify')) {
        router.push(`${url.pathname}${url.search}`);
        return;
      }
      if (url.searchParams.get('v') && url.searchParams.get('h') && url.searchParams.get('s')) {
        router.push(`/privacy/verify${url.search}`);
        return;
      }
    } catch {
      /* fall through */
    }
    setErr('Не похоже на ссылку проверки. Откройте PDF с портала и скопируйте ссылку целиком.');
  }

  return (
    <div className="container docs-verify">
      <header className="docs-verify__hero">
        <span className="docs-verify__mark" aria-hidden>
          <Shield size={22} />
        </span>
        <h1 className="page-hero-title">Проверить документ</h1>
        <p>
          PDF с портала содержит метку версии и подпись. Вставьте ссылку из файла — или откройте проверку политики
          конфиденциальности.
        </p>
      </header>

      <form className="docs-verify__form" onSubmit={onSubmit}>
        <label htmlFor="docs-verify-url">Ссылка из PDF</label>
        <input
          id="docs-verify-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…/privacy/verify?v=…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        {err ? <p className="docs-verify__err">{err}</p> : null}
        <button type="submit" className="btn btn-primary">
          Проверить
        </button>
      </form>

      <div className="docs-verify__cards">
        <article>
          <ScrollText size={20} aria-hidden />
          <h2>Политика 152-ФЗ</h2>
          <p>Хеш текста и подпись сайта. Нужна ссылка из скачанного PDF или HTML.</p>
          <Link href="/privacy/verify">Открыть проверку политики</Link>
        </article>
        <article>
          <FileCheck2 size={20} aria-hidden />
          <h2>Список документов</h2>
          <p>Положения и правила — PDF. Шаблоны заявлений — категория Word.</p>
          <Link href="/documents">К документам</Link>
        </article>
      </div>
    </div>
  );
}
