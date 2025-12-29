import type { ScaleMethodProps } from '../../../../types/transformations';

/**
 * Creates a scaling matrix to resize an object in 2D space.
 *
 * Purpose:
 * This function generates a `DOMMatrix` that scales an object along X and Y axes.
 * It supports multiple modes:
 * - Absolute: scales relative to the object's geometric center.
 * - Pivot: scales relative to a specified pivot point.
 * - Relative: scales directly without a reference point.
 *
 * Parameters:
 * @param sx - Scale factor along the X-axis.
 * @param sy - Scale factor along the Y-axis.
 * @param type - Scaling mode:
 *               'a' | 'absolute' → scale around center,
 *               'r' | 'relative' → direct scaling,
 *               'p' | 'pivot' → scale around pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param buffer - Float32Array representing the object's coordinates or bounding points.
 *
 * Returns:
 * - A `DOMMatrix` representing the scaling transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) and `getCentre` helper function for absolute scaling.
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
