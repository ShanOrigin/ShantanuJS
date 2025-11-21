import { interpolatePointOnCurve } from './interpolatePointOnCurve.js';
import { getCubicCurveControlPoints } from '../curvePaths/cubicCurve.js';
import { getQuadraticCurveControlPoint } from '../curvePaths/quadraticCurve.js';
import { getArcCurveControlInfo } from '../curvePaths/arcCurve.js';

import type {
  Point,
  CurveType,
  CurveInfo,
  ArcTableEntry
} from '../../../types/animation';
import {
  getAdaptiveSmoothness,
  getCurveAdaptiveSmoothness
} from '../../animations/preBuilds/helpers/helpers.js';
//import type { IGraphicalElementProperties as IG } from '../../../../properties/provider/shapeProperties';
//import type { GraphicalElementComposer as GEC } from '../../../../core/graphics/graphics/graphicalElementComposer';

//+++++++++++++++++++++++++++
// Function  to generate control points and store and Calculate arc length parameterizati       on  on curve
//+++++++++++++++++++++++++++

/**
 * Clamps a bend value to the range [-1, 1].
 *
 * Purpose:
 * - Ensures the curvature factor stays within a valid range for curve generation.
 * - Prevents extreme or invalid curve behavior.
 *
 * Dependency:
 * - Uses only basic JavaScript math functions; no graphics API or DOM API required.
 *
 * @param bend - The input bend factor.
 * @returns A number constrained to the range [-1, 1].
 */

export function clampBend(bend: number): number {
  return Math.max(-1, Math.min(1, bend));
}

/**
 * Generates points along a specified curve between two points.
 *
 * Purpose:
 * - Computes interpolated points along linear, quadratic, cubic, or arc curves.
 * - Builds an arc-length table to track distances along the curve for animation or measurement purposes.
 * - Adapts smoothness based on distance and element parameters.
 * - Supports bend factor to control curvature.
 *
 * Dependency:
 * - Depends on helper functions such as `clampBend`, `getQuadraticCurveControlPoint`, `getCubicCurveControlPoints`, `getArcCurveControlInfo`, and `interpolatePointOnCurve`.
 * - Uses basic math functions (`Math.hypot`) but does not require any graphics API or DOM API.
 *
 * @param P1 - Starting point `{ x, y }` of the curve.
 * @param P2 - Ending point `{ x, y }` of the curve.
 * @param bend - Optional curvature factor; defaults to 0.
 * @param smoothness - Optional number of segments along the curve; if 0 or invalid, calculated adaptively.
 * @param curveName - Type of curve: `'linear'`, `'quadratic'`, `'cubic'`, or `'arc'`. Default is `'quadratic'`.
 *
 * @returns A tuple `[points, table, totalLength]` where:
 * - `points` → array of `{ x, y }` points along the curve.
 * - `table` → array of `{ t, distance }` entries representing the arc-length parameterization.
 * - `totalLength` → total length of the curve.
 */

export function generateCurvePoints({
  P1,
  P2,
  bend = 0,
  smoothness = 0,
  curveName = 'quadratic',
  pointsOnly = false,
  continuous = false,
  continuousCount = 1
}: {
  P1: Point;
  P2: Point;
  bend?: number;
  smoothness?: number;
  curveName?: CurveType;
  pointsOnly: boolean;
  continuous?: boolean;
  continuousCount?: number;
}): [Point[], ArcTableEntry[], number] | Point[] {
  const table: ArcTableEntry[] = [{ t: 0, distance: 0 }];
  const points: Point[] = [];
  let curveInfo: CurveInfo = {};
  let totalLength = 0;

  let { x: x1, y: y1 } = P1;
  let { x: x2, y: y2 } = P2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  //  const dist = Math.hypot(dx, dy);
  // If continuous mode is active, precompute base distanc
  if (bend === 0) curveName = 'linear';

  if (!Number.isFinite(smoothness) || smoothness <= 0) {
    smoothness = getCurveAdaptiveSmoothness(P1, P2, bend, curveName);
  }

  let lastT = 0;

  !continuous && (continuousCount = 1); // where continiousCount is given but not specified curve is continious so no continiouvity

  for (let count = 0; count < continuousCount; count++) {
    if (count > 0) {
      // flip bend if you want oscillation
      bend *= -1;

      // shift the segment forward in the same stride direction
      x1 = x2;
      y1 = y2;
      x2 = x1 + dx;
      y2 = y1 + dy;
    }

    switch (curveName) {
      case 'quadratic':
        curveInfo = getQuadraticCurveControlPoint(x1, y1, x2, y2, bend);
        break;
      case 'cubic':
        curveInfo = getCubicCurveControlPoints(x1, y1, x2, y2, bend);
        break;
      case 'arc':
        curveInfo = getArcCurveControlInfo(bend);
        break;
      case 'earc':
        curveInfo['arcCurveSign'] = bend;
        break;
      case 'linear':
        break;
      default:
        break;
    }

    for (let i = 0; i <= smoothness; i++) {
      //  const t = lastT +  i / smoothness;
      const t = i / smoothness;
      const absolute = interpolatePointOnCurve(
        x1,
        y1,
        x2,
        y2,
        t,
        curveName,
        curveInfo
      );

      points.push({ x: absolute.x, y: absolute.y });

      if (points.length > 1 && !pointsOnly) {
        const prev = points[points.length - 2];
        const curr = points[points.length - 1];
        const segmentLength = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        totalLength += segmentLength;
        const arct = (lastT * smoothness + i) / (smoothness * continuousCount);
        table.push({ t: arct, distance: totalLength });
      }
    }
    lastT += 1; // move to next segment
  }

  return pointsOnly ? points : [points, table, totalLength];
}
