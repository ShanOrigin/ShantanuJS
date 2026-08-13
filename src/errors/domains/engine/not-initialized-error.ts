import { StateError } from "../../core/errors/state-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a required variable, resource, or component
 * has not been initialized before use.
 *
 * This error indicates a violation of lifecycle constraints where
 * an operation depends on a state that should have been initialized
 * beforehand but was not.
 *
 * It represents a deterministic state failure and is not caused by
 * invalid user input, but by incorrect usage order or missing setup.
 */
export class NotInitializedError extends StateError {
  /**
   * Creates a new NotInitializedError instance.
   *
   * @param variableName - Name or identifier of the uninitialized variable.
   * @param message - Additional contextual message describing the failure.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(variableName: string, message: string, source: string) {
    super(
      "NOT_INITIALIZED",
      `Required '${variableName}' is not initialized. ${message}`,
      new ErrorContext(
        variableName,
        "initialized state required before usage",
        source,
      ),
    );
  }
}
