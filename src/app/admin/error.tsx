'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="admin-error-fallback" role="alert">
      <h1 className="admin-error-fallback__title">Не удалось показать раздел</h1>
      <p className="admin-error-fallback__text">
        Ошибка на сервере. Нажмите «Попробовать снова» или откройте другой пункт меню.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Попробовать снова
      </button>
    </div>
  );
}
