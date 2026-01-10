import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';
import { UsageError } from '../../core/errors/UsageError.js';
export class NegativeValueError extends UsageError {
  constructor(value: number, source: string) {
    super(
      'NEGATIVE_VALUE',
      'Value must not be negative.',
      new ErrorContext(value, '>= 0', source)
    );
  }
}
