import { getCentre, typeCheck } from '../helpers/helpers.js';
import type { RotateProps } from '../../../../types/transformations';

/**
 * Creates a rotation matrix to rotate an object in 2D space.
 *
 * Purpose:
 * This function generates a `DOMMatrix` that rotates an object by a specified angle.
 * It supports multiple rotation modes:
 * - Absolute: rotates around the object's geometric center.
 * - Pivot: rotates around a specified pivot point.
 * - Relative: rotates directly without changing pivot reference.
 *
 * Parameters:
 * @param angle - Rotation angle in degrees.
 * @param type - Rotation mode:
 *               'a' | 'absolute' → rotate around center,
 *               'r' | 'relative' → direct rotation,
 *               'p' | 'pivot' → rotate around pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param buffer - Float32Array representing the object's coordinates or bounding points.
 *
 * Returns:
 * - A `DOMMatrix` representing the rotation transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) and `getCentre` helper function for absolute rotations.
 */

export function Rotate({
  angle,
  tType = 'a',
  px = 0,
  py = 0
}: RotateProps): DOMMatrix {
  try {
    const mode = typeCheck(tType);

    // Start with identity matri
    const matrix = new DOMMatrix([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    ]);

    switch (mode) {
      case 'relative':
      case 'r': {
        matrix.rotateSelf(angle); // Simple rotation around current center
        break;
      }

      case 'absolute':
      case 'a':
      case 'pivot':
      case 'p':
      default: {
        // Simulate pivot-based rotation
        matrix.translateSelf(px, py).rotateSelf(angle).translateSelf(-px, -py);
        break;
      }
    }

    return matrix;
  } catch (e) {
    throw e;
  }
}
