import type { GraphicsEntity } from '../../shapes/graphicsEntity/graphicsEntity';
import type { IGraphicalElementProperties } from '../../properties/specific/specificProperties';
import { DEV_INTERNAL_ACCESS } from '../../utils/internals/accessKeys.js';

type Shape = GraphicsEntity<keyof IGraphicalElementProperties>;

/**
 * Entry hit test using extracted properties only.
 *
 * - Converts world → local using inverse world matrix
 * - Delegates to shape-specific logic with minimal data
 * - Uses stroke for all shapes (fill + stroke unified)
 * - Assumes buffer contains canonical geometry points
 */
export function hitTestShape(shape: Shape, x: number, y: number): boolean {
  const geo = shape.getIGeo(DEV_INTERNAL_ACCESS) as Record<
    string,
    string | number | Float32Array
  >;

  const inv = invertMatrix(geo.worldMatrix as Float32Array);
  const p = applyMatrix(inv, x, y);

  const props = {
    type: geo.shape,
    buffer: geo.buffer as Float32Array,
    stroke: shape.style['stroke-width'] ?? 0,
    radius: geo.radius,
    width: geo.width,
    height: geo.height,
    rx: geo.rx,
    ry: geo.ry
  };

  return hitTestByType(props, p.x, p.y);
}

/**
 * Dispatches hit testing using only primitive properties.
 */
function hitTestByType(p: any, x: number, y: number): boolean {
  switch (p.type) {
    case 'point':
      return hitPoint(p.radius, p.stroke, x, y);

    case 'line':
      return hitLine(p.buffer, p.stroke, x, y);

    case 'polyline':
    case 'curve':
    case 'cubicCurve':
    case 'quadraticCurve':
    case 'ellipticalCurve':
    case 'arc':
      return hitPolyline(p.buffer, p.stroke, x, y);

    case 'polygon':
      return hitPolygon(p.buffer, p.stroke, x, y);

    case 'rect':
      return hitRect(p.width, p.height, p.rx, p.ry, p.stroke, x, y);

    case 'circle':
      return hitCircle(p.radius, p.stroke, x, y);

    case 'ellipse':
      return hitEllipse(p.rx, p.ry, p.stroke, x, y);

    case 'text':
    case 'image':
      return hitRect(p.width, p.height, 0, 0, p.stroke, x, y);

    default:
      return false;
  }
}

/**
 * Matrix application (column-major affine).
 */
function applyMatrix(m: Float32Array, x: number, y: number) {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5]
  };
}

/**
 * Matrix inversion (2D affine).
 */
function invertMatrix(m: Float32Array): Float32Array {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c;

  if (det === 0) return m;

  const invDet = 1 / det;

  return new Float32Array([
    d * invDet,
    -b * invDet,
    -c * invDet,
    a * invDet,
    (c * f - d * e) * invDet,
    (b * e - a * f) * invDet
  ]);
}

/**
 * Point hit test using visible radius + stroke.
 */
function hitPoint(r: number, stroke: number, x: number, y: number): boolean {
  const R = r + stroke / 2;
  return x * x + y * y <= R * R;
}

/**
 * Line hit test using distance to segment.
 */
function hitLine(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number
): boolean {
  return (
    pointToSegmentDistance(x, y, buf[0], buf[1], buf[2], buf[3]) <= stroke / 2
  );
}

/**
 * Polyline hit test via segment iteration.
 */
function hitPolyline(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number
): boolean {
  for (let i = 0; i < buf.length - 2; i += 2) {
    if (
      pointToSegmentDistance(
        x,
        y,
        buf[i],
        buf[i + 1],
        buf[i + 2],
        buf[i + 3]
      ) <=
      stroke / 2
    )
      return true;
  }
  return false;
}

/**
 * Polygon hit test (fill + stroke).
 */
function hitPolygon(
  buf: Float32Array,
  stroke: number,
  x: number,
  y: number
): boolean {
  if (hitPolyline(buf, stroke, x, y)) return true;

  let inside = false;

  for (let i = 0, j = buf.length - 2; i < buf.length; j = i, i += 2) {
    const xi = buf[i],
      yi = buf[i + 1];
    const xj = buf[j],
      yj = buf[j + 1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Rectangle hit test with rounded corners and stroke.
 */
function hitRect(
  w: number,
  h: number,
  rx: number,
  ry: number,
  stroke: number,
  x: number,
  y: number
): boolean {
  const half = stroke / 2;

  // Outer expanded bounds
  if (x < -half || x > w + half || y < -half || y > h + half) return false;

  // Rounded corner handling
  if (rx > 0 || ry > 0) {
    const cx = Math.min(Math.max(x, rx), w - rx);
    const cy = Math.min(Math.max(y, ry), h - ry);

    const dx = x - cx;
    const dy = y - cy;

    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) return false;
  }

  // Inner hollow (stroke ring)
  const inner = x > half && x < w - half && y > half && y < h - half;

  return !inner;
}

/**
 * Circle hit test using stroke ring.
 */
function hitCircle(r: number, stroke: number, x: number, y: number): boolean {
  const d = Math.hypot(x, y);
  return Math.abs(d - r) <= stroke / 2 || d <= r;
}

/**
 * Ellipse hit test using normalized equation.
 */
function hitEllipse(
  rx: number,
  ry: number,
  stroke: number,
  x: number,
  y: number
): boolean {
  const v = (x * x) / (rx * rx) + (y * y) / (ry * ry);

  if (Math.abs(v - 1) <= stroke / Math.max(rx, ry)) return true;

  return v <= 1;
}

/**
 * Distance from point to segment.
 */
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const lx = x1 + t * dx;
  const ly = y1 + t * dy;

  return Math.hypot(px - lx, py - ly);
}
