import { getCentre, typeCheck } from '../helpers/helpers.js';
import type { SkewProps } from '../../../../types/transformations';

/**
 * Creates a skew (shear) transformation matrix for 2D objects.
 *
 * Purpose:
 * This function generates a `DOMMatrix` to skew an object along the X and/or Y axes.
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
 * - A `DOMMatrix` representing the skew transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) and `getCentre` helper function for absolute mode.
 */

export function Skew({
  sx,
  sy,
  type = 'a',
  px = 0,
  py = 0,
  buffer
}: SkewProps & { buffer: Float32Array }): DOMMatrix {
  try {
    const mode = typeCheck(type);

    const matrix = new DOMMatrix([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    ]);

    switch (mode) {
      case 'relative':
      case 'r': {
        sx && matrix.skewXSelf(sx);
        sy && matrix.skewYSelf(sy);
        break;
      }

      case 'absolute':
      case 'a': {
        [px, py] = getCentre(buffer);
        matrix.translateSelf(px, py);
        sx && matrix.skewXSelf(sx);
        sy && matrix.skewYSelf(sy);
        matrix.translateSelf(-px, -py);
        break;
      }

      case 'pivot':
      case 'p':
      default: {
        matrix.translateSelf(px, py);
        sx && matrix.skewXSelf(sx);
        sy && matrix.skewYSelf(sy);
        matrix.translateSelf(-px, -py);
        break;
      }
    }

    return matrix;
  } catch (e) {
    throw e;
  }
}
