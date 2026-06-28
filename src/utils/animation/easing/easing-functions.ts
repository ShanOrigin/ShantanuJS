import type {
  EasingFunction,
  EasingType
} from '../../../models/types/animation/easing';

/**
 * Computes linear easing.
 *
 * Mathematical Behavior:
 * - Produces a constant interpolation rate.
 * - No acceleration or deceleration is applied.
 *
 * Formula:
 * - f(t) = t
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Unmodified progress value.
 */
export function computeLinearEasing(t: number): number {
  return t;
}

/**
 * Computes quadratic ease-in easing.
 *
 * Mathematical Behavior:
 * - Starts slowly and accelerates toward the end.
 * - Acceleration follows a quadratic curve.
 *
 * Formula:
 * - f(t) = t²
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Quadratically accelerated progress value.
 */
function computeEaseInQuadEasing(t: number): number {
  return t * t;
}

/**
 * Computes quadratic ease-out easing.
 *
 * Mathematical Behavior:
 * - Starts quickly and decelerates toward the end.
 * - Inverse quadratic deceleration curve.
 *
 * Formula:
 * - f(t) = t × (2 - t)
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Quadratically decelerated progress value.
 */
function computeEaseOutQuadEasing(t: number): number {
  return t * (2 - t);
}

/**
 * Computes quadratic ease-in-out easing.
 *
 * Mathematical Behavior:
 * - Accelerates during the first half.
 * - Decelerates during the second half.
 * - Produces symmetric quadratic interpolation.
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Smooth quadratic interpolated progress value.
 */
function computeEaseInOutQuadEasing(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Computes cubic ease-in easing.
 *
 * Mathematical Behavior:
 * - Starts extremely slowly and accelerates aggressively.
 * - Uses cubic growth for acceleration.
 *
 * Formula:
 * - f(t) = t³
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Cubically accelerated progress value.
 */
function computeEaseInCubicEasing(t: number): number {
  return t * t * t;
}

/**
 * Computes cubic ease-out easing.
 *
 * Mathematical Behavior:
 * - Starts rapidly and slows aggressively near completion.
 * - Produces smooth deceleration using cubic reduction.
 *
 * Formula:
 * - f(t) = (t - 1)³ + 1
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Cubically decelerated progress value.
 */
function computeEaseOutCubicEasing(t: number): number {
  return --t * t * t + 1;
}

/**
 * Computes cubic ease-in-out easing.
 *
 * Mathematical Behavior:
 * - Accelerates cubically during the first half.
 * - Decelerates cubically during the second half.
 * - Produces a smooth symmetric transition.
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Smooth cubic interpolated progress value.
 */
function computeEaseInOutCubicEasing(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Computes bounce ease-out easing.
 *
 * Mathematical Behavior:
 * - Simulates a bouncing object losing energy after impact.
 * - Motion begins rapidly and settles through multiple rebounds.
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Bounce-based decelerated progress value.
 */
function computeEaseOutBounceEasing(t: number): number {
  const bounceMultiplier = 7.5625;
  const bounceDivisor = 2.75;

  if (t < 1 / bounceDivisor) {
    return bounceMultiplier * t * t;
  }

  if (t < 2 / bounceDivisor) {
    t -= 1.5 / bounceDivisor;

    return bounceMultiplier * t * t + 0.75;
  }

  if (t < 2.5 / bounceDivisor) {
    t -= 2.25 / bounceDivisor;

    return bounceMultiplier * t * t + 0.9375;
  }

  t -= 2.625 / bounceDivisor;

  return bounceMultiplier * t * t + 0.984375;
}

/**
 * Computes bounce ease-in easing.
 *
 * Mathematical Behavior:
 * - Reverse form of bounce ease-out.
 * - Simulates a bouncing object accelerating into motion.
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Bounce-based accelerated progress value.
 */
function computeEaseInBounceEasing(t: number): number {
  return 1 - computeEaseOutBounceEasing(1 - t);
}

/**
 * Computes bounce ease-in-out easing.
 *
 * Mathematical Behavior:
 * - Combines ease-in bounce for the first half.
 * - Combines ease-out bounce for the second half.
 * - Produces symmetric bouncing interpolation.
 *
 * @param t - Normalized animation progress in the range [0, 1].
 * @returns Symmetric bounce interpolated progress value.
 */
function computeEaseInOutBounceEasing(t: number): number {
  return t < 0.5
    ? (1 - computeEaseOutBounceEasing(1 - 2 * t)) / 2
    : (1 + computeEaseOutBounceEasing(2 * t - 1)) / 2;
}

/**
 * Collection of supported easing function implementations.
 *
 * Purpose:
 * - Centralizes easing function lookup.
 * - Maps easing identifiers to their corresponding implementations.
 * - Prevents repeated conditional branching during easing resolution.
 *
 * Dependency:
 * - Pure JavaScript object containing stateless mathematical functions.
 */
export const EASING_FUNCTION_MAP: Record<EasingType, EasingFunction> = {
  linear: computeLinearEasing,

  easeInQuad: computeEaseInQuadEasing,
  easeOutQuad: computeEaseOutQuadEasing,
  easeInOutQuad: computeEaseInOutQuadEasing,

  easeInCubic: computeEaseInCubicEasing,
  easeOutCubic: computeEaseOutCubicEasing,
  easeInOutCubic: computeEaseInOutCubicEasing,

  easeOutBounce: computeEaseOutBounceEasing,
  easeInBounce: computeEaseInBounceEasing,
  easeInOutBounce: computeEaseInOutBounceEasing
};
