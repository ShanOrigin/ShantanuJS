import { getCentre, typeCheck } from '../helpers/helpers.js';
import type { TranslateProps } from '../../../../types/transformations';

/**
 * Creates a translation oMatrix for moving an object in 2D space.
 *
 * Purpose:
 * This function generates a `DOMMatrix` that represents translation by a given (x, y) offset.
 * It supports multiple modes for translation:
 * - Absolute: moves relative to a reference point.
 * - Center: moves relative to the object's geometric center.
 * - Pivot: moves relative to a custom pivot point.
 * - Relative: moves relative to the current position.
 *
 * Parameters:
 * @param x - The horizontal translation distance.
 * @param y - The vertical translation distance.
 * @param type - Translation mode:
 *               'a' | 'absolute' → absolute translation,
 *               'r' | 'relative' → relative translation,
 *               'p' | 'pivot' → pivot-based translation,
 *               'c' | 'center' → center-based translation.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param buffer - Float32Array representing the object's coordinates or bounding points.
 *
 * Returns:
 * - A `DOMoMatrix` representing the translation transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) and `getCentre` helper function to compute center points.
 */

export function Translate({
  x,
  y,
  tType = 'a',
  px = 0,
  py = 0,
  oMatrix
}: TranslateProps & { oMatrix: DOMMatrix }) {
  try {
    switch (tType) {
      case 'absolute':
      case 'a': {
        oMatrix.translateSelf(-px, -py).translateSelf(x, y);

        break;
      }

      case 'center':
      case 'c': {
        // Step 2: move by desired offset
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
