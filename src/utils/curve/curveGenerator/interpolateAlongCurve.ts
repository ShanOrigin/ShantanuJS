import type { Point, ArcTableEntry } from '../../../types/animation';

import { lerp } from '../../animations/preBuilds/helpers/helpers.js';

/**
 * Interpolates a point along a precomputed array of points on a curve.
 *
 * Purpose:
 * - Returns the `{ x, y }` position corresponding to a normalized progress `t` (0 to 1) along a set of discrete points.
 * - Useful for animating objects along a curve when the curve is represented as sampled points rather than a continuous function.
 * - Handles edge cases for single-point arrays and clamps `t` to the [0, 1] range.
 *
 * Dependency:
 * - Depends on the `lerp` function for linear interpolation between two points.
 * - Uses only basic JavaScript math; does not rely on any graphics API or DOM API.
 *
 * @param points - An array of `Point` objects representing sampled positions along a curve.
 * @param t - Normalized progress along the curve (0 = start, 1 = end).
 *
 * @returns A `Point` object `{ x, y }` representing the interpolated position along the curve.
 */

export function interpolateAlongCurve(points: Point[], t: number): Point {
  if (points.length === 0) throw new Error('No points to interpolate.');
  if (points.length === 1) return points[0]!;

  const easedT = Math.max(0, Math.min(1, t));
  const totalSegments = points.length - 1;
  const segmentFloat = easedT * totalSegments;
  const segmentIndex = Math.floor(segmentFloat);
  const segmentT = segmentFloat - segmentIndex;

  const p1 = points[segmentIndex] as Point;

  const p2 = points[Math.min(segmentIndex + 1, points.length - 1)] as Point;

  return {
    x: lerp(p1.x, p2.x, segmentT),
    y: lerp(p1.y, p2.y, segmentT)
  };
}

/**
 * Computes the normalized progress `t` along a curve for a given distance.
 *
 * Purpose:
 * - Maps a physical distance along a curve to a normalized parameter `t` (0 to 1) using an arc-length table.
 * - Allows animations or movements to progress proportionally along a curve based on actual distances rather than parameter steps.
 * - Handles cases where the distance exceeds the total length by returning `t = 1`.
 *
 * Dependency:
 * - Uses only basic JavaScript math; relies on the structure of an `arcTable` but does not require graphics API or DOM API.
 *
 * @param distance - The distance along the curve for which to find the normalized progress.
 * @param arcTable - An array of `ArcTableEntry` objects, each containing `{ t, distance }` representing sampled positions along the curve.
 *
 * @returns A number `t` between 0 and 1 representing the normalized progress along the curve corresponding to the given distance.
 */

export function getTForDistance(
  distance: number,
  arcTable: ArcTableEntry[]
): number {
  for (let i = 1; i < arcTable.length; i++) {
    const prev = arcTable[i - 1] as ArcTableEntry;
    const next = arcTable[i] as ArcTableEntry;
    if (distance <= next.distance) {
      const segment = next.distance - prev.distance;
      const ratio = segment === 0 ? 0 : (distance - prev.distance) / segment;
      return prev.t + ratio * (next.t - prev.t);
    }
  }
  return 1; // if distance exceeds total arc length
}
