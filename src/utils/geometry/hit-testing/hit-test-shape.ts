/*
import type { GraphicsEntity } from '../../shapes/graphicsEntity/graphicsEntity';
import type { IGraphicalElementProperties } from '../../properties/specific/specificProperties';
import { DEV_INTERNAL_ACCESS } from '../../utils/internals/accessKeys.js';
import { Log } from '../../utils/helpers/helpers.js';

type Shape = GraphicsEntity<keyof IGraphicalElementProperties>;
type HitTestCommonGeoSet = {
  shape: string;
  buffer: Float32Array;
  stroke: number;
  radius: number;
  rx: number;
  ry: number;
};
*/
/**
 * Entry point for precise shape hit testing.
 *
 * PURPOSE:
 * --------
 * - Converts pointer coordinates from world space → local shape space
 * - Extracts minimal geometry/state required for hit testing
 * - Delegates to shape-specific algorithms (no direct shape dependency)
 *
 * DESIGN:
 * -------
 * - Uses inverse world matrix → avoids transforming geometry
 * - Operates purely on canonical buffer (no transforms applied)
 * - Unifies fill + stroke hit logic
 *
 * ASSUMPTION:
 * -----------
 * - Buffer is homogeneous: [x, y, 1, ...]
 * - worldMatrix represents full composed transform of shape
 *
 * @param shape Graphics entity instance
 * @param x Pointer X in world/canvas space
 * @param y Pointer Y in world/canvas space
 * @returns true if hit detected
 */

/*
export function hitTestShape(shape: Shape, x: number, y: number): boolean {
  // ------------------------------------------------------------------
  // STEP 1: Extract internal geometry (trusted internal access)
  // ------------------------------------------------------------------
  const geo = shape.getIGeo(DEV_INTERNAL_ACCESS) as Omit<
    HitTestCommonGeoSet,
    'stroke'
  > & { worldMatrix: Float32Array };

  // ------------------------------------------------------------------
  // STEP 2: Transform pointer → local shape space
  // ------------------------------------------------------------------
  // This avoids transforming geometry itself (more efficient)
  const inv = invertMatrix(geo.worldMatrix);
  const p = applyMatrix(inv, x, y);

  Log('transformed points = ', p);

  // ------------------------------------------------------------------
  // STEP 3: Build minimal property set (decoupled from shape)
  // ------------------------------------------------------------------
  const commonGeoSet: HitTestCommonGeoSet = {
    shape: geo.shape, // shape identifier
    buffer: geo.buffer as Float32Array, // canonical geometry buffer
    stroke: shape.style['stroke-width'] ?? 0, // stroke width (fallback 0)
    radius: geo.radius, // point radius
    rx: geo.rx, // rect horizontal radius
    ry: geo.ry // rect vertical radius
  };

  // ------------------------------------------------------------------
  // STEP 4: Delegate to shape-specific logic
  // ------------------------------------------------------------------
  return hitTestByType(commonGeoSet, p.x, p.y);
}
*/
/**
 * Dispatches hit testing based on shape type.
 *
 * PURPOSE:
 * --------
 * - Routes hit testing to specialized geometry functions
 * - Ensures each shape uses optimal mathematical model
 *
 * DESIGN:
 * -------
 * - Operates only on primitive data (no object coupling)
 * - All coordinates are already in LOCAL space
 * - Stroke is consistently applied across all shapes
 *
 * SHAPE HANDLING:
 * ---------------
 * - Lines / polylines → distance-to-segment
 * - Polygon → fill + edge detection
 * - Rect → box + rounded corner logic
 * - Circle / ellipse → analytic equations
 * - Text / Image → fallback to rectangle bounds
 *
 * @param p Minimal geometry + style data
 * @param x Local X coordinate (post-transform)
 * @param y Local Y coordinate (post-transform)
 * @returns true if point lies inside shape (including stroke region)
 */
