import {
  TransformGeometry,
  TransformGeometryWithPivot
} from '../../../../types/animation';

import { interpolateAlongCurve } from '../../../curve/curveGenerator/interpolateAlongCurve.js';
import { createTransformationMatrixProps } from '../../../../types/transformations.js';

// --- Cubic helper ---
interface CubicPoly {
  a0: number;
  a1: number;
  a2: number;
  a3: number;
}

/**
 * Creates a cubic polynomial for smooth interpolation between two numeric values.
 *
 * Purpose:
 * - Generates a cubic polynomial defined by start and end values, optionally with start and end velocities.
 * - Useful for smooth animations or transitions where gradual acceleration/deceleration is needed.
 *
 * Dependency:
 * - Pure JavaScript; does not depend on any graphics or DOM API.
 *
 * @param start - The starting value of the cubic interpolation.
 * @param end - The ending value of the cubic interpolation.
 * @param startVel - Optional starting velocity (default 0).
 * @param endVel - Optional ending velocity (default 0).
 *
 * @returns An object `{ a0, a1, a2, a3 }` representing the cubic polynomial coefficients.
 */

function makeCubic(
  start: number,
  end: number,
  startVel = 0,
  endVel = 0
): CubicPoly {
  const a0 = start;
  const a1 = startVel;
  const a2 = 3 * (end - start) - 2 * startVel - endVel;
  const a3 = -2 * (end - start) + startVel + endVel;
  return { a0, a1, a2, a3 };
}

/**
 * Evaluates a cubic polynomial at a specific normalized time.
 *
 * Purpose:
 * - Computes the interpolated value at `t` using the cubic polynomial coefficients.
 * - Typically used for smooth animations, easing, or frame-by-frame interpolation.
 *
 * Dependency:
 * - Pure JavaScript; does not depend on graphics, DOM, or external APIs.
 *
 * @param poly - Cubic polynomial coefficients `{ a0, a1, a2, a3 }`.
 * @param t - Normalized progress (0 to 1) along the cubic interpolation.
 *
 * @returns The interpolated numeric value at the given `t`.
 */

function evalCubic(poly: CubicPoly, t: number) {
  const t2 = t * t,
    t3 = t2 * t;
  return poly.a0 + poly.a1 * t + poly.a2 * t2 + poly.a3 * t3;
}

/**
 * Generates cubic polynomials for each transformation matrix coefficient to enable smooth animation.
 *
 * Purpose:
 * - Computes start and end transformation matrices based on provided geometry and pivot settings.
 * - Creates cubic polynomials for each matrix coefficient (a–f) to allow frame-by-frame interpolation.
 * - Optimized for fast evaluation in animation loops.
 *
 * Dependency:
 * - Relies on `composeWithBase` and `makeCubic` functions.
 * - Works with numeric arrays (`Float32Array`) for matrices; no direct dependency on DOM or graphics APIs.
 *
 * @param start - Initial transformation values (scale, rotate, skew, translate) without pivot applied.
 * @param end - Final transformation values including pivot settings.
 * @param base - Base transformation matrix as a `Float32Array` (column-major).
 *
 * @returns An object with cubic polynomials `{ a, b, c, d, e, f }` representing each matrix coefficient.
 */

export function fitTransformPolynomialsFast(
  start: TransformGeometry,
  end: TransformGeometryWithPivot,
  base: Float32Array,
  composeFn: Function
) {
  // Compose start/end matrices

  let a0!: number,
    b0!: number,
    c0!: number,
    d0!: number,
    e0!: number,
    f0!: number;

  if (composeFn && typeof composeFn == 'function') {
    [a0 = 1, b0 = 0, , c0 = 0, d0 = 1, , e0 = 0, f0 = 0] = composeFn({
      transformations: {
        rotate: {
          angle: start.Rotate,
          tType: 'p',
          px: end.rotatePivot?.[0] ?? 0,
          py: end.rotatePivot?.[1] ?? 0
        },
        scale: {
          sx: start.Scale[0],
          sy: start.Scale[1],
          tType: 'p',
          px: end.scalePivot?.[0] ?? 0,
          py: end.scalePivot?.[1] ?? 0
        },
        skew: {
          sx: start.Skew[0],
          sy: start.Skew[1],
          tType: 'p',
          px: end.skewPivot?.[0] ?? 0,
          py: end.skewPivot?.[1] ?? 0
        }
      },
      major: 'column',
      arrayType: 'float32',
      baseTMatrix: base,
      multiplyWithBase: true
    } as createTransformationMatrixProps) as Float32Array;
  }

  let a1!: number,
    b1!: number,
    c1!: number,
    d1!: number,
    e1!: number,
    f1!: number;

  if (composeFn && typeof composeFn == 'function') {
    [a1 = 1, b1 = 0, , c1 = 0, d1 = 1, , e1 = 0, f1 = 0] = composeFn({
      transformations: {
        rotate: {
          angle: end.Rotate,
          tType: 'p',
          px: end.rotatePivot?.[0] ?? 0,
          py: end.rotatePivot?.[1] ?? 0
        },
        scale: {
          sx: end.Scale[0],
          sy: end.Scale[1],
          tType: 'p',
          px: end.scalePivot?.[0] ?? 0,
          py: end.scalePivot?.[1] ?? 0
        },
        skew: {
          sx: end.Skew[0],
          sy: end.Skew[1],
          tType: 'p',
          px: end.skewPivot?.[0] ?? 0,
          py: end.skewPivot?.[1] ?? 0
        }
      },
      major: 'column',
      arrayType: 'float32',
      baseTMatrix: base,
      multiplyWithBase: true
    } as createTransformationMatrixProps) as Float32Array;
  }

  // Build cubic per coefficient
  return {
    a: makeCubic(a0, a1),
    b: makeCubic(b0, b1),
    c: makeCubic(c0, c1),
    d: makeCubic(d0, d1),
    e: makeCubic(e0, e1),
    f: makeCubic(f0, f1)
  };
}

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
 * @returns A CSS/SVG-compatible `matrix(a b c d e f)` string representing the transform at time `t`.
 */

export function transformUsingPolynomialFast(
  // el: SVGElement,
  polys: ReturnType<typeof fitTransformPolynomialsFast>,
  curvePoints: { x: number; y: number }[],
  t: number,
  isTranslate: boolean
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

  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;
}
