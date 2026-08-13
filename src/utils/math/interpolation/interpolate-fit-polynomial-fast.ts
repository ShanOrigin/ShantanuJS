/**
 * Evaluates cubic interpolation for transformation matrices at a given time `t`.
 *
 * Purpose:
 * - Interpolates each matrix coefficient (a–f) from the cubic polynomials produced by `fitTransformPolynomialsFast`.
 * - Optionally adds translation along a precomputed curve (path following).
 * - Returns a valid SVG `matrix(a b c d e f)` string for use in transforms.
 *
 * Dependencies:
 * - Requires cubic polynomials from `fitTransformPolynomialsFast`.
 * - Uses `evalCubic` to evaluate coefficients.
 * - Uses `interpolateAlongCurve` if `isTranslate` is enabled.
 *
 * @param polys - Cubic polynomials for each matrix coefficient (`a–f`).
 * @param curvePoints - List of sampled curve points for path interpolation.
 * @param t - Normalized time parameter in `[0, 1]`.
 * @param isTranslate - If `true`, apply additional translation along the curve.
 *
 * @returns A delta animation column-major Float32Array Matrix  representing the transform at time `t`.
 */

import { fitTransformPolynomialsFast } from "../polynomial/fit-polynomial-fast.js";
import { evalCubic } from "../polynomial/polynomial-utils.js";
import { interpolateAlongCurve } from "./interpolate-along-curve.js";

export function transformUsingPolynomialFast(
  // el: SVGElement,
  polys: ReturnType<typeof fitTransformPolynomialsFast>,
  curvePoints: { x: number; y: number }[],
  t: number,
  isTranslate: boolean,
) {
  const tr = isTranslate
    ? interpolateAlongCurve(curvePoints, t)
    : { x: 0, y: 0 };
  const a = evalCubic(polys.a, t);
  const b = evalCubic(polys.b, t);
  const c = evalCubic(polys.c, t);
  const d = evalCubic(polys.d, t);
  const e = evalCubic(polys.e, t) + tr.x;
  const f = evalCubic(polys.f, t) + tr.y;

  // column major
  return new Float32Array([a, b, 0, c, d, 0, e, f, 1]);
}
