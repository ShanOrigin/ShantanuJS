import type { TranslateMethodProps } from '../../../../models/types/transformations';

/**
 * Applies a 2D translation transformation to an existing DOMMatrix.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided transformation matrix by composing
 * a translation operation based on the supplied parameters.
 *
 * It does NOT create a new matrix.
 * It operates directly on the passed `oMatrix` instance.
 *
 * -------------------------------------------------------------------------
 * SUPPORTED TRANSLATION MODES
 * -------------------------------------------------------------------------
 * The translation behavior is determined by the `tType` parameter:
 *
 * - Absolute ('a' | 'absolute')
 *   Applies translation relative to a reference pivot.
 *
 * - Center ('c' | 'center')
 *   Applies translation assuming the object is already centered
 *   around the provided pivot.
 *
 * - Pivot ('p' | 'pivot')
 *   Performs a pivot-aware translation by:
 *   1. translating to the pivot
 *   2. applying the offset
 *   3. translating back
 *
 * - Relative ('r' | 'relative')
 *   Applies translation directly relative to the current matrix state.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The provided DOMMatrix is treated as mutable state
 * - Translation is composed using DOMMatrix.translateSelf
 * - No validation of numeric ranges is performed here
 * - All higher-level validation is assumed to be done upstream
 *
 * -------------------------------------------------------------------------
 * ERROR BEHAVIOR
 * -------------------------------------------------------------------------
 * Any error thrown by DOMMatrix operations is propagated as-is.
 * This function does not perform error translation or wrapping.
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param x       Horizontal translation offset.
 * @param y       Vertical translation offset.
 * @param tType - Translation mode:
 *               'a' | 'absolute' → absolute translation,
 *               'r' | 'relative' → relative translation,
 *               'p' | 'pivot' → pivot-based translation,
 *               'c' | 'center' → center-based translation.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param oMatrix Target DOMMatrix to be mutated.
 */
export function Translate({
  x,
  y,
  tType = 'a',
  px = 0,
  py = 0,
  oMatrix
}: TranslateMethodProps & { oMatrix: DOMMatrix }) {
  try {
    switch (tType) {
      case 'absolute':
      case 'a': {
        oMatrix.translateSelf(-px, -py).translateSelf(x, y);
        break;
      }

      case 'center':
      case 'c': {
        oMatrix.translateSelf(x - px, y - py);
        break;
      }

      case 'pivot':
      case 'p': {
        oMatrix
          .translateSelf(-px, -py)
          .translateSelf(x, y)
          .translateSelf(px, py);
        break;
      }

      case 'relative':
      case 'r':
      default: {
        oMatrix.translateSelf(x, y);
        break;
      }
    }
  } catch (e) {
    throw e;
  }
}
