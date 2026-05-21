import {
  InvalidOptionError,
  TypeMismatchError
} from '../../../errors/index.js';
import type { EasingType } from '../../../models/types/animation';
import { easing } from '../easing/easing.js';
import { EASING_MAP } from '../easing/easing-constants.js';

/**
 * Validates and resolves an easing definition.
 *
 * Purpose:
 * - Accepts predefined easing names or custom easing functions.
 * - Ensures the final result is a function of type (t: number) => number.
 * - Performs strict runtime validation to prevent invalid easing behavior.
 *
 * @param ease - Easing identifier or easing function
 * @returns A validated easing function
 */
export function handleEasing(ease: unknown): (t: number) => number {
  // null or undefined is not allowed
  if (ease === null) ease = 'linear'; // null allowed
  if (ease === undefined) {
    throw new TypeMismatchError(
      'ease',
      String(ease),
      'string | function',
      'Animation.animate()'
    );
  }

  // Function easing
  if (typeof ease === 'function') {
    return ease as (t: number) => number;
  }

  // Named easing
  if (typeof ease === 'string') {
    if (!EASING_MAP.includes(ease)) {
      throw new InvalidOptionError(
        'ease',
        ease,
        EASING_MAP,
        'Animation.animate()'
      );
    }
    return easing(ease as EasingType);
  }

  // Everything else is invalid
  throw new TypeMismatchError(
    'ease',
    typeof ease,
    'string | function',
    'Animation.animate()'
  );
}
