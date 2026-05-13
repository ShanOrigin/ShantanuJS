import { UsageError } from '../../core/errors/UsageError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when an argument is provided but does not satisfy
 * the required contract or semantic constraints.
 *
 * This error indicates incorrect usage of the API where an argument
 * is present and well-typed, but its value is invalid for the expected
 * operation.
 *
 * Examples include malformed objects, unsupported value combinations,
 * or arguments that violate documented invariants.
 */
export class InvalidArgumentError extends UsageError {
  /**
   * Creates a new InvalidArgumentError instance.
   *
   * @param argumentName - Name of the argument that is invalid.
   * @param receivedValue - The value provided by the caller.
   * @param expectedDescription - Description of the expected argument contract.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    argumentName: string,
    receivedValue: unknown,
    expectedDescription: string,
    source: string
  ) {
    super(
      'INVALID_ARGUMENT',
      `Invalid value provided for argument '${argumentName}'.`,
      new ErrorContext(receivedValue, expectedDescription, source)
    );
  }
}
