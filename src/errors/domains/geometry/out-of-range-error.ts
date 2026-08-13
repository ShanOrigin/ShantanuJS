import { ErrorContext } from "../../core/diagnostics/error-context.js";
import { UsageError } from "../../core/errors/usage-error.js";

/**
 * Error thrown when a numeric value falls outside an allowed inclusive range.
 *
 * This error indicates incorrect usage of the API where a parameter violates
 * defined boundary constraints required for valid operation.
 */
export class OutOfRangeError extends UsageError {
  /**
   * Creates a new OutOfRangeError instance.
   *
   * @param value - The value that is outside the allowed range.
   * @param min - Lower inclusive bound of the allowed range.
   * @param max - Upper inclusive bound of the allowed range.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(value: number, min: number, max: number, source: string) {
    super(
      "OUT_OF_RANGE",
      "Value is outside the allowed range.",
      new ErrorContext(value, `[${min}, ${max}]`, source),
    );
  }
}
