import type { RotateMethodProps } from "../../../../models/types/geometry/transform";
/**
 * Applies a 2D rotation transformation to an existing DOMMatrix.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided transformation matrix by composing
 * a rotation operation based on the supplied parameters.
 *
 * It does NOT allocate or return a new matrix.
 * It operates directly on the passed `oMatrix` instance.
 *
 * -------------------------------------------------------------------------
 * SUPPORTED ROTATION MODES
 * -------------------------------------------------------------------------
 * The rotation behavior is controlled by the `tType` parameter:
 *
 * - Relative ('r' | 'relative')
 *   Applies rotation directly to the current matrix state without
 *   modifying or simulating any pivot.
 *
 * - Absolute ('a' | 'absolute')
 *   Applies a pivot-aware rotation using the provided pivot coordinates.
 *
 * - Pivot ('p' | 'pivot')
 *   Behaves identically to absolute rotation, explicitly rotating
 *   around the supplied pivot point.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The provided DOMMatrix is treated as mutable state
 * - Rotation is composed using DOMMatrix.rotateSelf
 * - Pivot-based rotation is simulated via translate → rotate → translate
 * - No normalization or angle validation is performed here
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
 * @param angle   Rotation angle in degrees.
 * @param tType - Rotation mode:
 *               'a' | 'absolute' → rotate around center,
 *               'r' | 'relative' → direct rotation,
 *               'p' | 'pivot' → rotate around pivot point.
 *               Default is 'a'.
 * @param px - X coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param py - Y coordinate of the pivot point (used for pivot mode). Default is 0.
 * @param oMatrix Target DOMMatrix to be mutated.
 */
export function rotate({
  angle,
  tType = "a",
  px = 0,
  py = 0,
  oMatrix,
}: RotateMethodProps & { oMatrix: DOMMatrix }) {
  try {
    switch (tType) {
      case "relative":
      case "r": {
        oMatrix.rotateSelf(angle); // Simple rotation around current center
        break;
      }

      case "absolute":
      case "a":
      case "pivot":
      case "p":
      default: {
        // Simulate pivot-based rotation
        oMatrix.translateSelf(px, py).rotateSelf(angle).translateSelf(-px, -py);
        break;
      }
    }
  } catch (e) {
    throw e;
  }
}
