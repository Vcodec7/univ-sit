/** Swipe inward from the right edge — does not fight vertical scroll. */

export function attachEdgeSwipe(onOpen: () => void) {
  let tracking = false;
  let startX = 0;
  let startY = 0;
  let pointerId: number | null = null;

  const onStart = (e: PointerEvent) => {
    if (e.isPrimary === false) return;
    if (window.innerWidth - e.clientX > 28) return;
    tracking = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
  };

  const onMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    const dx = startX - e.clientX;
    const dy = Math.abs(e.clientY - startY);
    if (dx > 18 && dx > dy * 1.15) e.preventDefault();
  };

  const onUp = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    const dx = startX - e.clientX;
    const dy = Math.abs(e.clientY - startY);
    tracking = false;
    pointerId = null;
    if (dx > 36 && dx > dy * 1.2) onOpen();
  };

  const opts: AddEventListenerOptions = { capture: true, passive: false };
  window.addEventListener('pointerdown', onStart, opts);
  window.addEventListener('pointermove', onMove, opts);
  window.addEventListener('pointerup', onUp, opts);
  window.addEventListener('pointercancel', onUp, opts);
  return () => {
    window.removeEventListener('pointerdown', onStart, true);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
  };
}
