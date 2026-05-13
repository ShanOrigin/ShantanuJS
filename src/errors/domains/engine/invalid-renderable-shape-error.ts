import { UsageError } from '../../core/errors/usage-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when a provided object is not a valid renderable shape.
 *
 * This indicates that the object does not satisfy the required contract
 * for rendering within the engine.
 */
export class InvalidRenderableShapeError extends UsageError {
  constructor(received: unknown, source: string) {
    super(
      'INVALID_RENDERABLE_SHAPE',
      'Provided object is not a valid renderable shape.',
      new ErrorContext(received, 'instance of GraphicsModel', source)
    );
  }
}
