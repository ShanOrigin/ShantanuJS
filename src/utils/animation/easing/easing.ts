import type {
  EasingFunction,
  EasingType,
} from "../../../models/types/animation/easing";
import {
  EASING_FUNCTION_MAP,
  computeLinearEasing,
} from "./easing-functions.js";

/**
 * Returns an easing function based on a specified easing type.
 *
 * Purpose:
 * - Resolves easing identifiers into executable interpolation functions.
 * - Provides a unified orchestration layer for easing lookup.
 * - Ensures fallback safety using linear interpolation when resolution fails.
 *
 * Dependency:
 * - Depends on `EASING_FUNCTION_MAP`.
 * - Does not require any graphics API, DOM API, or external library.
 *
 * @param type - Identifier describing the easing behavior.
 *
 * @returns A normalized easing function that transforms progress values.
 */
export function easing(type: EasingType): EasingFunction {
  return EASING_FUNCTION_MAP[type] ?? computeLinearEasing;
}
