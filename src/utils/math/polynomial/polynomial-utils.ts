// --- Cubic helper ---
export interface CubicPoly {
  a0: number;
  a1: number;
  a2: number;
  a3: number;
}

/**
 * Creates a cubic polynomial for smooth interpolation between two numeric values.
 *
 * Purpose:
 * - Generates a cubic polynomial defined by start and end values, optionally with start and end velocities.
 * - Useful for smooth animations or transitions where gradual acceleration/deceleration is needed.
 *
 * Dependency:
 * - Pure JavaScript; does not depend on any graphics or DOM API.
 *
 * @param start - The starting value of the cubic interpolation.
 * @param end - The ending value of the cubic interpolation.
 * @param startVel - Optional starting velocity (default 0).
 * @param endVel - Optional ending velocity (default 0).
 *
 * @returns An object `{ a0, a1, a2, a3 }` representing the cubic polynomial coefficients.
 */

export function makeCubic(
  start: number,
  end: number,
  startVel = 0,
  endVel = 0
): CubicPoly {
  const a0 = start;
  const a1 = startVel;
  const a2 = 3 * (end - start) - 2 * startVel - endVel;
  const a3 = -2 * (end - start) + startVel + endVel;
  return { a0, a1, a2, a3 };
}

/**
 * Evaluates a cubic polynomial at a specific normalized time.
 *
 * Purpose:
 * - Computes the interpolated value at `t` using the cubic polynomial coefficients.
 * - Typically used for smooth animations, easing, or frame-by-frame interpolation.
 *
 * Dependency:
 * - Pure JavaScript; does not depend on graphics, DOM, or external APIs.
 *
 * @param poly - Cubic polynomial coefficients `{ a0, a1, a2, a3 }`.
 * @param t - Normalized progress (0 to 1) along the cubic interpolation.
 *
 * @returns The interpolated numeric value at the given `t`.
 */

export function evalCubic(poly: CubicPoly, t: number) {
  const t2 = t * t,
    t3 = t2 * t;
  return poly.a0 + poly.a1 * t + poly.a2 * t2 + poly.a3 * t3;
}