/*
function hitTestByType(p: HitTestCommonGeoSet, x: number, y: number): boolean {
  switch (p.shape) {
    // ------------------------------------------------------------
    // POINT → radial distance check
    // ------------------------------------------------------------
    case 'point':
      return hitPoint(p.buffer, p.radius, p.stroke, x, y);

    // ------------------------------------------------------------
    // LINE → segment distance
    // ------------------------------------------------------------
    case 'line':
      return hitLine(p.buffer, p.stroke, x, y);

    // ------------------------------------------------------------
    // POLYLINE / CURVES → segment-wise approximation
    // ------------------------------------------------------------
    case 'polyline':
    case 'curve':
    case 'cubicCurve':
    case 'quadraticCurve':
    case 'ellipticalCurve':
    case 'arc':
      return hitPolyline(p.buffer, p.stroke, x, y);

    // ------------------------------------------------------------
    // POLYGON → edge + inside fill (ray casting)
    // ------------------------------------------------------------
    case 'polygon':
      return hitPolygon(p.buffer, p.stroke, x, y);

    // ------------------------------------------------------------
    // RECTANGLE → bounds + rounded corners
    // ------------------------------------------------------------
    case 'rect':
      return hitRect(p.buffer, p.rx, p.ry, p.stroke, x, y);

    // ------------------------------------------------------------
    // CIRCLE → center-distance
    // ------------------------------------------------------------
    case 'circle':
      return hitCircle(p.buffer, p.stroke, x, y);

    // ------------------------------------------------------------
    // ELLIPSE → normalized equation
    // ------------------------------------------------------------
    case 'ellipse':
      return hitEllipse(p.buffer, p.stroke, x, y);

    // ------------------------------------------------------------
    // TEXT / IMAGE → treated as rectangular bounds
    // ------------------------------------------------------------
    case 'text':
    case 'image':
      return hitRect(p.buffer, 0, 0, p.stroke, x, y);

    // ------------------------------------------------------------
    // UNKNOWN → no hit
    // ------------------------------------------------------------
    default:
      return false;
  }
}
*/
/**
 * Applies a 2D affine transformation (column-major, homogeneous) to a point.
 *
 * MATRIX FORMAT:
 * --------------
 * m = [ a, b, 0,
 *       c, d, 0,
 *       e, f, 1 ]
 *
 * - Stored as flat Float32Array (column-major)
 * - Represents combined transform (translation, rotation, scale, skew)
 *
 * OPERATION:
 * ----------
 * Transforms world/local point (x, y) using:
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 *
 * USE CASE:
 * ---------
 * - Used for forward transform OR inverse transform (if matrix already inverted)
 * - Critical for hit testing (world → local space mapping)
 *
 * @param m Affine transformation matrix (Float32Array)
 * @param x Input X coordinate
 * @param y Input Y coordinate
 * @returns Transformed point { x, y }
 */
function applyMatrix(m: Float32Array, x: number, y: number) {
  return {
    x: m[0] * x + m[3] * y + m[6],
    y: m[1] * x + m[4] * y + m[7],
  };
}

/**
 * Computes inverse of a 2D affine transformation matrix (homogeneous).
 *
 * MATRIX FORMAT:
 * --------------
 * Input matrix (column-major):
 * m = [ a, b, 0,
 *       c, d, 0,
 *       e, f, 1 ]
 *
 * Only the 2×2 linear part [a b; c d] is inverted,
 * and translation (e, f) is adjusted accordingly.
 *
 * MATHEMATICS:
 * ------------
 * det = a*d - b*c
 *
 * Inverse:
 * [  d  -b   0
 *  -c   a   0
 *   (c*f - d*e)   (b*e - a*f)   1 ] / det
 *
 * BEHAVIOR:
 * ---------
 * - If determinant = 0 → matrix is non-invertible (singular)
 * - In that case, original matrix is returned (fallback, not ideal)
 *
 * USE CASE:
 * ---------
 * - Required for hit testing:
 *   world point → local space transformation
 *
 * @param m Affine matrix (Float32Array, column-major)
 * @returns Inverted matrix (Float32Array)
 */
function invertMatrix(m: Float32Array): Float32Array {
  const [a, b, _, c, d, __, e, f] = m;

  const det = a * d - b * c;

  if (det === 0) {
    // Non-invertible matrix → fallback (should be avoided upstream)
    return m;
  }

  const invDet = 1 / det;

  return new Float32Array([
    d * invDet,
    -b * invDet,
    0,
    -c * invDet,
    a * invDet,
    0,
    (c * f - d * e) * invDet,
    (b * e - a * f) * invDet,
    1,
  ]);
}

/**
 * Point hit test.
 *
 * - Buffer: [cx, cy, 1]
 * - Hit if pointer lies within (radius + stroke/2)
 */
function hitPoint(
  buf: Float32Array,
  radius: number,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const cx = buf[0];
  const cy = buf[1];

  const dx = x - cx;
  const dy = y - cy;

  const R = radius + stroke / 2;

  return dx * dx + dy * dy <= R * R;
}

/**
 * Distance from point to line segment.
 *
 * - Core primitive used by line/polyline/polygon
 * - Returns shortest Euclidean distance
 */
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;

  // Clamp projection inside segment
  t = t < 0 ? 0 : t > 1 ? 1 : t;

  const lx = x1 + t * dx;
  const ly = y1 + t * dy;

  return Math.hypot(px - lx, py - ly);
}

/**
 * Line hit test.
 *
 * - Buffer: [x1, y1, 1, x2, y2, 1]
 * - Hit if distance ≤ stroke/2
 */
function hitLine(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const half = stroke / 2;

  return pointToSegmentDistance(x, y, buf[0], buf[1], buf[3], buf[4]) <= half;
}

/**
 * Polyline hit test.
 *
 * - Buffer: [x1, y1, 1, x2, y2, 1, ...]
 * - Iterates segment-wise
 * - Hit if any segment within stroke/2
 */
