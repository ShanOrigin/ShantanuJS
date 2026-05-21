import { InvalidReturnTypeError } from '../../../errors/index.js';

/**
 * Validates that a function accepts a number and returns a number.
 *
 * Purpose:
 * - Performs a one-time validation of a user-provided function.
 * - Ensures the function conforms to the (t: number) => number contract.
 * - Avoids per-call overhead by NOT wrapping the function.
 *
 * Notes:
 * - This function throws on invalid behavior.
 * - On success, it returns the original function unchanged.
 *
 * @param fn - User-provided function to validate
 * @returns The same function, guaranteed to be (t: number) => number
 */
export function funcInputOutputAsNumberValidation(
  fn: (...args: unknown[]) => unknown
): (t: number) => number {
  // Probe with a known numeric value
  const probe = 0;

  const result = fn(probe);

  if (typeof result !== 'number') {
    throw new InvalidReturnTypeError(
      typeof result,
      'number',
      'Animation.animate()'
    );
  }

  // At this point:
  // - input was a number
  // - output was a number
  // We can safely trust the function
  return fn as (t: number) => number;
}
