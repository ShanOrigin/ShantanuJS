//+++++++++++++++++++++++++++
// Function to get control points on cubic curve
//+++++++++++++++++++++++++++

import type { Point } from '../../../types/animation';

/**
 * Calculates control points for a cubic Bézier curve between two points.
 *
 * Purpose:
 * - Generates the two intermediate control points (`c1` and `c2`) for a cubic Bézier curve.
 * - The `bend` factor determines the curvature direction and magnitude perpendicular to the straight line connecting the points.
 * - Useful for creating smooth curved paths or animations along a cubic Bézier trajectory.
 *
 * Dependency:
 * - Relies only on basic JavaScript math functions (`Math.hypot`).
 * - Does not depend on any graphics API, DOM API, or external library.
 *
 * @param x1 - X-coordinate of the starting point of the curve.
 * @param y1 - Y-coordinate of the starting point of the curve.
 * @param x2 - X-coordinate of the ending point of the curve.
 * @param y2 - Y-coordinate of the ending point of the curve.
 * @param bend - A number indicating the curvature factor; positive or negative determines curve direction.
 *
 * @returns An object containing two control points `{ c1, c2 }`, each with `{ x, y }` coordinates.
 */

export function getCubicCurveControlPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend: number
): { c1: Point; c2: Point } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const perp = { x: -dy / dist, y: dx / dist };
  const curveHeight = dist * bend;

  const c1 = {
    x: x1 + dx / 3 + perp.x * curveHeight,
    y: y1 + dy / 3 + perp.y * curveHeight
  };
  const c2 = {
    x: x1 + (2 * dx) / 3 + perp.x * curveHeight,
    y: y1 + (2 * dy) / 3 + perp.y * curveHeight
  };

  return { c1, c2 };
}
