'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  count: number;
  children: ReactNode;
};

export default function EventHomeCarousel({ count, children }: Props) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      const i = ((next % count) + count) % count;
      indexRef.current = i;
      setIndex(i);
    },
    [count]
  );

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    setIndex((i) => {
      const nextI = i >= count ? 0 : i;
      indexRef.current = nextI;
      return nextI;
    });
  }, [count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) next();
    else prev();
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || count <= 1) return;
    let lock = false;
    const onWheel = (e: WheelEvent) => {
      const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dominant === 0) return;
      e.preventDefault();
      if (lock) return;
      lock = true;
      if (dominant > 0) goTo(indexRef.current + 1);
      else goTo(indexRef.current - 1);
      window.setTimeout(() => {
        lock = false;
      }, 380);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [count, goTo]);

  if (count === 0) return null;

  return (
    <div className="event-carousel" role="region" aria-roledescription="carousel" aria-label="Ближайшие мероприятия">
      <div
        ref={viewportRef}
        className="event-carousel__viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="event-carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {children}
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="event-carousel__nav event-carousel__nav--prev"
            onClick={prev}
            aria-label="Предыдущее мероприятие"
          >
            <ChevronLeft size={28} strokeWidth={2.4} aria-hidden />
          </button>
          <button
            type="button"
            className="event-carousel__nav event-carousel__nav--next"
            onClick={next}
            aria-label="Следующее мероприятие"
          >
            <ChevronRight size={28} strokeWidth={2.4} aria-hidden />
          </button>
          <div className="event-carousel__dots" role="tablist" aria-label="Слайды мероприятий">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                className={`event-carousel__dot${i === index ? ' is-active' : ''}`}
                aria-label={`Мероприятие ${i + 1} из ${count}`}
                aria-selected={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
