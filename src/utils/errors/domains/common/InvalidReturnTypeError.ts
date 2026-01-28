import { UsageError } from '../../core/errors/UsageError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when a function or method returns a value that does not
 * match its documented or expected return type.
 *
 * This error indicates a violation of the API contract, typically caused
 * by incorrect implementation, extension misuse, or overridden behavior
 * returning an incompatible value.
 */
export class InvalidReturnTypeError extends UsageError {
  /**
   * Creates a new InvalidReturnTypeError instance.
   *
   * @param receivedType - The actual type of the returned value.
   * @param expectedType - The return type expected by the contract.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(receivedType: string, expectedType: string, source: string) {
    super(
      'INVALID_RETURN_TYPE',
      'Returned value does not match the expected return type.',
      new ErrorContext(receivedType, expectedType, source)
    );
  }
}
