import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a value does not conform to the required or expected format.
 *
 * This error indicates incorrect usage of the API where an input value is
 * syntactically malformed or does not match the documented format contract,
 * even though the value may be of the correct type.
 *
 * It is intentionally generic and may be used across multiple domains
 * wherever format validation is required.
 */
export class InvalidFormatError extends UsageError {
  /**
   * Creates a new InvalidFormatError instance.
   *
   * @param receivedValue - The value provided by the caller that failed format validation.
   * @param expectedFormat - Description of the expected format.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(receivedValue: unknown, expectedFormat: string, source: string) {
    super(
      "INVALID_FORMAT",
      "Value does not match the expected format.",
      new ErrorContext(receivedValue, expectedFormat, source),
    );
  }
}
