import { UsageError } from '../../core/errors/UsageError.js';
import { ErrorContext } from '../../core/diagnostics/ErrorContext.js';

/**
 * Error thrown when an attempt is made to modify a read-only property
 * or immutable object structure.
 *
 * This error indicates a violation of immutability constraints where
 * a property is not allowed to be assigned, deleted, or redefined.
 *
 * It is a usage-level error representing an invalid operation rather
 * than a state or configuration failure.
 */
export class ReadOnlyPropertyError extends UsageError {
  /**
   * Creates a new ReadOnlyPropertyError instance.
   *
   * @param operation - The attempted operation (e.g. "assign", "delete", "define", "modify prototype").
   * @param propertyName - The property being targeted.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(operation: string, propertyName: string, source: string) {
    super(
      'READ_ONLY_PROPERTY',
      `Cannot ${operation} read-only property "${propertyName}".`,
      new ErrorContext(propertyName, 'property must remain immutable', source)
    );
  }
}
