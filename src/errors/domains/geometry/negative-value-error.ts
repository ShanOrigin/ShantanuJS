import { ErrorContext } from "../../core/diagnostics/error-context.js";
import { UsageError } from "../../core/errors/usage-error.js";

/**
 * Error thrown when a numeric value is expected to be non-negative,
 * but a negative value is provided.
 *
 * This error represents incorrect usage of the API where a parameter
 * violates a basic numeric constraint required for correct operation.
 */
export class NegativeValueError extends UsageError {
  /**
   * Creates a new NegativeValueError instance.
   *
   * @param value - The negative value that caused the error.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(value: number, source: string) {
    super(
      "NEGATIVE_VALUE",
      "Value must not be negative.",
      new ErrorContext(value, ">= 0", source),
    );
  }
}
