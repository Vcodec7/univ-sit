/** Detect a finger-drawn letter «V» (peak at the bottom). */

type Pt = { x: number; y: number; t: number };

function isIgnoredTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return true;
  return Boolean(
    el.closest(
      'input, textarea, select, [contenteditable="true"], .qa-sheet-root, .yp-sheet, [role="dialog"], .yp-bottom-nav, .glass-nav'
    )
  );
}

function isVShape(points: Pt[]) {
  if (points.length < 10) return false;
  const dur = points[points.length - 1].t - points[0].t;
  if (dur < 140 || dur > 2000) return false;

  let apexI = 0;
  let minY = points[0].y;
  let minX = points[0].x;
  let maxX = points[0].x;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.y > points[apexI].y) apexI = i;
    if (p.y < minY) minY = p.y;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const apex = points[apexI];
  const height = apex.y - minY;
  const width = maxX - minX;
  if (height < 72 || width < 56) return false;
  if (width > height * 1.85) return false;

  const rel = apexI / (points.length - 1);
  if (rel < 0.28 || rel > 0.76) return false;

  const start = points[0];
  const end = points[points.length - 1];
  if (start.y > apex.y - height * 0.32) return false;
  if (end.y > apex.y - height * 0.32) return false;
  if (Math.abs(start.x - end.x) < 48) return false;

  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  if (apex.x < left + width * 0.12 || apex.x > right - width * 0.12) return false;
  return true;
}

export function attachVGesture(onV: () => void) {
  let pts: Pt[] = [];
  let tracking = false;
  let pointerId: number | null = null;

  const onStart = (e: PointerEvent) => {
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isIgnoredTarget(e.target)) return;
    tracking = true;
    pointerId = e.pointerId;
    pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  };

  const onMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    const last = pts[pts.length - 1];
    if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 3) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > 96) pts = pts.slice(-96);
  };

  const onEnd = (e: PointerEvent) => {
    if (!tracking || (pointerId != null && e.pointerId !== pointerId)) return;
    tracking = false;
    pointerId = null;
    if (isVShape(pts)) onV();
    pts = [];
  };

  window.addEventListener('pointerdown', onStart, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onEnd);
  window.addEventListener('pointercancel', onEnd);

  return () => {
    window.removeEventListener('pointerdown', onStart);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onEnd);
    window.removeEventListener('pointercancel', onEnd);
  };
}
