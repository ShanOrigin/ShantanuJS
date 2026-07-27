import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a parameter is provided with a value that is not
 * part of its allowed option set.
 *
 * This error indicates incorrect usage of the API where a parameter
 * accepts only a predefined set of values, but a different value
 * was supplied.
 */
export class InvalidGroupMethodAccessError extends UsageError {
  /**
   * Creates a new InvalidOptionError instance.
   *
   * @param methodName - Name of the method which is invalid for movement of time..
   * @param message - User given message.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(methodName: string, message: string, source: string) {
    super(
      "INVALID_GROUP_METHOD_ACCESS",
      message,
      new ErrorContext(methodName, "", source),
    );
  }
}
