//+++++++++++++++++++++++++++
// Function to Calculate control points on curve
//+++++++++++++++++++++++++++

import type { Point, CurveType, CurveInfo } from '../../../types/animation';
import { lerp } from '../../animation/preBuilds/helpers/helpers.js';
import { getSemiCirclePoint } from '../curvePaths/arcCurve.js';
import { getEllipsePoint } from '../curvePaths/ellipseArcCurve.js';

/**
 * Computes the interpolated point at a given progress along a specified curve.
 *
 * Purpose:
 * - Returns the `{ x, y }` position along a linear, quadratic, cubic, or arc curve at a normalized progress `t` (0 to 1).
 * - Supports different curve types and uses the corresponding control points or curve information.
 * - Essential for animating objects along curves or calculating points for path rendering.
 *
 * Dependency:
 * - Depends on helper functions such as `lerp` and `getSemiCirclePoint`.
 * - Uses only basic JavaScript math operations; does not require any graphics API or DOM API.
 *
 * @param x1 - X-coordinate of the starting point of the curve.
 * @param y1 - Y-coordinate of the starting point of the curve.
 * @param x2 - X-coordinate of the ending point of the curve.
 * @param y2 - Y-coordinate of the ending point of the curve.
 * @param t - Normalized progress along the curve (0 = start, 1 = end).
 * @param curveName - Type of curve: `'linear'`, `'quadratic'`, `'cubic'`, or `'arc'`.
 * @param curveInfo - Curve-specific information (control points or arc data) required for the interpolation.
 *
 * @returns A `Point` object `{ x, y }` representing the interpolated position on the curve.
 */

export function interpolatePointOnCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
  curveName: CurveType,
  curveInfo: CurveInfo
): Point {
  switch (curveName) {
    case 'linear':
      return {
        x: lerp(x1, x2, t),
        y: lerp(y1, y2, t)
      };

    case 'quadratic': {
      const { qcx: cx, qcy: cy } = curveInfo as { qcx: number; qcy: number };
      const oneMinusT = 1 - t;
      return {
        x: oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cx + t * t * x2,
        y: oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cy + t * t * y2
      };
    }

    case 'cubic': {
      const { c1, c2 } = curveInfo as { c1: Point; c2: Point };

      const oneMinusT = 1 - t;
      return {
        x:
          oneMinusT ** 3 * x1 +
          3 * oneMinusT ** 2 * t * c1.x +
          3 * oneMinusT * t ** 2 * c2.x +
          t ** 3 * x2,
        y:
          oneMinusT ** 3 * y1 +
          3 * oneMinusT ** 2 * t * c1.y +
          3 * oneMinusT * t ** 2 * c2.y +
          t ** 3 * y2
      };
    }

    case 'arc': {
      return getSemiCirclePoint(x1, y1, x2, y2, t, curveInfo);
    }

    case 'earc': {
      return getEllipsePoint(x1, y1, x2, y2, t, curveInfo);
    }

    default:
      throw new Error(`Unsupported curve type: ${curveName}`);
  }
}
