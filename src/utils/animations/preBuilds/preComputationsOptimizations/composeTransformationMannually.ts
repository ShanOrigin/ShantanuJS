import { TransformGeometryWithPivot } from '../../../../types/animation';

type Mat = [number, number, number, number, number, number];

/**
 * Composes a 2D transformation matrix with a base matrix, including pivot adjustments.
 *
 * Purpose:
 * - Generates a 2D affine transformation matrix that applies scale, skew, rotation, and optional translation relative to specified pivots.
 * - Can combine the resulting local transformation with a pre-existing base matrix in either order (`pre` = local × base or base × local).
 * - Useful for hierarchical transformations, animation, or applying complex geometric manipulations with pivot awareness.
 *
 * Dependency:
 * - Uses basic JavaScript math (`Math.cos`, `Math.sin`, `Math.tan`, `Math.PI`).
 * - Operates on Float32Array/base matrices; does not require any graphics API or DOM API.
 *
 * @param base - Base matrix as a Float32Array (column-major format: `[a,b,_,c,d,_,e,f,_]`).
 * @param params - Transformation parameters including optional `Scale`, `Skew`, `Rotate`, `Translate` and their corresponding pivots (`scalePivot`, `rotatePivot`, `skewPivot`).
 * @param pre - Boolean indicating multiplication order: `true` for local × base, `false` for base × local. Defaults to `true`.
 *
 * @returns A 2D affine transformation matrix `[a, b, c, d, e, f]` representing the composed transformation.
 */

