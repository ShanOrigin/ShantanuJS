import { UsageError } from '../../core/errors/usage-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when an operation requires a shape to be attached to a canvas,
 * but the shape has not been added.
 *
 * This error indicates incorrect usage of the canvas API, where methods that
 * depend on canvas membership are invoked on a shape that is not currently
 * part of the canvas.
 */
export class ShapeNotAttachedToCanvasError extends UsageError {
  /**
   * Creates a new ShapeNotAttachedToCanvasError instance.
   *
   * @param shapeId - Identifier of the shape that is not attached.
   * @param canvasId - Identifier of the canvas expected to contain the shape.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(shapeId: string, canvasId: string, source: string) {
    super(
      'CANVAS_SHAPE_NOT_ATTACHED',
      'Shape is not attached to the canvas.',
      new ErrorContext(
        { shapeId, canvasId },
        'shape must be added to canvas before use',
        source
      )
    );
  }
}
