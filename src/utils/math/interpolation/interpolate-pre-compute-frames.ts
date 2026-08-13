import { lerp } from "./lerp.js";
import { interpolateAlongCurve } from "./interpolate-along-curve.js";
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
  steps: number = 100,
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
    t,
  );
  const c = lerp(
    preComputeFranes[offset0 + 2]!,
    preComputeFranes[offset1 + 2]!,
    t,
  );
  const d = lerp(
    preComputeFranes[offset0 + 3]!,
    preComputeFranes[offset1 + 3]!,
    t,
  );
  const e = lerp(
    preComputeFranes[offset0 + 4]! + tr.x,
    preComputeFranes[offset1 + 4]! + tr.x,
    t,
  );
  const f = lerp(
    preComputeFranes[offset0 + 5]! + tr.y,
    preComputeFranes[offset1 + 5]! + tr.y,
    t,
  );

  // column major
  return new Float32Array([a, b, 0, c, d, 0, e, f, 1]);
}
