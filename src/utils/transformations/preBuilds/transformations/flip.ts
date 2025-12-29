import type { FlipMethodProps } from '../../../../types/transformations';

/**
 * Creates a transformation matrix that flips an object horizontally and/or vertically.
 *
 * Purpose:
 * This function generates a `DOMMatrix` to mirror an object along the X-axis, Y-axis, or both.
 * It allows controlling the direction of the flip and adjusts the object’s position
 * so that the flipping occurs around its center.
 *
 * Parameters:
 * @param flipX - Whether to flip the object horizontally. Must be true or false.
 * @param flipY - Whether to flip the object vertically. Must be true or false.
 * @param dirX - Horizontal flip direction: 'x+' (positive X) or 'x-' (negative X). Default is 'x+'.
 * @param dirY - Vertical flip direction: 'y+' (positive Y) or 'y-' (negative Y). Default is 'y+'.
 * @param x - X coordinate of the object’s bounding box.
 * @param y - Y coordinate of the object’s bounding box.
 * @param width - Width of the object.
 * @param height - Height of the object.
 *
 * Returns:
 * - A `DOMMatrix` representing the flip transformation.
 *
 * Dependencies:
 * - Requires `DOMMatrix` (browser API) for performing matrix transformations.
 */

export function Flip({
  flipX,
  flipY,
  dirX = 'x+',
  dirY = 'y+',
  x,
  y,
  width,
  height,
  oMatrix
}: FlipMethodProps & {
  x: number;
  y: number;
  width: number;
  height: number;
  oMatrix: DOMMatrix;
}) {
  try {
    if (!flipX && !flipY) {
      throw new Error(
        'flipX  and flipY both parameters are false at least one parameter should be true'
      );
    }
    if (dirX != 'x+' && dirX != 'x-') {
      throw new Error("dirX parameter is not Valid it should be 'x+' or 'x-' ");
    }

    if (dirY != 'y+' && dirY != 'y-') {
      throw new Error("dirY parameter is not Valid it should be 'y+' or 'y-' ");
    }

    const [xCenter, yCenter] = [x + width / 2, y + height / 2];

    let dx = 0,
      dy = 0;

    if (flipX) {
      dx = dirX === 'x-' ? 2 * (x + width - xCenter) : 2 * (x - xCenter);
    }

    if (flipY) {
      dy = dirY === 'y-' ? 2 * (y + height - yCenter) : 2 * (y - yCenter);
    }

    oMatrix
      .translateSelf(xCenter, yCenter)
      .scaleSelf(flipX ? -1 : 1, flipY ? -1 : 1)
      .translateSelf(-xCenter, -yCenter)
      .translateSelf(dx, dy);
  } catch (e) {
    throw e;
  }
}
