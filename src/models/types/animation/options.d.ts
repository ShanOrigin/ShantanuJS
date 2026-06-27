import type { PivotOptions } from './pivot';
import type { CurveMotionOptions, PhysicsOptions } from './motion';
import type { AnimationControls } from './control';

/**
 * Advanced animation configuration.
 */
export type AdvancedAnimationOptions = {
  physics?: PhysicsOptions;

  curve?: CurveMotionOptions;

  pivots?: PivotOptions;

  controls?: AnimationControls;
};
