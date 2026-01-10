export class ErrorContext {
  readonly received: unknown;
  readonly expected: string;
  readonly source: string;

  constructor(received: unknown, expected: string, source: string) {
    this.received = received;
    this.expected = expected;
    this.source = source;
  }
}
