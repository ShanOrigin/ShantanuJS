import { UsageError } from '../../core/errors/UsageError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when a required animation parameter is not provided.
 *
 * This error indicates incorrect usage of the animation API where a mandatory
 * parameter is missing, preventing the animation from being created or
 * executed correctly.
 */
export class MissingRequiredAnimationParameterError extends UsageError {
  /**
   * Creates a new MissingRequiredAnimationParameterError instance.
   *
   * @param missingParameter - Name of the required parameter that was not provided.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(missingParameter: string, source: string) {
    super(
      'ANIMATION_MISSING_REQUIRED_PARAMETER',
      'Required animation parameter is missing.',
      new ErrorContext(missingParameter, 'parameter must be provided', source)
    );
  }
}
