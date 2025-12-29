/**
 * Default property types and values for a graphical or animated element.
 *
 * Purpose:
 * This object provides a template of default values for common properties
 * used in animations or transformations. It ensures consistent behavior
 * when creating or manipulating elements by specifying fallback values.
 *
 * Use cases:
 * - Initializing elements with default positions, scales, and rotation angles.
 * - Providing default directional and flipping behavior for animations.
 * - Setting default callbacks and effect flags to avoid undefined behavior.
 *
 * Dependencies:
 * - Pure data structure; does **not** depend on any DOM or graphics API.
 *
 * Properties:
 * - `x`, `y`: Default coordinates (number).
 * - `sx`, `sy`: Default scale factors (number).
 * - `angle`: Default rotation angle in degrees (number).
 * - `flipX`, `flipY`: Whether to flip the element on X or Y axis (boolean).
 * - `dirX`, `dirY`: Direction strings for X and Y axes (string).
 * - `type`: Type identifier (string).
 * - `px`, `py`: Pivot coordinates (number).
 * - `isEffect`, `isVEffect`: Flags for enabling effects (boolean).
 * - `callbacks`: Default callback function (function).
 */

export const propTypes = {
  x: 0,
  y: 0,
  sx: 0,
  sy: 0,
  angle: 0,
  flipX: true,
  flipY: true,
  dirX: 'x+',
  dirY: 'y+',
  type: 'a',
  px: 0,
  py: 0,
  isEffect: true,
  isVEffect: true,
  callbacks: () => {}
};

/**
 * Resets a DOMMatrix to the identity matrix.
 *
 * Purpose:
 * Sets all entries of the provided DOMMatrix to default values such that
 * it represents an identity transformation (no scaling, rotation, or translation).
 * This is useful for clearing any previous transformations before applying new ones.
 *
 * Parameters:
 * @param m - A `DOMMatrix` object representing a transformation matrix to reset.
 *
 * Dependencies:
 * - Depends on the DOMMatrix API, which is part of the browser's Web APIs.
 * - Cannot be used in environments without DOMMatrix support (e.g., some Node.js environments).
 *
 * Behavior:
 * After calling, the matrix behaves as a neutral transformation:
 * - Scale factors are set to 1.
 * - All rotations, skews, and translations are reset to 0.
 */
export function resetMatrix(m: DOMMatrix): void {
  m.m11 = 1;
  m.m12 = 0;
  m.m13 = 0;
  m.m14 = 0;
  m.m21 = 0;
  m.m22 = 1;
  m.m23 = 0;
  m.m24 = 0;
  m.m31 = 0;
  m.m32 = 0;
  m.m33 = 1;
  m.m34 = 0;
  m.m41 = 0;
  m.m42 = 0;
  m.m43 = 0;
  m.m44 = 1;
}

// method to get geometric center of Shape

/**
 * Calculates the center point of a quadrilateral given its corner coordinates.
 *
 * Purpose:
 * Finds the geometric center (average of corner points) of a shape represented
 * by a Float32Array of 12 elements (x, y for 4 corners). Useful for pivot calculations
 * or aligning transformations around the shape's center.
 *
 * Parameters:
 * @param m - A Float32Array of length 12 representing the coordinates of 4 corners:
 *            [x1, y1, _, x2, y2, _, x3, y3, _, x4, y4] (underscores can be ignored or placeholders).
 *
 * Returns:
 * - An array `[cx, cy]` representing the center coordinates of the shape.
 *
 * Dependencies:
 * - Pure computation; no reliance on DOM, graphics, or browser APIs.
 */

export function getCentre(m: Float32Array): number[] {
  const [x1 = 0, y1 = 0, , x2 = 0, y2 = 0, , x3 = 0, y3 = 0, , x4 = 0, y4 = 0] =
    m;
  const cx = (x1 + x2 + x3 + x4) / 4;
  const cy = (y1 + y2 + y3 + y4) / 4;

  return [cx, cy];
}
// method to check modes of transformations

/**
 * Validates a transformation type string and normalizes it.
 *
 * Purpose:
 * Ensures that a provided transformation type is recognized ('absolute', 'relative', or 'pivot')
 * and throws an error if invalid. Converts shorthand forms to lower case for consistency.
 *
 * Parameters:
 * @param type - A string representing the transformation type (e.g., 'a', 'r', 'p').
 *
 * Returns:
 * - The normalized type string (lowercase).
 *
 * Dependencies:
 * - Pure computation; no reliance on DOM, graphics, or browser APIs.
 */

export function typeCheck(type: string): string {
  const lowerType = type.toLowerCase();
  if (!['absolute', 'a', 'relative', 'r', 'pivot', 'p'].includes(lowerType)) {
    // type = 'a';
    throw new Error(
      `Transformation type is not valid type given type = ${type} expected type
 'relative' or 'r' ,  'absolute' or 'a' , 'pivot' or 'p' `
    );
  }

  return type;
}
