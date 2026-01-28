import { ShantanuJSError } from './ShantanuJSError.js';
import { ErrorContext } from '../diagnostics/ErrorContext.js';

/**
 * Base class for errors caused by invalid object or system state.
 *
 * A StateError indicates that an operation was attempted at an inappropriate
 * time or lifecycle phase, even though the operation itself and its arguments
 * may be otherwise valid.
 *
 * These errors represent violations of sequencing, timing, or lifecycle
 * constraints, such as invoking methods out of order or performing conflicting
 * operations concurrently.
 *
 * This class is abstract and serves solely as a semantic category for
 * state-related failures.
 */
export abstract class StateError extends ShantanuJSError {
  /**
   * Constructs a new StateError instance.
   *
   * @param code - Stable identifier representing the specific state error.
   * @param message - Human-readable description of the state violation.
   * @param context - Structured diagnostic information explaining the failure.
   */
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(code, message, context);
  }
}
