/** Detect a finger-drawn «V» (peak down) or caret «∧» (peak up). */

type Pt = { x: number; y: number; t: number };

function isIgnoredTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return true;
  return Boolean(
    el.closest(
      'input, textarea, select, [contenteditable="true"], .qa-sheet-root, .yp-sheet, [role="dialog"]'
    )
  );
}

function span(points: Pt[]) {
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  let lowI = 0;
  let highI = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) {
      minY = p.y;
      highI = i;
    }
    if (p.y > maxY) {
      maxY = p.y;
      lowI = i;
    }
  }
  return { minX, maxX, minY, maxY, lowI, highI, width: maxX - minX, height: maxY - minY };
}

function armsMeet(points: Pt[], apexI: number, height: number, peakDown: boolean) {
  const apex = points[apexI];
  const start = points[0];
  const end = points[points.length - 1];
  const rel = apexI / Math.max(1, points.length - 1);
  if (rel < 0.18 || rel > 0.82) return false;
  if (peakDown) {
    if (start.y > apex.y - height * 0.22) return false;
    if (end.y > apex.y - height * 0.22) return false;
  } else {
    if (start.y < apex.y + height * 0.22) return false;
    if (end.y < apex.y + height * 0.22) return false;
  }
  if (Math.abs(start.x - end.x) < 28) return false;
  return true;
}

export function isVGesture(points: Pt[]) {
  if (points.length < 6) return false;
  const dur = points[points.length - 1].t - points[0].t;
  if (dur < 80 || dur > 2800) return false;
  const { width, height, lowI, highI, minX, maxX } = span(points);
  if (height < 44 || width < 32) return false;
  if (width > height * 2.4) return false;

  const down = armsMeet(points, lowI, height, true);
  const up = armsMeet(points, highI, height, false);
  if (!down && !up) return false;

  const apex = points[down ? lowI : highI];
  const left = minX;
  const right = maxX;
  const w = right - left;
  if (apex.x < left + w * 0.08 || apex.x > right - w * 0.08) return false;
  return true;
}

export function attachVGesture(onV: () => void) {
  let pts: Pt[] = [];
  let tracking = false;
  let pointerId: number | null = null;
  let capturing: HTMLElement | null = null;
  let armed = false;

  const onStart = (e: PointerEvent) => {
    if (e.isPrimary === false) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isIgnoredTarget(e.target)) return;
    tracking = true;
    armed = false;
    pointerId = e.pointerId;
    pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    const el = e.target as HTMLElement | null;
    if (el && typeof el.setPointerCapture === 'function') {
      try {
        el.setPointerCapture(e.pointerId);
        capturing = el;
      } catch {
        capturing = null;
      }
    }
  };

  const onMove = (e: PointerEvent) => {
    if (!tracking || e.pointerId !== pointerId) return;
    const last = pts[pts.length - 1];
    const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    if (dist < 2) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > 120) pts = pts.slice(-120);
    const travel = Math.hypot(e.clientX - pts[0].x, e.clientY - pts[0].y);
    if (travel > 22) {
      armed = true;
      e.preventDefault();
    }
  };

  const finish = (e?: PointerEvent) => {
    if (!tracking) return;
    if (e && pointerId != null && e.pointerId !== pointerId) return;
    tracking = false;
    if (capturing && pointerId != null) {
      try {
        capturing.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
    capturing = null;
    pointerId = null;
    const hit = armed && isVGesture(pts);
    pts = [];
    armed = false;
    if (hit) onV();
  };

  window.addEventListener('pointerdown', onStart, { capture: true, passive: false });
  window.addEventListener('pointermove', onMove, { capture: true, passive: false });
  window.addEventListener('pointerup', finish, { capture: true });
  window.addEventListener('pointercancel', finish, { capture: true });

  return () => {
    window.removeEventListener('pointerdown', onStart, true);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', finish, true);
    window.removeEventListener('pointercancel', finish, true);
  };
}