export function composeWithBase(
  base: Float32Array, // column-major [a,b,_,c,d,_,e,f,_]
  params: TransformGeometryWithPivot,
  pre: boolean = true // true: local × base ; false: base × local
): Mat {
  const {
    Scale = [1, 1],
    Skew = [0, 0],
    Rotate = 0,
    Translate = [0, 0],
    scalePivot = [0, 0],
    rotatePivot = [0, 0],
    skewPivot = [0, 0]
  } = params as {
    Scale?: [number, number];
    Skew?: [number, number]; // degrees
    Rotate?: number; // degrees
    Translate?: [number, number]; // translation
    scalePivot?: [number, number];
    rotatePivot?: [number, number];
    skewPivot?: [number, number];
  };

  // --- identity matrix ---
  let M: Mat = [1, 0, 0, 1, 0, 0];

  // helper: pre-multiply (A ∘ B)
  const mul = (A: Mat, B: Mat): Mat => {
    const [aA, bA, cA, dA, eA, fA] = A;
    const [aB, bB, cB, dB, eB, fB] = B;
    return [
      aA * aB + cA * bB,
      bA * aB + dA * bB,
      aA * cB + cA * dB,
      bA * cB + dA * dB,
      aA * eB + cA * fB + eA,
      bA * eB + dA * fB + fA
    ];
  };

  // helper: op with pivot (L linear + pivot correction)
  const opWithPivot = (
    L: [number, number, number, number],
    px: number,
    py: number
  ): Mat => {
    const [a, b, c, d] = L;
    const e = px - (a * px + c * py);
    const f = py - (b * px + d * py);
    return [a, b, c, d, e, f];
  };

  // 1) Rotate
  if (Rotate !== 0) {
    const rad = (Rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const R = opWithPivot(
      [cos, sin, -sin, cos],
      rotatePivot[0],
      rotatePivot[1]
    );
    M = mul(R, M);
  }

  // 2) Scale
  if (Scale[0] !== 1 || Scale[1] !== 1) {
    const S = opWithPivot(
      [Scale[0], 0, 0, Scale[1]],
      scalePivot[0],
      scalePivot[1]
    );
    M = mul(S, M);
  }

  // 3) Skew
  if (Skew[0] !== 0 || Skew[1] !== 0) {
    const kx = Math.tan((Skew[0] * Math.PI) / 180);
    const ky = Math.tan((Skew[1] * Math.PI) / 180);
    const K = opWithPivot([1, ky, kx, 1], skewPivot[0], skewPivot[1]);
    M = mul(K, M);
  }
  /*
  // 4) Translate
  if (Translate[0] !== 0 || Translate[1] !== 0) {
    const [tx, ty] = Translate;
    const T: Mat = [1, 0, 0, 1, tx, ty];
    M = mul(T, M);
  }
*/
  // --- combine with base ---
  const baseM: Mat = [base[0], base[1], base[3], base[4], base[6], base[7]];
  const out = pre ? mul(M, baseM) : mul(baseM, M);

  return out;
}

/*
 
// ++++++ extra composeWithBase function work fine +++++++++

function matIdentity(): Mat {
  return [1, 0, 0, 1, 0, 0];
}

// C = A ∘ B  (apply B, then A)
function matPreMul(A: Mat, B: Mat): Mat {
  const [aA, bA, cA, dA, eA, fA] = A;
  const [aB, bB, cB, dB, eB, fB] = B;
  return [
    aA * aB + cA * bB, // a
    bA * aB + dA * bB, // b
    aA * cB + cA * dB, // c
    bA * cB + dA * dB, // d
    aA * eB + cA * fB + eA, // e
    bA * eB + dA * fB + fA // f
  ];
}

// Build an op matrix with pivot compensation for a given linear L and pivot p:
// T = [L, t],  where t = p - L*p
function opWithPivot(L: Mat, px: number, py: number): Mat {
  const [a, b, c, d] = L;
  const e = px - (a * px + c * py);
  const f = py - (b * px + d * py);
  return [a, b, c, d, e, f];
}

function rotOp(angleDeg: number, px: number, py: number): Mat {
  if (angleDeg === 0) return matIdentity();
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return opWithPivot([cos, sin, -sin, cos, 0, 0], px, py);
}

function scaleOp(sx: number, sy: number, px: number, py: number): Mat {
  if (sx === 1 && sy === 1) return matIdentity();
  return opWithPivot([sx, 0, 0, sy, 0, 0], px, py);
}

// SkewX = kx (shear Y into X), SkewY = ky (shear X into Y)
// Combined linear used in your earlier math: L = [[1, ky],[kx, 1]]
function skewOp(kxDeg: number, kyDeg: number, px: number, py: number): Mat {
  if (kxDeg === 0 && kyDeg === 0) return matIdentity();
  const rad = (d: number) => (d * Math.PI) / 180;
  const kx = Math.tan(rad(kxDeg)); // shear X by Y
  const ky = Math.tan(rad(kyDeg)); // shear Y by X
  // L = [a b c d] with a=1, b=ky, c=kx, d=1
  return opWithPivot([1, ky, kx, 1, 0, 0], px, py);
}

function translateOp(tx: number, ty: number): Mat {
  if (tx === 0 && ty === 0) return matIdentity();
  return [1, 0, 0, 1, tx, ty];
}

export function omposeWithBase(
  base: Float32Array, // column-major slots: [a,b,_,c,d,_,e,f,_]
  params: TransformGeometryWithPivot,
  pre: boolean = true // true: local × base ; false: base × local
): [number, number, number, number, number, number] {
  const {
    Scale = [1, 1],
    Skew = [0, 0],
    Rotate = 0,
    Translate = [0, 0],
    scalePivot = [0, 0],
    rotatePivot = [0, 0],
    skewPivot = [0, 0]
  } = params as {
    Scale?: [number, number];
    Skew?: [number, number]; // degrees
    Rotate?: number; // degrees
    Translate?: [number, number]; // optional, if you want it here
    scalePivot?: [number, number];
    rotatePivot?: [number, number];
    skewPivot?: [number, number];
  };

  // ----- Build local (Rotate → Scale → Skew → Translate) -----
  let M = matIdentity();

  // 1) Rotate around rotatePivot
  if (Rotate !== 0) {
    const R = rotOp(Rotate, rotatePivot[0], rotatePivot[1]);
    M = matPreMul(R, M);
  }

  // 2) Scale around scalePivot
  if (Scale[0] !== 1 || Scale[1] !== 1) {
    const S = scaleOp(Scale[0], Scale[1], scalePivot[0], scalePivot[1]);
    M = matPreMul(S, M);
  }

  // 3) Skew around skewPivot
  if (Skew[0] !== 0 || Skew[1] !== 0) {
    const K = skewOp(Skew[0], Skew[1], skewPivot[0], skewPivot[1]);
    M = matPreMul(K, M);
  }

  // 4) Translate (plain, no pivot)
  if (Translate[0] !== 0 || Translate[1] !== 0) {
    const T = translateOp(Translate[0], Translate[1]);
    M = matPreMul(T, M);
  }

  // ----- Combine with base -----
  const baseM: Mat = [base[0], base[1], base[3], base[4], base[6], base[7]];
  const out = pre ? matPreMul(M, baseM) : matPreMul(baseM, M);

  return out;
}

//////////////

//type Mat = [number, number, number, number, number, number];
*/
