import { ConfigurationError } from "../../core/errors/configuration-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a canvas cannot be attached to the specified parent element.
 *
 * This error indicates that the provided parent identifier does not correspond
 * to any existing DOM element at the time of canvas creation or initialization.
 *
 * It represents an invalid environment or setup configuration rather than
 * a runtime logic failure.
 */
export class CanvasParentNotFoundError extends ConfigurationError {
  /**
   * Creates a new CanvasParentNotFoundError instance.
   *
   * @param parentId - Identifier of the DOM element expected to host the canvas.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(parentId: string, source: string) {
    super(
      "CANVAS_PARENT_NOT_FOUND",
      "Canvas parent element was not found in the DOM.",
      new ErrorContext(parentId, "existing DOM element id", source),
    );
  }
}
