import type { ErrorContext } from '../diagnostics/ErrorContext.js';
/**
 * Base class for all errors thrown by the ShantanuJS library.
 *
 * This class establishes a common structure and identity for all library
 * errors, allowing them to be distinguished from native JavaScript errors
 * and third-party exceptions.
 *
 * Each ShantanuJSError carries:
 * - a stable, machine-readable error code
 * - a human-readable error message
 * - a structured ErrorContext describing the cause and source of the error
 *
 * This class is abstract and must not be instantiated directly.
 * Concrete error types should extend one of its categorized subclasses
 * (e.g. UsageError, StateError, ConfigurationError, InternalError).
 */
export abstract class ShantanuJSError extends Error {
  /** Stable, machine-readable identifier for the error type. */
  readonly code: string;

  /** Logical source indicating where the error originated. */
  readonly source: string;

  /** Structured diagnostic context associated with the error. */
  readonly context: ErrorContext;

  /**
   * Constructs a new ShantanuJSError instance.
   *
   * @param code - Stable identifier representing the error type.
   * @param message - Human-readable description of the error.
   * @param context - Structured diagnostic information explaining the failure.
   */
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(message);
    this.code = code;
    this.source = context.source;
    this.context = context;

    // Ensures correct prototype chaining when extending the native Error class.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
