'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

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
    <div className="admin-error-fallback yp-empty" role="alert">
      <AlertTriangle className="yp-empty__icon" size={44} aria-hidden />
      <h1 className="admin-error-fallback__title">Ошибка загрузки данных раздела</h1>
      <p className="admin-error-fallback__text">
        Нажмите «Повторить попытку» или откройте другой пункт меню.
      </p>
      <Button variant="outline" onClick={() => reset()}>
        Попробовать снова
      </Button>
    </div>
  );
}
