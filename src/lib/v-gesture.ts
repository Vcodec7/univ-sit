/** Detect a finger-drawn «V» (peak down) or caret «∧» (peak up). */

export type GesturePt = { x: number; y: number; t: number };

function isIgnoredTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return true;
  return Boolean(
    el.closest(
      'input, textarea, select, [contenteditable="true"], .qa-sheet-root, .yp-sheet, [role="dialog"]'
    )
  );
}

function bounds(points: GesturePt[]) {
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function interiorExtremum(points: GesturePt[], pickMax: boolean) {
  const n = points.length;
  const i0 = Math.max(1, Math.floor(n * 0.1));
  const i1 = Math.min(n - 2, Math.ceil(n * 0.9));
  let best = i0;
  for (let i = i0; i <= i1; i++) {
    if (pickMax ? points[i].y > points[best].y : points[i].y < points[best].y) best = i;
  }
  return best;
}

function isPeakGesture(points: GesturePt[], peakDown: boolean) {
  const { width, height } = bounds(points);
  if (height < 32 || width < 22) return false;
  const apexI = interiorExtremum(points, peakDown);
  const apex = points[apexI];
  const start = points[0];
  const end = points[points.length - 1];
  const riseStart = peakDown ? apex.y - start.y : start.y - apex.y;
  const riseEnd = peakDown ? apex.y - end.y : end.y - apex.y;
  if (riseStart < height * 0.22 || riseEnd < height * 0.22) return false;
  if (Math.abs(start.x - end.x) < 18) return false;
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  if (apex.x < left - 16 || apex.x > right + 16) return false;
  const mid = (left + right) / 2;
  if (Math.abs(apex.x - mid) > (right - left) * 0.62 + 24) return false;
  return true;
}

export function isVGesture(points: GesturePt[]) {
  if (points.length < 5) return false;
  const dur = points[points.length - 1].t - points[0].t;
  if (dur < 50 || dur > 4500) return false;
  const { width, height } = bounds(points);
  if (width > height * 3.2) return false;
  return isPeakGesture(points, true) || isPeakGesture(points, false);
}

export function attachVGesture(onV: () => void) {
  let pts: GesturePt[] = [];
  let tracking = false;
  let pointerId: number | null = null;
  let armed = false;
  let locked = false;
  let suppressClickUntil = 0;

  const reset = () => {
    tracking = false;
    pointerId = null;
    armed = false;
    locked = false;
    pts = [];
  };

  const finish = () => {
    if (!tracking) return;
    const hit = armed && isVGesture(pts);
    reset();
    if (hit) {
      suppressClickUntil = performance.now() + 450;
      onV();
    }
  };

  const onStart = (e: PointerEvent) => {
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isIgnoredTarget(e.target)) return;
    tracking = true;
    armed = false;
    locked = false;
    pointerId = e.pointerId;
    pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  };

  const onMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    const last = pts[pts.length - 1];
    const step = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    if (step < 1.5) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > 160) pts = pts.slice(-160);
    const origin = pts[0];
    const dx = Math.abs(e.clientX - origin.x);
    const dy = Math.abs(e.clientY - origin.y);
    const travel = Math.hypot(dx, dy);
    if (travel > 12) armed = true;
    if (!locked && travel > 10) {
      const fromVertical = dy > 0 ? dx / dy : 99;
      if (fromVertical > 0.2 || dx > dy) locked = true;
    }
    if (locked) e.preventDefault();
  };

  const onUp = (e: PointerEvent) => {
    if (!tracking) return;
    if (pointerId != null && e.pointerId !== pointerId) return;
    finish();
  };

  const onClick = (e: Event) => {
    if (performance.now() > suppressClickUntil) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const opts: AddEventListenerOptions = { capture: true, passive: false };
  window.addEventListener('pointerdown', onStart, opts);
  window.addEventListener('pointermove', onMove, opts);
  window.addEventListener('pointerup', onUp, opts);
  window.addEventListener('pointercancel', onUp, opts);
  window.addEventListener('click', onClick, true);

  return () => {
    window.removeEventListener('pointerdown', onStart, true);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
    window.removeEventListener('click', onClick, true);
    reset();
  };
}

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
