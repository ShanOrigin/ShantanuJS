import { UsageError } from '../../core/errors/usage-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when a color value does not match any supported color format.
 *
 * This error indicates incorrect usage of the color API where the provided
 * value fails to conform to the supported color syntaxes, such as named colors,
 * hexadecimal notation, RGB/RGBA, or HSL/HSLA formats.
 */
export class InvalidColorFormatError extends UsageError {
  /**
   * Creates a new InvalidColorFormatError instance.
   *
   * @param receivedValue - The color value provided by the caller.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(receivedValue: string, source: string) {
    super(
      'COLOR_INVALID_FORMAT',
      'Invalid color format.',
      new ErrorContext(receivedValue, 'named | hex | rgb(a) | hsl(a)', source)
    );
  }
}
