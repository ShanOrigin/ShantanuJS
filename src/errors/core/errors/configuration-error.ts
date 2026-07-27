import { ShantanuJSError } from "./shantanu-js-error.js";
import { ErrorContext } from "../diagnostics/error-context.js";

/**
 * Base class for errors caused by invalid or unsupported configuration.
 *
 * A ConfigurationError indicates that the library was initialized or
 * configured with settings that are incompatible with the current
 * environment or with the library's supported capabilities.
 *
 * Typical causes include missing or invalid environment prerequisites,
 * unsupported backends, or conflicting configuration options.
 *
 * This class is abstract and exists solely to categorize configuration-
 * related failures.
 */
export abstract class ConfigurationError extends ShantanuJSError {
  /**
   * Constructs a new ConfigurationError instance.
   *
   * @param code - Stable identifier representing the specific configuration error.
   * @param message - Human-readable description of the configuration issue.
   * @param context - Structured diagnostic information explaining the failure.
   */
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(code, message, context);
  }
}
