import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a required transformation parameter is not provided.
 *
 * This error indicates incorrect usage of the transformation API where a
 * mandatory parameter is missing, preventing the transformation from being
 * applied correctly.
 */
export class MissingRequiredTransformParameterError extends UsageError {
  /**
   * Creates a new MissingRequiredTransformParameterError instance.
   *
   * @param missingParameter - Name of the required parameter that was not provided.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(missingParameter: string, source: string) {
    super(
      "TRANSFORM_MISSING_REQUIRED_PARAMETER",
      "Required transformation parameter is missing.",
      new ErrorContext(missingParameter, "parameter must be provided", source),
    );
  }
}
