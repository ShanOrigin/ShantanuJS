import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when attempting to register a filter using an identifier
 * that already exists on the target graphics object.
 *
 * Filter identifiers must be unique per graphics object so each filter
 * can be independently updated, queried, or removed.
 */
export class DuplicateFilterError extends UsageError {
  /**
   * Creates a new DuplicateFilterError instance.
   *
   * @param filterId - Identifier that is already in use.
   * @param filterType - Type of the existing filter.
   * @param source - Logical source where the error originated.
   */
  constructor(filterId: string, filterType: string, source: string) {
    super(
      "DUPLICATE_FILTER_ERROR",
      `A filter with id "${filterId}" already exists on this shape (type: "${filterType}").`,
      new ErrorContext(
        { filterId, filterType },
        "Use a unique filter identifier or remove the existing filter before registering another one.",
        source,
      ),
    );
  }
}
