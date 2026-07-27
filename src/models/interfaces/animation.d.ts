import type { EasingFunction, EasingType } from "../types/animation/easing";
import type {
  IAnimationOptions,
  UpdateAnimationReturnType,
} from "../types/animation/options";

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
  update(currentTime: number): UpdateAnimationReturnType;

  /**
   * Configures and optionally starts an animation.
   *
   * @param options Animation configuration.
   */
  animate(options: IAnimationOptions): void;
}
