/**
 * Holds structured diagnostic information associated with an error.
 *
 * This class represents the contextual details explaining *why* an error
 * occurred, without encoding any error behavior itself. It is intentionally
 * immutable and reusable across all error types.
 *
 * An ErrorContext captures:
 * - the value that was actually received
 * - the expected value or constraint
 * - the logical source (API boundary) where the error originated
 *
 * It is designed to be consumed by error classes, logging systems,
 * and debugging tools.
 */
export class ErrorContext {
  /** The actual value provided by the caller that caused the error. */
  readonly received: unknown;

  /** A human-readable description of the expected value or constraint. */
  readonly expected: string;

  /** Logical source identifier indicating where the error originated. */
  readonly source: string;

  /**
   * Creates a new ErrorContext instance.
   *
   * @param received - The value that was actually provided.
   * @param expected - Description of what was expected instead.
   * @param source - Logical source of the error (e.g. module or method name).
   */
  constructor(received: unknown, expected: string, source: string) {
    this.received = received;
    this.expected = expected;
    this.source = source;
  }
}
