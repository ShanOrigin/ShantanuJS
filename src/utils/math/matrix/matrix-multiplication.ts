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
  transformation: DOMMatrix,
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

  // Cache matrix values (critical for perf)
  const a = transformation.a;
  const b = transformation.b;
  const c = transformation.c;
  const d = transformation.d;
  const e = transformation.e;
  const f = transformation.f;

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
