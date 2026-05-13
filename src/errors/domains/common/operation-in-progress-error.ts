import { StateError } from '../../core/errors/StateError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when an operation is attempted while another incompatible
 * operation is already in progress.
 *
 * This error indicates a violation of the object or system lifecycle rules,
 * where concurrent or overlapping operations are not allowed.
 *
 * It is typically used to prevent state corruption caused by re-entrant
 * or conflicting actions.
 */
export class OperationInProgressError extends StateError {
  /**
   * Creates a new OperationInProgressError instance.
   *
   * @param currentOperation - Description of the operation currently in progress.
   * @param attemptedOperation - Description of the operation being attempted.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    currentOperation: string,
    attemptedOperation: string,
    source: string
  ) {
    super(
      'OPERATION_IN_PROGRESS',
      'Cannot perform operation while another operation is in progress.',
      new ErrorContext(
        attemptedOperation,
        `no operation allowed while '${currentOperation}' is in progress`,
        source
      )
    );
  }
}
