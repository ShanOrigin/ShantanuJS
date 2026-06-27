import type { SkewMethodProps } from '../../../../models/types/geometry/transform';

/**
 * Applies a 2D skew (shear) transformation to an existing DOMMatrix.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided transformation matrix by composing
 * skew transformations along the X and/or Y axes.
 *
 * It does NOT allocate or return a new matrix.
 * It operates directly on the passed `oMatrix` instance.
 *
 * -------------------------------------------------------------------------
 * SUPPORTED SKEW MODES
 * -------------------------------------------------------------------------
 * The skew behavior is determined by the `tType` parameter:
 *
 * - Relative ('r' | 'relative')
 *   Applies skew directly to the current matrix state
 *   without any pivot translation.
 *
 * - Absolute ('a' | 'absolute')
 *   Applies pivot-aware skew using the provided pivot coordinates.
 *
 * - Pivot ('p' | 'pivot')
 *   Behaves identically to absolute skew, explicitly indicating
 *   that skew is applied around a pivot point.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The provided DOMMatrix is treated as mutable state
 * - Skew is composed using DOMMatrix.skewXSelf / skewYSelf
 * - Pivot-based skew is simulated via translate → skew → translate
 * - Skew angles are interpreted in degrees
 * - No validation of skew angles is performed here
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
 * @param sx      Skew angle along the X-axis (degrees).
 * @param sy      Skew angle along the Y-axis (degrees).
 * @param tType - Skew mode:
 *               'a' | 'absolute' → skew around center,
 *               'r' | 'relative' → skew directly,
 *               'p' | 'pivot' → skew around a specified pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used in pivot/absolute modes). Default is 0.
 * @param py - Y coordinate of the pivot point (used in pivot/absolute modes). Default is 0.
 * @param oMatrix Target DOMMatrix to be mutated.
 */
export function skew({
  sx,
  sy,
  tType = 'a',
  px = 0,
  py = 0,
  oMatrix
}: SkewMethodProps & { oMatrix: DOMMatrix }) {
  try {
    switch (tType) {
      case 'relative':
      case 'r': {
        sx && oMatrix.skewXSelf(sx);
        sy && oMatrix.skewYSelf(sy);
        break;
      }

      case 'absolute':
      case 'a': {
        oMatrix.translateSelf(px, py);
        sx && oMatrix.skewXSelf(sx);
        sy && oMatrix.skewYSelf(sy);
        oMatrix.translateSelf(-px, -py);
        break;
      }

      case 'pivot':
      case 'p':
      default: {
        oMatrix.translateSelf(px, py);
        sx && oMatrix.skewXSelf(sx);
        sy && oMatrix.skewYSelf(sy);
        oMatrix.translateSelf(-px, -py);
        break;
      }
    }
  } catch (e) {
    throw e;
  }
}
