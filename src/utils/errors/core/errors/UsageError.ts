import { ErrorContext } from '../diagnostics/ErrorContext.js';
import { ShantanuJSError } from './ShantanuJSError';

export abstract class UsageError extends ShantanuJSError {
  protected constructor(code: string, message: string, context: ErrorContext) {
    super(code, message, context);
  }
}
