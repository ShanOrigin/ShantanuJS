import type { CurveInfo } from '../../../types/animation';
/**
 * Computes the coordinates of a point along an elliptical arc between two points.
 *
 * Purpose:
 * - Provides the (x, y) position on an ellipse at a given progress `t` along the arc.
 * - Uses the bend factor (`arcCurveSign`) from `CurveInfo` to determine the vertical radius.
 * - Useful for animating objects along elliptical paths or creating stretched arc motions.
 *
 * Dependency:
 * - Requires basic JavaScript math functions (`Math.atan2`, `Math.cos`, `Math.sin`, `Math.hypot`).
 * - Does not depend on any graphics API or DOM API.
 *
 * @param x1 - X-coordinate of the starting point.
 * @param y1 - Y-coordinate of the starting point.
 * @param x2 - X-coordinate of the ending point.
 * @param y2 - Y-coordinate of the ending point.
 * @param t - Progress along the arc from 0 (start) to 1 (end).
 * @param info - An object containing curve info (e.g., `arcCurveSign`) from `getArcCurveControlInfo`.
 *
 * @returns An object `{ x, y }` representing the coordinates of the point along the ellipse.
 */
export function getEllipsePoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number, // progress along arc [0..1]
  info: CurveInfo
) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);

  if (dist === 0) {
    return { x: x1, y: y1 };
  }

  // Horizontal radius (half of the distance between points)
  const rx = dist / 2;
  const bend = info?.arcCurveSign ?? 1;
  // Vertical radius scaled by bend factor
  const ry = rx * bend;

  // Angle of first point (relative to center)
  const angle1 = Math.atan2(y1 - cy, x1 - cx);
  // Sweep 180° in direction of bend
  const sweep = Math.PI * (bend >= 0 ? 1 : -1);

  // Interpolated angle
  const angle = angle1 + t * sweep;

  // Coordinates on ellipse
  const x = cx + rx * Math.cos(angle);
  const y = cy + ry * Math.sin(angle);

  return { x, y };
}
