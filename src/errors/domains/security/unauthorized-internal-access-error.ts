import { InternalError } from '../../core/errors/internal-error.js';
import { ErrorContext } from '../../core/diagnostics/error-context.js';

/**
 * Error thrown when restricted internal APIs, symbols, objects, or execution
 * paths are accessed without valid internal authorization.
 *
 * This error indicates that a caller attempted to access functionality that is
 * reserved exclusively for trusted ShantanuJS internal runtime components.
 *
 * Typical causes include:
 * - invalid internal access keys
 * - forged or mismatched internal symbols
 * - unauthorized direct invocation of internal APIs
 * - attempts to bypass runtime encapsulation boundaries
 * - accessing engine-private structures from external code
 *
 * This error represents a violation of internal runtime access control rules
 * and usually indicates either:
 * - corrupted execution flow
 * - misuse of private APIs
 * - unsupported external integration
 * - malicious or unintended internal boundary bypassing
 *
 * Since these violations compromise engine guarantees and encapsulation
 * integrity, execution may become unsafe after this error occurs.
 */
export class UnauthorizedInternalAccessError extends InternalError {
  /**
   * Creates a new UnauthorizedInternalAccessError instance.
   *
   * @param receivedKey - The actual key, token, or identifier received.
   * @param expectedKey - Description of the required authorized key or access condition.
   * @param message - Additional contextual explanation of the failure.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    receivedKey: unknown,
    expectedKey: string,
    message: string,
    source: string
  ) {
    super(
      'UNAUTHORIZED_INTERNAL_ACCESS',
      `Unauthorized internal access detected. ${message}`,
      new ErrorContext(receivedKey, expectedKey, source)
    );
  }
}
