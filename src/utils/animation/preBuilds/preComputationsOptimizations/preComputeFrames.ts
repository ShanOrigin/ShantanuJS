import { lerp } from '../helpers/helpers.js';

import {
  TransformGeometry,
  TransformGeometryWithPivot
} from '../../../../types/animation';

import { interpolateAlongCurve } from '../../../curve/curveGenerator/interpolateAlongCurve.js';
import { createTransformationMatrixProps } from '../../../../types/transformations';

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Linearly interpolates between two 2D points (tuples of numbers).
 *
 * Purpose:
 * This function smoothly blends between two coordinate pairs `a` and `b`
 * based on a factor `t` that ranges from 0 to 1. When `t=0`, the result is `a`,
 * and when `t=1`, the result is `b`. Any value in between gives a weighted mix.
 *
 * Use cases:
 * - Animating positions in 2D.
 * - Creating smooth transitions between points.
 * - Interpolating geometry or motion paths.
 *
 * Dependencies:
 * - Relies on a `lerp` helper function (linear interpolation for single numbers).
 * - Does not depend on any graphics API, DOM, or external system. Pure math only.
 *
 * @param a - The starting point as a tuple `[x, y]`.
 * @param b - The ending point as a tuple `[x, y]`.
 * @param t - A value between 0 and 1 indicating interpolation progress.
 * @returns A new `[x, y]` tuple representing the interpolated point.
 */
function lerpTuple(
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

// ---------- Interpolate between two sets of parameters ----------

/**
 * Interpolates (blends) between two transformation parameter sets.
 *
 * Purpose:
 * This function takes two transformation objects (`p1` and `p2`) and smoothly
 * transitions between them using a blend factor `t`. The transformations include
 * translation, scaling, skewing, and rotation. It outputs a new transformation
 * that represents the "in-between" state.
 *
 * Use cases:
 * - Smooth animation between two geometric states.
 * - Gradual transition of objects in 2D graphics or UI elements.
 * - Interpolating keyframes for motion effects.
 *
 * Dependencies:
 * - Uses `lerpTuple` for 2D pair interpolation.
 * - Uses `lerp` for single-number interpolation.
 * - Does not directly rely on any graphics API, DOM, or external system.
 * - Purely mathematical and reusable in different contexts.
 *
 * @param p1 - The starting transform parameters (translation, scale, skew, rotation).
 * @param p2 - The ending transform parameters, may also include pivot points.
 * @param t - A value between 0 and 1 indicating the interpolation progress.
 * @returns A new transformation object blending between `p1` and `p2`.
 */

function lerpParams(
  p1: TransformGeometry,
  p2: TransformGeometryWithPivot,
  t: number
): TransformGeometryWithPivot {
  return {
    Translate: lerpTuple(p1.Translate, p2.Translate, t),
    Scale: lerpTuple(p1.Scale, p2.Scale, t),
    Skew: lerpTuple(p1.Skew, p2.Skew, t),
    Rotate: lerp(p1.Rotate, p2.Rotate, t)
    // Pivot: p2.Pivot || [0, 0] // keep same pivot if provided
  };
}

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
      } as createTransformationMatrixProps) as Float32Array;
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

/**
 * Applies a precomputed transformation frame for a given progress along an animation.
 *
 * Purpose:
 * This function calculates the interpolated transformation at a specific
 * progress point using precomputed frames (`preComputeFranes`). It optionally
 * applies translation along a provided curve. The result is a 2D affine
 * transformation matrix ready to be applied to a graphical element.
 *
 * Use cases:
 * - Animating an element along a precomputed motion path.
 * - Smoothly transitioning between keyframes using precomputed matrix data.
 * - Efficiently rendering animations without recalculating matrix coefficients on every frame.
 *
 * Dependencies:
 * - Uses `lerp` for linear interpolation.
 * - Uses `interpolateAlongCurve` if `isTranslate` is true.
 * - Does **not** directly depend on DOM or any graphics API, though it can be applied to SVG or Canvas transforms.
 *
 * @param preComputeFranes - A `Float32Array` containing precomputed frames (6 coefficients per frame).
 * @param curvePoints - An array of points defining a curve for optional translation.
 * @param progress - Animation progress between 0 and 1.
 * @param isTranslate - Whether to apply translation along the curve.
 * @param steps - Number of precomputed steps (default = 100)
 *
 * @returns A delta animation column-major Float32Array Matrix  representing the transform at time `t`.
 */

export function setPreComputedFrame(
  preComputeFranes: Float32Array,
  curvePoints: { x: number; y: number }[],
  progress: number,
  isTranslate: boolean,
  steps: number = 100
) {
  const tr = isTranslate
    ? interpolateAlongCurve(curvePoints, progress)
    : { x: 0, y: 0 };

  const exactIndex = progress * steps;
  let i0 = Math.floor(exactIndex);
  const i1 = Math.min(i0 + 1, steps);
  const t = exactIndex - i0;

  const offset0 = i0 * 6;
  const offset1 = i1 * 6;

  // Interpolate each coefficient
  const a = lerp(preComputeFranes[offset0]!, preComputeFranes[offset1]!, t);
  const b = lerp(
    preComputeFranes[offset0 + 1]!,
    preComputeFranes[offset1 + 1]!,
    t
  );
  const c = lerp(
    preComputeFranes[offset0 + 2]!,
    preComputeFranes[offset1 + 2]!,
    t
  );
  const d = lerp(
    preComputeFranes[offset0 + 3]!,
    preComputeFranes[offset1 + 3]!,
    t
  );
  const e = lerp(
    preComputeFranes[offset0 + 4]! + tr.x,
    preComputeFranes[offset1 + 4]! + tr.x,
    t
  );
  const f = lerp(
    preComputeFranes[offset0 + 5]! + tr.y,
    preComputeFranes[offset1 + 5]! + tr.y,
    t
  );

  // column major
  return new Float32Array([a, b, 0, c, d, 0, e, f, 1]);
}
