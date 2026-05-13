import { ConfigurationError } from '../../core/errors/ConfigurationError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when the provided rendering element does not match
 * the expected rendering context.
 *
 * This error indicates a mismatch between the declared rendering context
 * (e.g. SVG, Canvas) and the actual type of the graphical element supplied.
 *
 * It represents a configuration-level inconsistency rather than a runtime
 * state or usage error.
 */
export class InvalidRenderingContextError extends ConfigurationError {
  /**
   * Creates a new InvalidRenderingContextError instance.
   *
   * @param receivedElement - The actual graphical element provided.
   * @param expectedContext - The expected rendering context (e.g. SVGElement).
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    receivedElement: unknown,
    expectedContext: string,
    source: string
  ) {
    super(
      'INVALID_RENDERING_CONTEXT',
      'Rendering element does not match the expected context.',
      new ErrorContext(receivedElement, expectedContext, source)
    );
  }
}
