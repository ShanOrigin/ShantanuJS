//+++++++++++++++++++++++++++
// Function  to get control points in quadratic curve
//+++++++++++++++++++++++++++

/**
 * Calculates the control point for a quadratic Bézier curve between two points.
 *
 * Purpose:
 * - Determines a single intermediate control point `{ qcx, qcy }` that defines the curve's bend.
 * - The `bend` factor controls the magnitude and direction of the curve perpendicular to the straight line connecting the start and end points.
 * - Useful for creating smooth quadratic curves for animations, drawing, or path computations.
 *
 * Dependency:
 * - Uses only basic JavaScript math functions (`Math.hypot`).
 * - Does not depend on any graphics API, DOM API, or external library.
 *
 * @param x1 - X-coordinate of the starting point of the curve.
 * @param y1 - Y-coordinate of the starting point of the curve.
 * @param x2 - X-coordinate of the ending point of the curve.
 * @param y2 - Y-coordinate of the ending point of the curve.
 * @param bend - A number representing the curvature factor; positive or negative determines curve direction.
 *
 * @returns An object `{ qcx, qcy }` representing the coordinates of the quadratic curve's control point.
 */

export function getQuadraticCurveControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend: number
): { qcx: number; qcy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const perp = { x: -dy / dist, y: dx / dist };
  const curveHeight = dist * bend;
  const qcx = mx + perp.x * curveHeight;
  const qcy = my + perp.y * curveHeight;

  return { qcx, qcy };
}
