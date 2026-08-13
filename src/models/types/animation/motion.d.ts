/**
 * Motion path.
 */
export type MotionPath = string | "linear" | "quadratic" | "cubic" | "arc";

/**
 * Curve motion configuration.
 */
export type CurveMotionOptions = {
  enabled?: boolean;

  path?: MotionPath;

  samples?: number;

  curvature?: number;
};

/**
 * Physics motion configuration.
 */
export type PhysicsOptions = {
  enabled?: boolean;

  speed?: number;
};
