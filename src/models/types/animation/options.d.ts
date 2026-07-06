import type { PivotOptions } from './pivot';
import type { CurveMotionOptions, PhysicsOptions } from './motion';
import type { AnimationControls } from './control';
import type { EasingFunction, EasingType } from './easing';
import type { AnimatableProperties } from './animatable';
import type { ValidGraphicsShapes } from '../graphics-model';

/**
 * Advanced animation configuration.
 */
export type AdvancedAnimationOptions = {
  physics?: PhysicsOptions;

  curve?: CurveMotionOptions;

  pivots?: PivotOptions;

  controls?: AnimationControls;
};

/**
 * Configuration for starting an animation.
 */
export interface IAnimationOptions<
  Shapes extends ValidGraphicsShapes = ValidGraphicsShapes
> {
  /** Target properties to animate. */
  attrs: AnimatableProperties<Shapes>;

  /** Optional advanced animation configuration. */
  advanceOptions?: AdvancedAnimationOptions;

  /** Animation duration in milliseconds. */
  duration: number;

  /** Easing function or predefined easing type. */
  ease?: EasingType | EasingFunction;

  /** Invoked when the animation completes. */
  onComplete?: () => void;

  /** Starts the animation immediately if true. */
  start?: boolean;
}

export type UpdateAnimationReturnType = Record<
  string,
  string | number | Float32Array
> | null;
