import type {
  BaseTransformations,
  CreateTransformationMatrixProps,
  PivotTransformations,
} from "../../../models/types/geometry/transform";

import { makeCubic } from "./polynomial-utils.js";
import { createAffineTransformMatrix } from "../affine/affine-matrix-creation.js";
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
 * @param initialState - Initial transformation values (scale, rotate, skew, translate) without pivot applied.
 * @param finalState - Final transformation values including pivot settings.
 * @param base - Base transformation matrix as a `Float32Array` (column-major).
 *
 * @returns An object with cubic polynomials `{ a, b, c, d, e, f }` representing each matrix coefficient.
 */

export function fitTransformPolynomialsFast(
  initialState: BaseTransformations,
  finalState: PivotTransformations,
  base?: Float32Array,
) {
  // Compose start/end matrices

  const { scale: iS, rotate: iR, skew: iSk } = initialState;
  const { scale: fS, rotate: fR, skew: fSk } = finalState;
  let a0!: number,
    b0!: number,
    c0!: number,
    d0!: number,
    e0!: number,
    f0!: number;

  [a0 = 1, b0 = 0, , c0 = 0, d0 = 1, , e0 = 0, f0 = 0] =
    createAffineTransformMatrix({
      transformations: {
        rotate: {
          angle: iR?.angle,
          tType: "p",
          px: fR.px ?? 0,
          py: fR.py ?? 0,
        },
        scale: {
          sx: iS?.sx,
          sy: iS?.sy,
          tType: "p",
          px: fS.px ?? 0,
          py: fS.py ?? 0,
        },
        skew: {
          sx: iSk?.sx,
          sy: iSk?.sy,
          tType: "p",
          px: fSk.px ?? 0,
          py: fSk.py ?? 0,
        },
      },
      major: "column",
      arrayType: "float32",
    } as CreateTransformationMatrixProps) as Float32Array;

  let a1!: number,
    b1!: number,
    c1!: number,
    d1!: number,
    e1!: number,
    f1!: number;

  [a1 = 1, b1 = 0, , c1 = 0, d1 = 1, , e1 = 0, f1 = 0] =
    createAffineTransformMatrix({
      transformations: {
        rotate: {
          angle: fR?.angle,
          tType: "p",
          px: fR.px ?? 0,
          py: fR.py ?? 0,
        },
        scale: {
          sx: fS?.sx,
          sy: fS?.sy,
          tType: "p",
          px: fS.px ?? 0,
          py: fS.py ?? 0,
        },
        skew: {
          sx: fSk?.sx,
          sy: fSk?.sy,
          tType: "p",
          px: fSk.px ?? 0,
          py: fSk.py ?? 0,
        },
      },
      major: "column",
      arrayType: "float32",
    } as CreateTransformationMatrixProps) as Float32Array;

  // Build cubic per coefficient
  return {
    a: makeCubic(a0, a1),
    b: makeCubic(b0, b1),
    c: makeCubic(c0, c1),
    d: makeCubic(d0, d1),
    e: makeCubic(e0, e1),
    f: makeCubic(f0, f1),
  };
}
