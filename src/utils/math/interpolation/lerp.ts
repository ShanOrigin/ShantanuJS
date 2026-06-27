import type {
  BaseTransformations,
  PivotTransformations
} from '../../../models/types/geometry/transform';
import type { Point2D } from '../../../models/types/geometry/types';

/**
 * Performs linear interpolation between two numbers.
 *
 * Purpose:
 * - Calculates a value that is a fraction `t` of the way between `start` and `end`.
 * - Useful for animations, smooth transitions, or gradual value changes over time.
 *
 * Dependency:
 * - This function does not depend on any graphics API, DOM API, or external tool.
 * - It works purely with basic JavaScript numbers.
 *
 * @param start - The starting value.
 * @param end - The ending value.
 * @param t - A number between 0 and 1 representing the interpolation factor.
 *
 * @returns A number representing the interpolated value.
 */
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

/**
 * Linearly interpolates between two 2D points (tuples of numbers).
 *
 * Purpose:
 * This function smoothly blends between two coordinate pairs `a` and `b`
 * based on a factor `t` that ranges from 0 to 1. When `t=0`, the result is `a`,
 * and when `t=1`, the result is `b`. Any value in between gives a weighted mix.
 *
 * Use cases:
 * - Animating positions in 2D.
 * - Creating smooth transitions between points.
 * - Interpolating geometry or motion paths.
 *
 * Dependencies:
 * - Relies on a `lerp` helper function (linear interpolation for single numbers).
 * - Does not depend on any graphics API, DOM, or external system. Pure math only.
 *
 * @param a - The starting point as a point `{x , y}`.
 * @param b - The ending point as a point `{x , y}`.
 * @param t - A value between 0 and 1 indicating interpolation progress.
 * @returns A new `{x, y}` tuple representing the interpolated point.
 */
export function lerpTuple(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// ---------- Interpolate between two sets of parameters ----------

/**
 * Interpolates (blends) between two transformation parameter sets.
 *
 * Purpose:
 * This function takes two transformation objects (`p1` and `p2`) and smoothly
 * transitions between them using a blend factor `t`. The transformations include
 * translation, scaling, skewing, and rotation. It outputs a new transformation
 * that represents the "in-between" state.
 *
 * Use cases:
 * - Smooth animation between two geometric states.
 * - Gradual transition of objects in 2D graphics or UI elements.
 * - Interpolating keyframes for motion effects.
 *
 * Dependencies:
 * - Uses `lerpTuple` for 2D pair interpolation.
 * - Uses `lerp` for single-number interpolation.
 * - Does not directly rely on any graphics API, DOM, or external system.
 * - Purely mathematical and reusable in different contexts.
 *
 * @param initialState - The starting transform parameters (translation, scale, skew, rotation).
 * @param finalState - The ending transform parameters, may also include pivot points.
 * @param t - A value between 0 and 1 indicating the interpolation progress.
 * @returns A new transformation object blending between `p1` and `p2`.
 */

export function lerpParams(
  initialState: BaseTransformations,
  finalState: PivotTransformations,
  t: number
): BaseTransformations {
  const { scale: iS, skew: iSk, rotate: iR } = initialState;
  const { scale: fS, skew: fSk, rotate: fR } = finalState;

  const fScale = lerpTuple({ x: iS!.sx, y: iS!.sy }, { x: fS.sx, y: fS.sy }, t);
  const fSkew = lerpTuple(
    { x: iSk!.sx, y: iSk!.sy },
    { x: fSk.sx, y: fSk.sy },
    t
  );
  const fRotate = lerp(iR!.angle, fR.angle, t);

  return {
    scale: { sx: fScale.x, sy: fScale.y },
    skew: { sx: fSkew.x, sy: fSkew.y },
    rotate: { angle: fRotate }
  };
}
