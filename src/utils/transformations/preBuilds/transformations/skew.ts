import type { SkewProps } from '../../../../types/transformations';

/**
 * Creates a skew (shear) transformation oMatrix for 2D objects.
 *
 * Purpose:
 * This function generates a `DOMoMatrix` to skew an object along the X and/or Y axes.
 * It supports different modes for applying the skew:
 * - Absolute: skew relative to the object's center.
 * - Pivot: skew around a specific pivot point.
 * - Relative: skew directly without changing pivot reference.
 *
 * Parameters:
 * @param sx - Skew angle along the X-axis in degrees.
 * @param sy - Skew angle along the Y-axis in degrees.
 * @param type - Skew mode:
 *               'a' | 'absolute' → skew around center,
 *               'r' | 'relative' → skew directly,
 *               'p' | 'pivot' → skew around a specified pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used in pivot/absolute modes). Default is 0.
 * @param py - Y coordinate of the pivot point (used in pivot/absolute modes). Default is 0.
 * @param buffer - Float32Array representing the object's coordinates or bounding points.
 *
 * Returns:
 * - A `DOMoMatrix` representing the skew transformation.
 *
 * Dependencies:
 * - Requires `DOMoMatrix` (browser API) and `getCentre` helper function for absolute mode.
 */

export function Skew({
  sx,
  sy,
  tType = 'a',
  px = 0,
  py = 0,
  oMatrix
}: SkewProps & { oMatrix: DOMMatrix }) {
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
