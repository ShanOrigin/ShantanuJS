import { OptimizationTechnique } from '../../../models/types/animation/control';
import type {
  TransformAnchors,
  CenterAnchors,
  Pivot,
  PivotAnchors
} from '../../../models/types/geometry/anchors';
import { PivotTransformations } from '../../../models/types/geometry/transform';

/**
 * List of supported anchor point identifiers.
 *
 * Anchors define reference points used for alignment, transformation,
 * or positioning operations. Each value represents a specific relative
 * location within a bounding region.
 *
 * The identifiers follow a concise directional naming convention.
 */
export const ANCHORS_MAP: readonly string[] = [
  'TL',
  'TM',
  'TR',
  'RM',
  'BR',
  'BM',
  'BL',
  'LM',
  'C'
] as const;

/**
 * List of supported transformation mode identifiers.
 *
 * These values control how transformations are interpreted or applied,
 * such as relative positioning, pivot-based transformations, or
 * center-based alignment.
 *
 * Both shorthand and descriptive aliases are supported.
 */
export const MODES_MAP: readonly string[] = [
  'r',
  'c',
  'p',
  'relative',
  'pivot',
  'center'
] as const;

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
  mode: TransformAnchors | CenterAnchors | PivotAnchors,
  bounds: Float32Array
): Required<Pivot> {
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
      return { px: centerX, py: centerY };

    case 'tm':
      return { px: centerX, py: minY };

    case 'tr':
      return { px: maxX, py: minY };

    case 'rm':
      return { px: maxX, py: centerY };

    case 'br':
      return { px: maxX, py: maxY };

    case 'bm':
      return { px: centerX, py: maxY };

    case 'bl':
      return { px: minX, py: maxY };

    case 'lm':
      return { px: minX, py: centerY };

    case 'r':
    case 'relative':
    case 'a':
    case 'absolute':
    case 'tl':
    default:
      return { px: minX, py: minY };
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
