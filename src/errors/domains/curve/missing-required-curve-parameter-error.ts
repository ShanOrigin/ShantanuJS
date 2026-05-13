import { UsageError } from '../../core/errors/usage-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when a required curve parameter is not provided.
 *
 * This error indicates incorrect usage of the curve-related API where a
 * mandatory parameter is missing, preventing the curve from being created
 * or evaluated correctly.
 */
export class MissingRequiredCurveParameterError extends UsageError {
  /**
   * Creates a new MissingRequiredCurveParameterError instance.
   *
   * @param missingParameter - Name of the required parameter that was not provided.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(missingParameter: string, source: string) {
    super(
      'CURVE_MISSING_REQUIRED_PARAMETER',
      'Required curve parameter is missing.',
      new ErrorContext(missingParameter, 'parameter must be provided', source)
    );
  }
}
