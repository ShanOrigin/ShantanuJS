import type { ScaleMethodProps } from '../../../../types/transformations';

/**
 * Applies a 2D scaling transformation to an existing DOMMatrix.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided transformation matrix by composing
 * a scaling operation based on the supplied parameters.
 *
 * It does NOT allocate or return a new matrix.
 * It operates directly on the passed `oMatrix` instance.
 *
 * -------------------------------------------------------------------------
 * SUPPORTED SCALING MODES
 * -------------------------------------------------------------------------
 * The scaling behavior is determined by the `tType` parameter:
 *
 * - Absolute ('a' | 'absolute')
 *   Applies pivot-aware scaling using the provided pivot coordinates.
 *
 * - Pivot ('p' | 'pivot')
 *   Behaves identically to absolute scaling, explicitly indicating
 *   that scaling is performed around a pivot point.
 *
 * - Relative ('r' | 'relative')
 *   Applies scaling directly to the current matrix state
 *   without any pivot translation.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The provided DOMMatrix is treated as mutable state
 * - Scaling is composed using DOMMatrix.scaleSelf
 * - Z-axis scaling is fixed to 1 for 2D transformations
 * - No validation of scale factors is performed here
 *
 * -------------------------------------------------------------------------
 * ERROR BEHAVIOR
 * -------------------------------------------------------------------------
 * Any error thrown by DOMMatrix operations is propagated as-is.
 * This function does not translate, wrap, or suppress errors.
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param sx      Scale factor along the X-axis.
 * @param sy      Scale factor along the Y-axis.
 * @param tType - Scaling mode:
 *               'a' | 'absolute' → scale around center,
 *               'r' | 'relative' → direct scaling,
 *               'p' | 'pivot' → scale around pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param oMatrix Target DOMMatrix to be mutated.
 */
export function Scale({
  sx,
  sy,
  tType = 'a',
  px = 0,
  py = 0,
  oMatrix
}: ScaleMethodProps & { oMatrix: DOMMatrix }) {
  try {
    switch (tType) {
      case 'absolute':
      case 'a': {
        oMatrix.scaleSelf(sx, sy, 1, px, py);
        break;
      }

      case 'pivot':
      case 'p': {
        oMatrix.scaleSelf(sx, sy, 1, px, py);
        break;
      }

      case 'relative':
      case 'r':
      default: {
        oMatrix.scaleSelf(sx, sy);
        break;
      }
    }
  } catch (e) {
    throw e;
  }
}
