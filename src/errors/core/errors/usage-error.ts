import { ShantanuJSError } from "./shantanu-js-error.js";
import { ErrorContext } from "../diagnostics/error-context.js";

/**
 * Base class for errors caused by incorrect usage of the public API.
 *
 * A UsageError indicates that the caller has violated the API contract,
 * such as providing invalid values, missing required parameters, or
 * calling methods in an unsupported way.
 *
 * These errors are considered non-recoverable at runtime and should be
 * resolved by correcting the calling code rather than attempting retries
 * or fallbacks.
 *
 * This class is abstract and serves only as a semantic category for
 * concrete usage-related error types.
 */
export abstract class UsageError extends ShantanuJSError {
  /**
   * Constructs a new UsageError instance.
   *
   * @param code - Stable identifier representing the specific usage error.
   * @param message - Human-readable description of the misuse.
   * @param context - Structured diagnostic information explaining the failure.
   */
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(code, message, context);
  }
}
