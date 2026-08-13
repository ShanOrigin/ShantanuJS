import type { CurveInfo } from "../../../../models/types/geometry/curve";
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
  t: number,
  info: CurveInfo,
) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: x1, y: y1 };

  const rx = dist / 2;
  const bend = info?.arcDirection ?? 1; // bend factor

  const ry = rx * Math.abs(bend); // vertical radius (height)
  const sign = Math.sign(bend) || 1; // direction of bend (+up, -down)

  // angle of baseline between points
  const baseAngle = Math.atan2(dy, dx);

  // t in [0..1] maps to θ in [π, 0] to make it start at x1,y1 and end at x2,y2
  const theta = Math.PI * (1 - t);

  // Ellipse in local coordinates, where center is origin and major axis is horizontal
  const localX = rx * Math.cos(theta);
  const localY = sign * ry * Math.sin(theta);

  // Rotate ellipse to align with baseline
  const x = cx + localX * Math.cos(baseAngle) - localY * Math.sin(baseAngle);
  const y = cy + localX * Math.sin(baseAngle) + localY * Math.cos(baseAngle);

  return { x, y };
}
