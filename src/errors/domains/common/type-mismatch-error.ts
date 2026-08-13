import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a parameter is provided with a value whose type does not
 * match the expected type.
 *
 * This error indicates incorrect usage of the API where a parameter requires
 * a specific data type, but a different type was supplied.
 */
export class TypeMismatchError extends UsageError {
  /**
   * Creates a new TypeMismatchError instance.
   *
   * @param parameterName - Name of the parameter with the mismatched type.
   * @param receivedType - The actual type of the value provided.
   * @param expectedType - The type expected by the API.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    parameterName: string,
    receivedType: string,
    expectedType: string,
    source: string,
  ) {
    super(
      "TYPE_MISMATCH",
      `Type mismatch for parameter '${parameterName}'.`,
      new ErrorContext(receivedType, expectedType, source),
    );
  }
}
