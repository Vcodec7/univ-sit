'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Align = 'start' | 'end';

function placeDropdown(el: HTMLElement, trigger: HTMLElement, align: Align) {
  const r = trigger.getBoundingClientRect();
  const inner = el.querySelector<HTMLElement>('.nav-dropdown-body');
  const raw = Math.max(inner?.offsetWidth || 0, el.offsetWidth || 0, 220);
  const width = Math.min(raw, Math.max(220, window.innerWidth - 24));
  let left = align === 'end' ? r.right - width : r.left;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  el.style.position = 'fixed';
  el.style.top = `${Math.round(r.bottom)}px`;
  el.style.left = `${Math.round(left)}px`;
  el.style.right = 'auto';
  el.style.width = `${Math.round(width)}px`;
  el.style.maxWidth = `${Math.round(window.innerWidth - 24)}px`;
  el.style.transform = 'none';
  el.style.zIndex = '20050';
}

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

  const apply = () => {
    const el = panelRef.current;
    const trigger = getAnchorRef.current();
    if (!el || !trigger) return;
    placeDropdown(el, trigger, align);
  };

  const setPanel = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (node) apply();
  };

  useLayoutEffect(() => {
    if (!open) return;
    apply();
    const raf = window.requestAnimationFrame(apply);
    window.addEventListener('resize', apply);
    window.addEventListener('scroll', apply, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', apply);
      window.removeEventListener('scroll', apply, true);
    };
  }, [open, align, children]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={setPanel}
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
