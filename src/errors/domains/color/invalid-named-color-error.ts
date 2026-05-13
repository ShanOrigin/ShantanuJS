import { UsageError } from '../../core/errors/usage-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when a provided named color is not recognized or supported
 * by the library.
 *
 * This error indicates incorrect usage of the color API where a color name
 * is syntactically valid but does not exist in the library’s supported
 * named color set.
 */
export class InvalidNamedColorError extends UsageError {
  /**
   * Creates a new InvalidNamedColorError instance.
   *
   * @param colorName - The named color value provided by the caller.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(colorName: string, source: string) {
    super(
      'COLOR_INVALID_NAMED_COLOR',
      'Invalid named color.',
      new ErrorContext(colorName, 'supported named color', source)
    );
  }
}
