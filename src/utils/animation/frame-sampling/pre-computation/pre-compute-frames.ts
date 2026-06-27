import { lerpParams } from '../../../math/interpolation/lerp.js';

import type {
  BaseTransformations,
  CreateTransformationMatrixProps,
  PivotTransformations
} from '../../../../models/types/geometry/transform';
import { createAffineTransformMatrix } from '../../../math/affine/affine-matrix-creation.js';

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ---------- Precompute into Float32Array ----------

/**
 * Precomputes a sequence of transformation matrices between two states.
 *
 * Purpose:
 * This function generates a series of transformation frames by gradually
 * interpolating between a starting transform (`start`) and an ending transform (`end`).
 * Each frame is stored as six matrix coefficients, which represent scale,
 * rotation, skew, and translation combined. The frames can then be used to
 * efficiently animate or render smooth transitions without recalculating on-the-fly.
 *
 * Use cases:
 * - Creating keyframe-based animations.
 * - Precomputing data for performance-sensitive rendering loops.
 * - Generating transformation tables for graphics or simulation.
 *
 * Dependencies:
 * - Relies on `lerpParams` for interpolating parameters.
 * - Uses `composeWithBase` to construct matrix coefficients from the interpolated parameters.
 * - Does not directly depend on DOM, SVG, or any graphics API.
 * - Produces raw mathematical data (Float32Array), which can be used in
 *   any rendering pipeline.
 *
 * @param intialState - The initial transformation parameters.
 * @param finalState - The final transformation parameters (may include pivot points).
 * @param base - A base transformation matrix in column-major Float32Array format.
 * @param steps - Number of interpolation steps (default = 100). Higher values mean smoother transitions.
 * @returns A `Float32Array` containing all transformation frames (6 values per frame).
 */

export function precomputeFramesRaw(
  intialState: BaseTransformations,
  finalState: PivotTransformations,
  steps: number = 100
): Float32Array {
  const frames = new Float32Array((steps + 1) * 6);

  const { scale, rotate, skew } = finalState;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const params = lerpParams(intialState, finalState, t);

    let a!: number, b!: number, c!: number, d!: number, e!: number, f!: number;

    [a = 1, b = 0, , c = 0, d = 1, , e = 0, f = 0] =
      createAffineTransformMatrix({
        transformations: {
          rotate: {
            angle: params.rotate?.angle,
            tType: 'p',
            px: rotate?.px ?? 0,
            py: rotate?.py ?? 0
          },
          scale: {
            sx: params.scale?.sx,
            sy: params.scale?.sy,
            tType: 'p',
            px: scale?.px ?? 0,
            py: scale?.py ?? 0
          },
          skew: {
            sx: params.skew?.sx,
            sy: params.skew?.sy,
            tType: 'p',
            px: skew?.px ?? 0,
            py: skew?.py ?? 0
          }
        },
        major: 'column',
        arrayType: 'float32'
      } as CreateTransformationMatrixProps) as Float32Array;

    const offset = i * 6;
    frames[offset] = a;
    frames[offset + 1] = b;
    frames[offset + 2] = c;
    frames[offset + 3] = d;
    frames[offset + 4] = e;
    frames[offset + 5] = f;
  }

  return frames;
}

// frames setter
