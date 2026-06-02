import { InvalidFormatError } from '../../../errors/index.js';

/**
 * Applies a 2D affine transformation to a homogeneous coordinate buffer.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function multiplies a 2D affine transformation matrix with a buffer
 * of homogeneous coordinates and produces a transformed buffer.
 *
 * Each point in the buffer is expected to be represented as:
 *   [x, y, 1]
 *
 * The transformation is applied in the following form:
 *   x' = a·x + c·y + e
 *   y' = b·x + d·y + f
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The input buffer must contain homogeneous coordinates (length % 3 === 0)
 * - The transformation matrix is treated as immutable
 * - The Z component of all output points is always set to 1
 * - No allocation occurs when inPlace is true
 *
 * -------------------------------------------------------------------------
 * ERROR BEHAVIOR
 * -------------------------------------------------------------------------
 * Throws InvalidFormatError if the buffer length is not a multiple of 3.
 *
 * This indicates malformed homogeneous coordinate data and must be
 * treated as a caller-side contract violation.
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param transformation  DOMMatrix representing the affine transformation.
 * @param buffer          Flat Float32Array of homogeneous coordinates.
 * @param inPlace         Whether to mutate the input buffer directly.
 *
 * -------------------------------------------------------------------------
 * RETURNS
 * -------------------------------------------------------------------------
 * A Float32Array containing the transformed homogeneous coordinates.
 * This may be the original buffer if inPlace is true.
 */
export function applyTransformToHomogeneousBuffer(
  transformation: DOMMatrix | Float32Array,
  buffer: Float32Array,
  inPlace: boolean = false
): Float32Array {
  // -----------------------------------------------------------
  // STEP 1: Validate homogeneous buffer structure
  // -----------------------------------------------------------

  const len = buffer.length;

  if (len % 3 !== 0) {
    throw new InvalidFormatError(
      buffer,
      'Invalid homogeneous buffer: length must be a multiple of 3 [x, y, 1].',
      'transformation.applyTransformToHomogeneousBuffer()'
    );
  }

  // -----------------------------------------------------------
  // STEP 2: Resolve output buffer
  // -----------------------------------------------------------

  // Decide output buffer once
  const out = inPlace ? buffer : new Float32Array(len);

  // -----------------------------------------------------------
  // STEP 3: Cache transformation matrix coefficients
  // -----------------------------------------------------------

  let a: number = 1,
    b: number = 0,
    c: number = 0,
    d: number = 1,
    e: number = 0,
    f: number = 0;
  // Cache matrix values (critical for perf)
  if (transformation instanceof DOMMatrix) {
    a = transformation.a;
    b = transformation.b;
    c = transformation.c;
    d = transformation.d;
    e = transformation.e;
    f = transformation.f;
  } else if (transformation instanceof Float32Array) {
    a = transformation[0];
    b = transformation[1];
    c = transformation[3];
    d = transformation[4];
    e = transformation[6];
    f = transformation[7];
  }

  // -----------------------------------------------------------
  // STEP 4: Apply affine transformation per point
  // -----------------------------------------------------------

  for (let i = 0; i < len; i += 3) {
    const x = buffer[i] as number;
    const y = buffer[i + 1] as number;

    out[i] = a * x + c * y + e;
    out[i + 1] = b * x + d * y + f;
    out[i + 2] = 1;
  }

  return out;
}

/**
 * Computes the affine composition of two {@link DOMMatrix} instances and
 * stores the result directly inside the first matrix.
 *
 * ============================================================================
 * OPERATION
 * ============================================================================
 * M0 = M0 × M1
 *
 * Transformation order:
 *
 * 1. Apply M0
 * 2. Apply M1
 *
 * Since matrix multiplication is not commutative:
 *
 * M0 × M1 ≠ M1 × M0
 *
 * ============================================================================
 * MEMORY BEHAVIOR
 * ============================================================================
 * This function performs the multiplication in-place using
 * {@link DOMMatrix.multiplySelf}.
 *
 * No additional DOMMatrix instances are allocated.
 *
 * ============================================================================
 * EXAMPLE
 * ============================================================================
 * const parent = new DOMMatrix();
 * const child = new DOMMatrix();
 *
 * affineMatrixMultiplyUsingDOMMatrix(parent, child);
 *
 * // parent now contains:
 * // parent × child
 *
 * @param M0 Destination matrix and left-hand operand.
 * @param M1 Right-hand operand.
 *
 * @returns Reference to M0 after composition.
 */
export function affineMatrixMultiplyUsingDOMMatrix(
  M0: DOMMatrix,
  M1: DOMMatrix
): DOMMatrix {
  if (!(M0 instanceof DOMMatrix) || !(M1 instanceof DOMMatrix)) {
    return M0;
  }

  M0.multiplySelf(M1);

  return M0;
}

/**
 * Computes the composition of two 2D affine transformation matrices.
 *
 * ============================================================================
 * MATRIX LAYOUT
 * ============================================================================
 * Each matrix is stored using the following layout:
 *
 * [
 *   a, b, 0,
 *   c, d, 0,
 *   e, f, 1
 * ]
 *
 * Which represents:
 *
 * ┌           ┐
 * │ a  b  0 │
 * │ c  d  0 │
 * │ e  f  1 │
 * └           ┘
 *
 * ============================================================================
 * OPERATION
 * ============================================================================
 * O = M0 × M1
 *
 * Transformation order:
 *
 * 1. Apply M0
 * 2. Apply M1
 *
 * ============================================================================
 * OPTIMIZATION
 * ============================================================================
 * This implementation is specialized for affine 2D matrices and avoids
 * dynamic memory allocation by writing directly into the supplied output
 * buffer.
 *
 * The third column is constant:
 *
 * [
 *   0,
 *   0,
 *   1
 * ]
 *
 * and is therefore omitted from the multiplication process.
 *
 * ============================================================================
 * INDEX MAPPING
 * ============================================================================
 * a -> matrix[0]
 * b -> matrix[1]
 * c -> matrix[3]
 * d -> matrix[4]
 * e -> matrix[6]
 * f -> matrix[7]
 *
 * @param M0 Left-hand affine matrix.
 * @param M1 Right-hand affine matrix.
 * @param O Output matrix receiving the multiplication result.
 *
 * @returns Reference to the output matrix.
 */
export function affineMatrixMultiply(
  M0: Float32Array,
  M1: Float32Array,
  O: Float32Array
): Float32Array {
  const a0 = M0[0];
  const b0 = M0[1];
  const c0 = M0[3];
  const d0 = M0[4];
  const e0 = M0[6];
  const f0 = M0[7];

  const a1 = M1[0];
  const b1 = M1[1];
  const c1 = M1[3];
  const d1 = M1[4];
  const e1 = M1[6];
  const f1 = M1[7];

  O[0] = a0 * a1 + b0 * c1;
  O[1] = a0 * b1 + b0 * d1;
  O[2] = 0;

  O[3] = c0 * a1 + d0 * c1;
  O[4] = c0 * b1 + d0 * d1;
  O[5] = 0;

  O[6] = e0 * a1 + f0 * c1 + e1;
  O[7] = e0 * b1 + f0 * d1 + f1;
  O[8] = 1;

  return O;
}
