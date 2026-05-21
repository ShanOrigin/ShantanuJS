import {
  TransformGeometry,
  TransformGeometryWithPivot
} from '../../../models/types/animation';

import { interpolateAlongCurve } from '../interpolation/interpolate-along-curve.js';
import { CreateTransformationMatrixProps } from '../../../models/types/affine-transformations';

import { makeCubic } from './polynomial-utils.js';
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
  composeFn: Function,
  base?: Float32Array
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
      arrayType: 'float32'
      // baseTMatrix: base,
      // multiplyWithBase: true
    } as CreateTransformationMatrixProps) as Float32Array;
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
      arrayType: 'float32'
      //  baseTMatrix: base,
      //  multiplyWithBase: true
    } as CreateTransformationMatrixProps) as Float32Array;
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
