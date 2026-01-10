export abstract class ShantanuJSError extends Error {
  readonly code: string;
  readonly source: string;
  readonly context: ErrorContext;

  protected constructor(code: string, message: string, context: ErrorContext) {
    super(message);
    this.code = code;
    this.source = context.source;
    this.context = context;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
