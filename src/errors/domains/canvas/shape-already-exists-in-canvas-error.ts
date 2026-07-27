import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when attempting to add a shape to a canvas that already
 * contains the same shape.
 *
 * This error represents a violation of the canvas usage contract, where
 * duplicate insertion of the same shape is not allowed in order to preserve
 * internal consistency and rendering invariants.
 */
export class ShapeAlreadyExistsInCanvasError extends UsageError {
  /**
   * Creates a new ShapeAlreadyExistsInCanvasError instance.
   *
   * @param shapeId - Identifier of the shape that already exists in the canvas.
   * @param canvasId - Identifier of the canvas containing the shape.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(shapeId: string, canvasId: string, source: string) {
    super(
      "CANVAS_SHAPE_ALREADY_EXISTS",
      "Shape already exists in the canvas.",
      new ErrorContext(
        { shapeId, canvasId },
        "shape must not already be added to the canvas",
        source,
      ),
    );
  }
}
