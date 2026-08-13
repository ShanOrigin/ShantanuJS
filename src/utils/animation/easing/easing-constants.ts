/**
 * List of supported easing function identifiers.
 *
 * These values define the timing functions used to interpolate animation
 * progress over time. Each easing represents a distinct acceleration and
 * deceleration curve applied during animation playback.
 *
 * This list is used for validation and lookup of easing behaviors.
 */
export const EASING_MAP: readonly string[] = [
  "linear",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
  "easeOutBounce",
  "easeInBounce",
  "easeInOutBounce",
] as const;
