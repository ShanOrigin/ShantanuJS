import { StateError } from '../../core/errors/StateError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when an internal object or system state is invalid, inconsistent,
 * or corrupted.
 *
 * This error indicates that the library has entered a state that violates its
 * own internal invariants, making further operations unsafe or undefined.
 *
 * It is not caused by incorrect user input or configuration, but by unexpected
 * or unrecoverable internal conditions.
 *
 * This error is generic and may be used across multiple domains wherever
 * internal state validity cannot be guaranteed.
 */
export class InvalidInternalStateError extends StateError {
  /**
   * Creates a new InvalidInternalStateError instance.
   *
   * @param receivedState - Description or snapshot of the invalid internal state.
   * @param expectedState - Description of the expected or valid state.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    receivedState: unknown,
    expectedState: string,
    message: string,
    source: string
  ) {
    super(
      'INVALID_INTERNAL_STATE',
      `Internal state is invalid or corrupted. ${message}`,
      new ErrorContext(receivedState, expectedState, source)
    );
  }
}
