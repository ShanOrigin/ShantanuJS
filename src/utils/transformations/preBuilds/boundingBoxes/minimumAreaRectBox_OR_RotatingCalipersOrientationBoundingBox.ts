export type Point = { x: number; y: number };
export type RotatedRect = {
  cx: number;
  cy: number; // center
  width: number;
  height: number;
  angle: number; // radians (orientation of longer side)
};

// ----------------------------------------------
// 1. Extract points from Nx3 homogeneous matrix
// ----------------------------------------------
// Input :
//     shapeTMat [x1,y1,1,x2,y2,1,......] N x 3 homogeneous
// Output :
//     [ [x1,y1] , [x2,y2] , ......]

export function extractPoints(shapeTMat: Float32Array): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < shapeTMat.length; i += 3) {
    const x = shapeTMat[i];
    const y = shapeTMat[i + 1];

    pts.push({ x, y });
  }
  return pts;
}

// =====================================================================
// 3. Minimum-Area Bounding Rectangle (Rotating Calipers)
// =====================================================================

// cross product of (b - a) × (c - a)
function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

// distance squared
function dist2(a: Point, b: Point) {
  const dx = a.x - b.x,
    dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Monotone chain convex hull (CCW, no duplicate final point)
function convexHull(pts: Point[]): Point[] {
  const p = pts.slice();
  p.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const lower: Point[] = [];
  for (const pt of p) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0
    )
      lower.pop();
    lower.push(pt);
  }

  const upper: Point[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0
    )
      upper.pop();
    upper.push(pt);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Project points onto axis (ux,uy) and perpendicular (-uy,ux)
function project(points: Point[], ux: number, uy: number) {
  let minU = Infinity,
    maxU = -Infinity;
  let minV = Infinity,
    maxV = -Infinity;

  const vx = -uy,
    vy = ux;

  for (const p of points) {
    const u = p.x * ux + p.y * uy;
    const v = p.x * vx + p.y * vy;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  return { minU, maxU, minV, maxV, vx, vy };
}

// Main rotating calipers
export function computeMinimumAreaRectangle(
  shapeMat: Float32Array
): RotatedRect {
  const pts = extractPoints(shapeMat);
  const n = pts.length;

  if (n === 0) return { cx: 0, cy: 0, width: 0, height: 0, angle: 0 };
  if (n === 1)
    return { cx: pts[0].x, cy: pts[0].y, width: 0, height: 0, angle: 0 };

  const hull = convexHull(pts);

  // Degenerate: line
  if (hull.length === 2) {
    const p1 = hull[0],
      p2 = hull[1];
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const width = Math.sqrt(dist2(p1, p2));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    return { cx, cy, width, height: 0, angle };
  }

  let best: RotatedRect | null = null;

  // Test each hull edge as candidate axis
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];

    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len = Math.hypot(ex, ey);
    if (len === 0) continue;

    const ux = ex / len,
      uy = ey / len;

    const proj = project(hull, ux, uy);
    const width = proj.maxU - proj.minU;
    const height = proj.maxV - proj.minV;
    const area = width * height;

    const cx =
      ((proj.minU + proj.maxU) / 2) * ux +
      ((proj.minV + proj.maxV) / 2) * proj.vx;
    const cy =
      ((proj.minU + proj.maxU) / 2) * uy +
      ((proj.minV + proj.maxV) / 2) * proj.vy;

    const rect: RotatedRect = {
      cx,
      cy,
      width,
      height,
      angle: Math.atan2(uy, ux)
    };
    if (!best || area < best.width * best.height) best = rect;
  }

  return best!;
}
