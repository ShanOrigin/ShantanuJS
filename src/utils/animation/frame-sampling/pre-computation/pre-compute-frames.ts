import { lerpParams } from '../../../math/interpolation/lerp.js';

import type {
  TransformGeometry,
  TransformGeometryWithPivot
} from '../../../../models/types/animation';

import type { CreateTransformationMatrixProps } from '../../../../models/types/affine-transformations.js';

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
 * @param start - The initial transformation parameters.
 * @param end - The final transformation parameters (may include pivot points).
 * @param base - A base transformation matrix in column-major Float32Array format.
 * @param steps - Number of interpolation steps (default = 100). Higher values mean smoother transitions.
 * @returns A `Float32Array` containing all transformation frames (6 values per frame).
 */

export function precomputeFramesRaw(
  start: TransformGeometry,
  end: TransformGeometryWithPivot,
  steps: number = 100,
  composeFn?: Function,
  base?: Float32Array
): Float32Array {
  const frames = new Float32Array((steps + 1) * 6);

  const { rotatePivot, scalePivot, skewPivot }: TransformGeometryWithPivot =
    end;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const params = lerpParams(start, end, t);

    let a!: number, b!: number, c!: number, d!: number, e!: number, f!: number;
    if (composeFn && typeof composeFn == 'function') {
      [a = 1, b = 0, , c = 0, d = 1, , e = 0, f = 0] = composeFn({
        transformations: {
          rotate: {
            angle: params.Rotate,
            tType: 'p',
            px: rotatePivot?.[0] ?? 0,
            py: rotatePivot?.[1] ?? 0
          },
          scale: {
            sx: params.Scale[0],
            sy: params.Scale[1],
            tType: 'p',
            px: scalePivot?.[0] ?? 0,
            py: scalePivot?.[1] ?? 0
          },
          skew: {
            sx: params.Skew[0],
            sy: params.Skew[1],
            tType: 'p',
            px: skewPivot?.[0] ?? 0,
            py: skewPivot?.[1] ?? 0
          }
        },
        major: 'column',
        arrayType: 'float32'
        //  baseTMatrix: base,
        //   multiplyWithBase: true
      } as CreateTransformationMatrixProps) as Float32Array;
    }

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
