import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';
import { UsageError } from '../../core/errors/UsageError.js';

export class OutOfRangeError extends UsageError {
  constructor(value: number, min: number, max: number, source: string) {
    super(
      'OUT_OF_RANGE',
      'Value is outside the allowed range.',
      new ErrorContext(value, `[${min}, ${max}]`, source)
    );
  }
}
