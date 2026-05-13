import { InvalidArgumentError } from '../../../../errors/index.js';

import type { FlipMethodProps } from '../../../../models/types/transformations';
/**
 * Applies a 2D flip (mirror) transformation to an existing DOMMatrix.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided transformation matrix by composing
 * horizontal and/or vertical flip operations.
 *
 * The flip is performed around the geometric center of the provided
 * bounding box and optionally adjusted based on direction hints.
 *
 * It does NOT allocate or return a new matrix.
 * It operates directly on the passed `oMatrix` instance.
 *
 * -------------------------------------------------------------------------
 * FLIP BEHAVIOR
 * -------------------------------------------------------------------------
 * - Horizontal flip is achieved by scaling X by -1
 * - Vertical flip is achieved by scaling Y by -1
 * - Translation offsets are applied to preserve expected orientation
 *   based on direction (`dirX`, `dirY`)
 *
 * The flip is always executed relative to the computed center point:
 *   (x + width / 2, y + height / 2)
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - At least one of flipX or flipY must be true
 * - Direction values must be explicitly valid ('x+' | 'x-', 'y+' | 'y-')
 * - The provided DOMMatrix is treated as mutable state
 * - Flip is composed using translate → scale → translate
 *
 * -------------------------------------------------------------------------
 * ERROR BEHAVIOR
 * -------------------------------------------------------------------------
 * Throws InvalidArgumentError when:
 * - both flipX and flipY are false
 * - dirX is not a valid horizontal direction
 * - dirY is not a valid vertical direction
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param flipX   Whether to apply a horizontal flip.
 * @param flipY   Whether to apply a vertical flip.
 * @param dirX    Horizontal flip direction ('x+' | 'x-').
 * @param dirY    Vertical flip direction ('y+' | 'y-').
 * @param x       Bounding box X coordinate.
 * @param y       Bounding box Y coordinate.
 * @param width   Bounding box width.
 * @param height  Bounding box height.
 * @param oMatrix Target DOMMatrix to be mutated.
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
      throw new InvalidArgumentError(
        'flipX , flipY ',
        'boolean , boolean',
        'Invalid flip configuration: at least one of flipX or flipY must be true.',
        'transformation.flip()'
      );
    }

    if (dirX !== 'x+' && dirX !== 'x-') {
      throw new InvalidArgumentError(
        'dirX',
        'x+ , x-',
        "Invalid dirX value: expected 'x+' or 'x-'.",
        'transformation.flip()'
      );
    }

    if (dirY !== 'y+' && dirY !== 'y-') {
      throw new InvalidArgumentError(
        'dirY',
        'y+ , y-',
        "Invalid dirY value: expected 'y+' or 'y-'.",
        'transformation.flip()'
      );
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
