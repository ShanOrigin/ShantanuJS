//+++++++++++++++++++++++++++
//  Function to get control points on arc semi circle
//+++++++++++++++++++++++++++
import type { CurveInfo } from '../../../../models/types/animation';

/**
 * Determines the curvature direction for an arc based on a bend factor.
 *
 * Purpose:
 * - Converts a bend value (from -1 to 1) into a sign indicating the direction of the curve.
 * - Positive bend results in one curve direction, negative bend in the opposite.
 *
 * Dependency:
 * - Pure JavaScript calculation; does not rely on any graphics API or DOM API.
 *
 * @param bend - A number between -1 and 1 representing the curvature factor.
 *
 * @returns An object containing `arcCurveSign`: -1, 0, or 1, indicating the curve direction.
 */

export function getArcCurveControlInfo(
  bend: number // bend ∈ [-1, 1], like curvature factor
) {
  let arcCurveSign = 0;
  if (bend > 0) {
    arcCurveSign = -1;
  } else if (bend < 0) {
    arcCurveSign = 1;
  }
  return {
    arcCurveSign
  };
}

/**
 * Computes the coordinates of a point along a semicircular arc between two points.
 *
 * Purpose:
 * - Provides the (x, y) position on a semicircle at a given progress `t` along the arc.
 * - Uses the bend direction from `CurveInfo` to determine clockwise or counterclockwise sweep.
 * - Useful for animating objects along curved paths or creating arc-based movements.
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
 * @returns An object `{ x, y }` representing the coordinates of the point along the semicircle.
 */

export function getSemiCirclePoint(
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

  const r = dist / 2;

  // Angle of first point (relative to center)
  const angle1 = Math.atan2(y1 - cy, x1 - cx);
  // Sweep 180° in direction of bend
  const sweep = Math.PI * (info?.arcCurveSign ?? 1);

  // Interpolated angle
  const angle = angle1 + t * sweep;

  // Coordinates on semicircle
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);

  return { x, y };
}
