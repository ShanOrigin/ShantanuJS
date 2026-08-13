import { TypeMismatchError } from "../../../errors/index.js";

/**
 * Validates and normalizes an onComplete callback.
 *
 * Purpose:
 * - Ensures the provided value is either undefined/null or a function.
 * - Returns a stable, callable function for downstream usage.
 * - Avoids runtime checks during execution by validating once.
 *
 * @param onComplete - User-provided completion callback
 * @returns A function safe to call on animation completion
 */
export function onCompleteFuncValidation(onComplete: unknown): Function {
  // Allow undefined or null (no-op)
  if (onComplete === undefined || onComplete === null) {
    return () => {};
  }

  // Reject non-function values
  if (typeof onComplete !== "function") {
    throw new TypeMismatchError(
      "onComplete",
      typeof onComplete,
      "function",
      "Animation.animate()",
    );
  }

  // At this point, onComplete is guaranteed to be a function
  return onComplete;
}
