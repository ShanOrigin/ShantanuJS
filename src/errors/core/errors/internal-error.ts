import { ShantanuJSError } from "./shantanu-js-error.js";
import { ErrorContext } from "../diagnostics/error-context.js";
/**
 * Base class for errors caused by internal library failures.
 *
 * An InternalError represents a failure originating from within the
 * ShantanuJS runtime itself rather than from invalid user input,
 * incorrect API usage, or external configuration mistakes.
 *
 * These errors indicate that the library entered an unexpected or
 * inconsistent execution state that should normally be impossible
 * under correct internal behavior.
 *
 * Typical examples include:
 * - broken internal invariants
 * - unreachable execution branches
 * - renderer synchronization failures
 * - corrupted lifecycle state transitions
 * - unexpected null or undefined internal references
 * - failed assumptions inside the engine runtime
 *
 * InternalError exists as a semantic categorization layer so that all
 * engine/runtime-related failures can share a common identity and be
 * handled independently from usage or state violations.
 *
 * This class is abstract and must only be extended by concrete internal
 * error implementations.
 */
export abstract class InternalError extends ShantanuJSError {
  /**
   * Constructs a new InternalError instance.
   *
   * @param code - Stable identifier representing the internal error type.
   * @param message - Human-readable description of the internal failure.
   * @param context - Structured diagnostic information explaining the failure.
   */
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(code, message, context);
  }
}
