import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a transformation matrix violates required geometric invariants.
 *
 * This error indicates that a matrix provided to a geometry or transformation
 * operation is structurally or mathematically invalid for the intended use.
 *
 * Typical causes include incorrect dimensions, non-invertible matrices where
 * invertibility is required, or values that violate the library’s transformation
 * constraints.
 */
export class InvalidMatrixError extends UsageError {
  /**
   * Creates a new InvalidMatrixError instance.
   *
   * @param reason - Description of the specific invariant or constraint violated.
   * @param receivedMatrix - The matrix value that caused the error.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(reason: string, receivedMatrix: unknown, source: string) {
    super(
      "GEOMETRY_INVALID_MATRIX",
      "Invalid transformation matrix.",
      new ErrorContext(receivedMatrix, reason, source),
    );
  }
}
