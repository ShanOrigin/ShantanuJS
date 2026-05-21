import type { CurveType } from '../../../models/types/animation';

/**
 * List of supported path interpolation types.
 *
 * These values describe the geometric path along which an animation
 * or transformation progresses, independent of easing behavior.
 *
 * This list is used to validate path-related configuration.
 */
const pathsMap: string[] = ['linear', 'quadratic', 'cubic', 'earc', 'arc'];

/**
 * Calculates an adaptive smoothness (number of samples) for a curve segment
 * based on the distance between two points, the curve's bend, and curve type.
 *
 * The function dynamically adjusts the number of interpolation points:
 * - Longer curves or higher bends → more samples for smoothness.
 * - Curve type affects the mapping of bend and distance to sample count.
 * - Smoothness is clamped between user-provided min and max.
 *
 * Parameters:
 * @param P1 - Starting point of the curve { x: number, y: number }.
 * @param P2 - Ending point of the curve { x: number, y: number }.
 * @param bend - Curve bend factor in range [-1, 1]. Positive for upward/clockwise, negative for downward/counter-clockwise.
 * @param curveType - Type of the curve: 'linear', 'quadratic', 'cubic' , 'earc' , 'arc'.
 * @param minSamples - Minimum number of samples to use (default: 4).
 * @param maxSamples - Maximum number of samples to use (default: 100).
 *
 * Returns:
 * - number: Calculated smoothness (sample count) clamped between minSamples and maxSamples.
 *
 * Dependencies:
 * - Pure calculation, does not depend on DOM, canvas, or graphics APIs.
 */
export function getCurveAdaptiveSmoothness(
  P1: { x: number; y: number },
  P2: { x: number; y: number },
  bend: number,
  curveType: CurveType,
  minSamples: number = 4,
  maxSamples: number = 100
): number {
  // 1. Compute straight-line distance between points
  const dx = P2.x - P1.x;
  const dy = P2.y - P1.y;
  const distance = Math.hypot(dx, dy);

  // 2. Map bend [-1, 1] to a positive factor (0.5 to 1.5) to adjust smoothness
  const bendFactor = 1 + Math.abs(bend); // 0–1 becomes 1–2
  let adjustedMin = minSamples;
  let adjustedMax = maxSamples;

  // 3. Curve type adjustment
  switch (curveType) {
    case pathsMap[0]: // 'linear'
      adjustedMax = Math.min(maxSamples, 20); // linear requires fewer points
      break;
    case pathsMap[1]: // 'quadratic'
      adjustedMin = Math.max(minSamples, 6);
      adjustedMax = Math.min(maxSamples, 60);
      break;
    case pathsMap[2]: // 'cubic'
      adjustedMin = Math.max(minSamples, 10);
      adjustedMax = Math.min(maxSamples, 100);
      break;
    case pathsMap[3]: // 'arc'
    case pathsMap[4]: // 'earc'
      adjustedMin = Math.max(minSamples, 8);
      adjustedMax = Math.min(maxSamples, 80);
      break;
    default:
      // fallback
      break;
  }

  // 4. Map distance to sample count within adjusted range
  // Assume a reference distance of 200 units for scaling
  const refDistance = 200;
  let samples = Math.round(
    adjustedMin +
      (adjustedMax - adjustedMin) * (distance / refDistance) * bendFactor
  );

  // Clamp between min and max
  return Math.max(adjustedMin, Math.min(samples, adjustedMax));
}
