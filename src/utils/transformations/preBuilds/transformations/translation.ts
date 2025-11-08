import { getCentre, typeCheck } from '../helpers/helpers.js';
import type { TranslateProps } from '../../../../types/transformations';

/**
 * Creates a translation matrix for moving an object in 2D space.
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
 * - A `DOMMatrix` representing the translation transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) and `getCentre` helper function to compute center points.
 */

export function Translate({
  x,
  y,
  type = 'a',
  px = 0,
  py = 0,
  buffer
}: TranslateProps & { buffer: Float32Array }): DOMMatrix {
  try {
    const mode = type == 'c' || type == 'center' ? 'c' : typeCheck(type);
    let [cx, cy] = [buffer[0], buffer[1]];
    // Always start with a fresh DOMMatrix
    const matrix = new DOMMatrix([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    ]);

    switch (mode) {
      case 'absolute':
      case 'a': {
        [px, py] = [cx, cy];
        matrix.translateSelf(-px, -py).translateSelf(x, y);
        break;
      }

      case 'center':
      case 'c': {
        const [cx, cy] = getCentre(buffer);

        // Step 2: move by desired offset
        matrix.translateSelf(x - cx, y - cy);

        break;
      }

      case 'pivot':
      case 'p': {
        //  a = [cx, cy];
        matrix
          .translateSelf(-px, -py)
          .translateSelf(x, y)
          .translateSelf(px, py);
        break;
      }

      case 'relative':
      case 'r':
      default: {
        matrix.translateSelf(x, y);
        break;
      }
    }

    return matrix;
  } catch (e) {
    throw e;
  }
}