function hitPolyline(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const half = stroke / 2;

  for (let i = 0; i < buf.length - 3; i += 3) {
    if (
      pointToSegmentDistance(
        x,
        y,
        buf[i],
        buf[i + 1],
        buf[i + 3],
        buf[i + 4],
      ) <= half
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Polygon hit test.
 *
 * - Buffer: same as polyline (closed implicitly)
 * - Hit if:
 *   1. Inside polygon OR
 *   2. Within stroke distance of edges
 */
function hitPolygon(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number,
): boolean {
  // Stroke check (edges)
  if (hitPolyline(buf, stroke, x, y)) return true;

  // Ray-casting for inside
  let inside = false;

  const n = buf.length;

  for (let i = 0, j = n - 3; i < n; j = i, i += 3) {
    const xi = buf[i];
    const yi = buf[i + 1];

    const xj = buf[j];
    const yj = buf[j + 1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Circle hit test (buffer uses point on circumference).
 *
 * Buffer:
 * [cx, cy, 1, px, py, 1]
 * where (px, py) lies on circle circumference (parallel direction)
 *
 * Logic:
 * - Compute radius = distance(center → circumference point)
 * - Hit if inside radius + stroke/2
 */
function hitCircle(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const cx = buf[0];
  const cy = buf[1];

  // point on circumference
  const px = buf[3];
  const py = buf[4];

  // derive radius from center → circumference point
  const r = Math.hypot(px - cx, py - cy);

  const dx = x - cx;
  const dy = y - cy;

  const d = Math.hypot(dx, dy);

  // inside fill OR within stroke band
  return d <= r + stroke / 2;
}

/**
 * Ellipse hit test (buffer uses two orthogonal circumference points).
 *
 * Buffer:
 * [cx, cy, 1, rxPointX, rxPointY, 1, ryPointX, ryPointY, 1]
 *
 * Interpretation:
 * - (rxPointX, rxPointY) → point along major axis (parallel)
 * - (ryPointX, ryPointY) → point along minor axis (perpendicular)
 *
 * Logic:
 * - rx = distance(center → rx point)
 * - ry = distance(center → ry point)
 * - Evaluate normalized ellipse equation
 * - Accept inside + stroke band
 */
function hitEllipse(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const cx = buf[0];
  const cy = buf[1];

  // axis points
  const rxpX = buf[3];
  const rxpY = buf[4];

  const rypX = buf[6];
  const rypY = buf[7];

  // derive radii from geometry
  const rx = Math.hypot(rxpX - cx, rxpY - cy);
  const ry = Math.hypot(rypX - cx, rypY - cy);

  const dx = x - cx;
  const dy = y - cy;

  // normalized ellipse equation
  const v = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

  // inside fill
  if (v <= 1) return true;

  // stroke band (approximation)
  const threshold = stroke / Math.max(rx, ry);

  return Math.abs(v - 1) <= threshold;
}

/**
 * Rectangle hit test with optional rounded corners and stroke support.
 *
 * BUFFER FORMAT:
 * --------------
 * buffer = [x1, y1, 1, ..., x2, y2, 1]
 * - (x1, y1) → top-left corner
 * - (x2, y2) → bottom-right corner
 *
 * PARAMETERS:
 * -----------
 * rx, ry  → corner radii (horizontal / vertical)
 * stroke  → stroke width (expanded outward by stroke/2)
 * x, y    → pointer coordinates in LOCAL (already transformed) space
 *
 * LOGIC:
 * ------
 * 1. Perform fast AABB rejection including stroke expansion
 * 2. If no rounded corners → accept directly
 * 3. For rounded corners:
 *    - Detect if point lies inside a corner region
 *    - If yes → evaluate against corner ellipse (expanded by stroke)
 *    - If no → point lies inside central rectangle
 *
 * RESULT:
 * -------
 * Returns true if point lies inside rectangle fill OR within stroke boundary
 */
function hitRect(
  buffer: Float32Array,
  rx: number,
  ry: number,
  stroke: number,
  x: number,
  y: number,
): boolean {
  const x1 = buffer[0],
    y1 = buffer[1];
  const x2 = buffer[6],
    y2 = buffer[7];

  const h = stroke / 2;

  // ------------------------------------------------------------
  // STEP 1: Expanded bounding box (includes stroke thickness)
  // ------------------------------------------------------------
  const left = x1 - h;
  const right = x2 + h;
  const top = y1 - h;
  const bottom = y2 + h;

  // Fast reject outside expanded bounds
  if (x < left || x > right || y < top || y > bottom) return false;

  // ------------------------------------------------------------
  // STEP 2: No rounded corners → inside rectangle
  // ------------------------------------------------------------
  if (rx <= 0 || ry <= 0) return true;

  // ------------------------------------------------------------
  // STEP 3: Determine if point lies in a corner region
  // ------------------------------------------------------------

  // Find nearest corner ellipse center (if applicable)
  const cx = x < x1 + rx ? x1 + rx : x > x2 - rx ? x2 - rx : null;

  const cy = y < y1 + ry ? y1 + ry : y > y2 - ry ? y2 - ry : null;

  // If not in any corner → inside central rectangle
  if (cx === null || cy === null) return true;

  // ------------------------------------------------------------
  // STEP 4: Corner ellipse hit test (with stroke expansion)
  // ------------------------------------------------------------
  const dx = x - cx;
  const dy = y - cy;

  const orx = rx + h;
  const ory = ry + h;

  // Ellipse equation check
  return (dx * dx) / (orx * orx) + (dy * dy) / (ory * ory) <= 1;
}
