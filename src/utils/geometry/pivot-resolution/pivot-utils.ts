import { OptimizationTechnique } from '../../../models/types/animation/control';
import type {
  TransformAnchors,
  CenterAnchors
} from '../../../models/types/geometry/anchors';
import { PivotTransformations } from '../../../models/types/geometry/transform';
/**
 * Determines the pivot point coordinates for a shape based on a specified mode or anchor.
 *
 * Purpose:
 * - Calculates the (x, y) position of the pivot for transformations, rotations, or scaling.
 * - Supports various pivot Modes such as corners (TL, TR, BR, BL), edges (TM, RM, BM, LM), and center.
 * - Defaults to the top-left corner (`TL`) if no mode is provided.
 *
 * Dependency:
 * - Depends on a Float32Array representing the oriented bounding box (OBB) of the shape.
 * - Does not rely on any graphics API or DOM API; purely a mathematical calculation.
 *
 * @param mode - A string or enum representing the desired pivot mode or anchor.
 *               Examples: `'TL'`, `'TR'`, `'BR'`, `'BL'`, `'C'`, `'center'`, `'TM'`, `'RM'`, `'BM'`, `'LM'`.
 * @param OBB - A `Float32Array` representing the four corners of the shape's bounding box in order.
 *
 * @returns A tuple `[x, y]` representing the coordinates of the chosen pivot point.
 */
export function pivotSetter(
  mode: TransformAnchors | CenterAnchors,
  OBB: number[][] // Float32Array [ minX , minY , maxX , maxY]
): [number, number] {
  const [x1, y1] = OBB[0] as [number, number];
  const [x2, y2] = OBB[1] as [number, number];
  const [x3, y3] = OBB[2] as [number, number];
  const [x4, y4] = OBB[3] as [number, number];

  // Precompute sums used multiple times
  const sumX = [x1 + x2, x2 + x3, x3 + x4, x1 + x4];
  const sumY = [y1 + y2, y2 + y3, y3 + y4, y1 + y4];
  const centerX = (x1 + x2 + x3 + x4) / 4;
  const centerY = (y1 + y2 + y3 + y4) / 4;

  const lookup: Record<string, [number, number]> = {
    r: [x1, y1],
    relative: [x1, y1],
    TL: [x1, y1],
    c: [centerX, centerY],
    center: [centerX, centerY],
    C: [centerX, centerY],
    TM: [sumX[0]! / 2, sumY[0]! / 2],
    TR: [x2, y2],
    RM: [sumX[1]! / 2, sumY[1]! / 2],
    BR: [x3, y3],
    BM: [sumX[2]! / 2, sumY[2]! / 2],
    BL: [x4, y4],
    LM: [sumX[3]! / 2, sumY[3]! / 2]
  };

  return lookup[mode ?? 'TL'] ?? [x1, y1];
}

/**
 * Resolves a pivot point from an axis-aligned bounding box (AABB).
 *
 * Expected bounds layout:
 *
 * [ minX, minY, maxX, maxY ]
 *
 * Supported pivot positions:
 *
 * tl  tm  tr
 * lm   c  rm
 * bl  bm  br
 *
 * Aliases:
 *
 * r, relative, a, absolute -> tl
 * c, center                -> center
 *
 * @param mode Pivot resolution mode.
 * @param bounds Bounding box represented as
 *               [ minX, minY, maxX, maxY ].
 *
 * @returns The resolved pivot coordinates as
 *          [ x, y ].
 */
export function resolvePivots(
  mode: TransformAnchors | CenterAnchors,
  bounds: Float32Array
): [number, number] {
  const minX = bounds[0] as number;
  const minY = bounds[1] as number;
  const maxX = bounds[2] as number;
  const maxY = bounds[3] as number;

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;

  const normalizedMode = mode.toLowerCase();

  switch (normalizedMode) {
    case 'c':
    case 'center':
      return [centerX, centerY];

    case 'tm':
      return [centerX, minY];

    case 'tr':
      return [maxX, minY];

    case 'rm':
      return [maxX, centerY];

    case 'br':
      return [maxX, maxY];

    case 'bm':
      return [centerX, maxY];

    case 'bl':
      return [minX, maxY];

    case 'lm':
      return [minX, centerY];

    case 'r':
    case 'relative':
    case 'a':
    case 'absolute':
    case 'tl':
    default:
      return [minX, minY];
  }
}

/**
 * Determines the optimal transformation computation strategy based on pivot settings.
 *
 * Purpose:
 * - Checks if rotation (or other transformations like scale/skew if enabled) uses an arbitrary pivot point.
 * - Returns `'preComputeFrames'` if an arbitrary pivot exists, requiring precomputation of frames.
 * - Returns `'fitPolynomialCofficient'` if all pivots are standard, allowing polynomial fitting optimization.
 *
 * Dependency:
 * - Depends on the input parameter object `TransformGeometryWithPivot` containing rotation, pivot, and optionally scale/skew values.
 * - Does not rely on any graphics API, DOM API, or external library.
 *
 * @param params - An object containing transformation parameters:
 *                 - `Rotate`: rotation angle in degrees or radians.
 *                 - `rotatePivot`: `[x, y]` coordinates of the rotation pivot point.
 *                 - Optional commented-out parameters: scale, skew, and their pivots.
 *
 * @returns A string indicating the recommended optimization method:
 *          - `'preComputeFrames'` → use precomputed frames due to arbitrary pivot.
 *          - `'fitPolynomialCofficient'` → safe to apply polynomial fitting for performance.
 */

export function choosePivotAwareOptimization(
  params: Pick<PivotTransformations, 'rotate'>
): OptimizationTechnique {
  const { rotate } = params;

  // --- Check if rotation pivot is arbitrary ---
  const rotationArbitrary =
    rotate.angle !== 0 && (rotate.px !== 0 || rotate.py !== 0);

  if (rotationArbitrary) {
    // --- If rotation with arbitrary pivot exists → must use precompute ---
    return 'preComputeFrames';
  }

  // Optional: if skew with arbitrary pivot breaks polynomial fit, uncomment
  // if (skewArbitrary) return 'precompute';

  // Otherwise, polynomial fit is safe
  return 'fitPolynomialCoefficient';
}
