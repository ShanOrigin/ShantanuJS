import {
  NegativeValueError,
  TypeMismatchError
} from '../../../errors/index.js';

/**
 * Validates and normalizes animation duration.
 *
 * Purpose:
 * - Ensures the provided duration is a valid number.
 * - Rejects zero or negative durations, as animations require
 *   a strictly positive time interval.
 *
 * Notes:
 * - This function performs validation only.
 * - No implicit normalization or correction is applied.
 *
 * @param duration - User-provided animation duration
 * @returns Validated animation duration
 */
export function timeValidation(duration: unknown): number {
  // Duration must be a number
  if (typeof duration !== 'number') {
    throw new TypeMismatchError(
      'duration',
      typeof duration,
      'number',
      'Animation.animate()'
    );
  }

  // Duration must be strictly positive
  if (duration <= 0) {
    throw new NegativeValueError(duration, 'Animation.animate()');
  }

  return duration;
}
