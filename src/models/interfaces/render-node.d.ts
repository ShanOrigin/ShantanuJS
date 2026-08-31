import {
  TranslateMethodProps,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps,
} from "../types/geometry/transform";

import type {
  AttrsMethodReturnTypes,
  AttrsMethodPropsTypes,
} from "../types/common";

import type {
  ValidGraphicsShapes,
  InternalGeometry,
  PublicGeometry,
  InternalStyle,
  PublicStyle,
} from "../types/graphics-model";
import type { IGraphicsModel } from "./graphics-model";
import type { IAnimationOptions } from "../types/animation/options";
import type { IAnimation } from "./animation";
import type { BboxProps } from "../types/geometry/types";
import { IEvent } from "./event";
import { IFilter } from "./filters";

export interface IRenderNode<
  T extends ValidGraphicsShapes,
> extends IGraphicsModel<T> {
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
    props: IAnimationOptions<T>,
  ): Omit<IAnimation, "animate" | "update">;

  /*
   * --------------------------------------------------------------------------
   * EVENT CONVENIENCE API
   * --------------------------------------------------------------------------
   */

  readonly events: IEvent;

  /*
   * --------------------------------------------------------------------------
   * FILTER CONVENIENCE API
   * --------------------------------------------------------------------------
   */
  readonly filters: IFilter;
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
  T extends ValidGraphicsShapes = ValidGraphicsShapes,
>
  extends IRenderNode<T> {}
