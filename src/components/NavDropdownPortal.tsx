'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Align = 'start' | 'end';

export default function NavDropdownPortal({
  open,
  getAnchor,
  align = 'start',
  onEnter,
  onLeave,
  children,
  className = '',
  id,
}: {
  open: boolean;
  getAnchor: () => HTMLElement | null;
  align?: Align;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const getAnchorRef = useRef(getAnchor);
  getAnchorRef.current = getAnchor;

  useLayoutEffect(() => {
    if (!open) return;
    const drop = panelRef.current;
    if (!drop) return;

    const place = () => {
      const trigger = getAnchorRef.current();
      if (!trigger || !panelRef.current) return;
      const r = trigger.getBoundingClientRect();
      const el = panelRef.current;
      const width = Math.max(el.offsetWidth, 220);
      let left = align === 'end' ? r.right - width : r.left;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      el.style.top = `${Math.round(r.bottom)}px`;
      el.style.left = `${Math.round(left)}px`;
      el.style.minWidth = `${Math.round(width)}px`;
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, children]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      data-nav-dropdown="1"
      className={`dropdown nav-dropdown-portal${className ? ` ${className}` : ''}`}
      role="menu"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="nav-dropdown-bridge" aria-hidden />
      <div className="nav-dropdown-body">{children}</div>
    </div>,
    document.body
  );
}
