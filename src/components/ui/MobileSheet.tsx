'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Drawer } from 'vaul';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Desktop: centered dialog instead of bottom sheet */
  desktopCenter?: boolean;
};

export default function MobileSheet({ open, onOpenChange, title, children, desktopCenter = true }: Props) {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (max-width: 767px)');
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  if (!coarse && desktopCenter) {
    if (!open) return null;
    return (
      <div className="yp-center-modal" role="dialog" aria-modal="true" aria-labelledby="yp-sheet-title">
        <button type="button" className="yp-center-modal__backdrop" aria-label="Закрыть" onClick={() => onOpenChange(false)} />
        <div className="yp-center-modal__panel">
          <h2 id="yp-sheet-title" className="sr-only">
            {title}
          </h2>
          {children}
        </div>
      </div>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="yp-vaul-overlay" />
        <Drawer.Content className="yp-vaul-sheet">
          <div className="yp-vaul-handle" aria-hidden />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="yp-vaul-body">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
