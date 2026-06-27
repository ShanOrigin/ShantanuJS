import { EasingFunction, EasingType } from '../types/animation';

/**
 * Configuration for starting an animation.
 */
export interface IAnimationOptions {
  /** Target properties to animate. */
  attrs: AnimatableProps;

  /** Optional advanced animation configuration. */
  advanceProps?: AdvanceProps;

  /** Animation duration in milliseconds. */
  duration: number;

  /** Easing function or predefined easing type. */
  ease?: EasingType | EasingFunction;

  /** Invoked when the animation completes. */
  onComplete?: () => void;

  /** Starts the animation immediately if true. */
  start?: boolean;
}

/**
 * Common animation controller interface.
 */
export interface IAnimation {
  /** Returns whether the animation is currently running. */
  isRunning(): boolean;

  /** Returns whether the animation is currently paused. */
  isPaused(): boolean;

  /** Starts the animation. */
  start(): void;

  /** Pauses the animation. */
  pause(): void;

  /** Resumes a paused animation. */
  resume(): void;

  /** Cancels the animation and releases its resources. */
  cancelAnimation(): void;

  /**
   * Updates the animation state.
   *
   * @param currentTime Current timestamp in milliseconds.
   */
  update(currentTime: number): void;

  /**
   * Configures and optionally starts an animation.
   *
   * @param options Animation configuration.
   */
  animate(options: IAnimationOptions): void;
}
