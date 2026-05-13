import { UsageError } from '../../core/errors/UsageError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when a parameter is provided with a value that is not
 * part of its allowed option set.
 *
 * This error indicates incorrect usage of the API where a parameter
 * accepts only a predefined set of values, but a different value
 * was supplied.
 */
export class InvalidOptionError extends UsageError {
  /**
   * Creates a new InvalidOptionError instance.
   *
   * @param parameterName - Name of the parameter with the invalid value.
   * @param receivedValue - The value provided by the caller.
   * @param allowedValues - List of allowed values for the parameter.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    parameterName: string,
    receivedValue: string,
    allowedValues: readonly string[],
    source: string
  ) {
    super(
      'INVALID_OPTION',
      `Invalid value provided for parameter '${parameterName}'.`,
      new ErrorContext(receivedValue, allowedValues.join(' | '), source)
    );
  }
}
