import test from 'node:test';
import assert from 'node:assert/strict';

function bounds(points) {
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

function interiorExtremum(points, pickMax) {
  const n = points.length;
  const i0 = Math.max(1, Math.floor(n * 0.1));
  const i1 = Math.min(n - 2, Math.ceil(n * 0.9));
  let best = i0;
  for (let i = i0; i <= i1; i++) {
    if (pickMax ? points[i].y > points[best].y : points[i].y < points[best].y) best = i;
  }
  return best;
}

function isPeakGesture(points, peakDown) {
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

function isVGesture(points) {
  if (points.length < 5) return false;
  const dur = points[points.length - 1].t - points[0].t;
  if (dur < 50 || dur > 4500) return false;
  const { width, height } = bounds(points);
  if (width > height * 3.2) return false;
  return isPeakGesture(points, true) || isPeakGesture(points, false);
}

function stroke(coords, t0 = 0) {
  return coords.map(([x, y], i) => ({ x, y, t: t0 + i * 20 }));
}

test('recognizes a classic V', () => {
  const pts = stroke([
    [40, 40],
    [55, 80],
    [70, 130],
    [90, 180],
    [110, 130],
    [125, 80],
    [140, 40],
  ]);
  assert.equal(isVGesture(pts), true);
});

test('recognizes a caret', () => {
  const pts = stroke([
    [40, 180],
    [55, 130],
    [70, 80],
    [90, 40],
    [110, 80],
    [125, 130],
    [140, 180],
  ]);
  assert.equal(isVGesture(pts), true);
});

test('rejects a straight swipe', () => {
  const pts = stroke([
    [40, 40],
    [40, 80],
    [40, 120],
    [40, 160],
    [40, 200],
  ]);
  assert.equal(isVGesture(pts), false);
});
