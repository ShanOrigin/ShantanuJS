import {
  TranslateMethodProps,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps
} from '../types/affine-transformations';

import type {
  AttrsMethodReturnTypes,
  AttrsMethodPropsTypes
} from '../types/common';

import type {
  ValidGraphicsShapes,
  InternalGeometry,
  PublicGeometry,
  InternalStyle,
  PublicStyle
} from '../types/graphics-model';
import type { IGraphicsModel } from './graphics-model';
import type { ValidGraphicsShapes } from '../types/graphics-model';
import type { IAnimationOptions } from '../types/animation/options';
import type { IAnimation } from './animation';
import type { BboxProps } from '../types/geometry/types';

export interface IRenderNode<T extends ValidGraphicsShapes>
  extends IGraphicsModel<T> {
  attrs(props: AttrsMethodPropsTypes<T> | string): AttrsMethodReturnTypes;

  getBBox(includeStroke?: boolean): BboxProps;
  /*
   * --------------------------------------------------------------------------
   * TRANSFORMATION CONVENIENCE API
   * --------------------------------------------------------------------------
   */

  translate(translateProps: TranslateMethodProps): this;

  rotate(rotateProps: RotateMethodProps): this;

  scale(scaleProps: ScaleMethodProps): this;

  skew(skewProps: SkewMethodProps): this;

  transform(dsl: string): this;

  beginT(): this;
  endT(): this;

  /*
   * --------------------------------------------------------------------------
   * ANIMATION CONVENIENCE API
   * --------------------------------------------------------------------------
   */

  isAnimation(): boolean;
  animate(props: IAnimationOptions<T>): void;
  animation(
    props: IAnimationOptions<T>
  ): Omit<IAnimation, 'animate' | 'update'>;

  /*
   * --------------------------------------------------------------------------
   * EVENT CONVENIENCE API
   * --------------------------------------------------------------------------
   */

  /**
   * Registers an event handler.
   *
   * Multiple handlers may be registered for the same event.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke when the event is dispatched.
   */
  on(event: SupportedEvents, callback: Handler): void;

  /**
   * Removes event handlers associated with an event.
   *
   * If `callback` is provided, only that handler is removed.
   * Otherwise, all handlers registered for the event are removed.
   *
   * @param event The event to unsubscribe from.
   * @param callback Optional handler to remove.
   */
  off(event: SupportedEvents, callback?: Handler): void;

  /**
   * Registers an event handler that is invoked at most once.
   *
   * After the first invocation, the handler is automatically removed.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke once.
   */
  once(event: SupportedEvents, callback: Handler): void;

  /**
   * Returns handler for given event type.
   *
   * IMPORTANT:
   * - Intended ONLY for EventSystem usage
   * - Not part of public contract
   *
   * @param type Event type
   * @returns Handler or undefined
   *
   */

  getEventHandler(type: SupportedEvents): Handler | void;

  /**
   * Checks whether a handler exists for given event type.
   *
   * Useful for fast path skipping in dispatcher.
   */
  hasEventHandler(type?: SupportedEvents): boolean;

  /*
   * --------------------------------------------------------------------------
   * COMPONENT ACCESSORS
   * --------------------------------------------------------------------------
   */
  /*
  filter: {
    brightness(...args: any[]): any;

    glow(...args: any[]): any;

    shadow(...args: any[]): any;

    linearGradient(...args: any[]): any;

    radialGradient(...args: any[]): any;
  };


	*/
}

/**
 * Represents a graphical entity that can participate
 * within the canvas scene graph system.
 *
 * The entity:
 * - Must implement the graphics model contract
 * - May represent any valid graphical shape specialization
 * - Can be attached to structural containers such as canvas/group
 */
export interface GraphicsRenderNode<
  T extends ValidGraphicsShapes = ValidGraphicsShapes
> extends IGraphicsModel<T>,
    IRenderNode<T> {}
