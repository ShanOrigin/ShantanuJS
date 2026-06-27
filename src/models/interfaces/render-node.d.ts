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

export interface IRenderNode<T extends ValidGraphicsShapes>
  extends IGraphicsModel<T> {
  attrs(props: AttrsMethodPropsTypes<T> | string): AttrsMethodReturnTypes;

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

  //animate(...args: any[]): any;

  /*
   * --------------------------------------------------------------------------
   * EVENT CONVENIENCE API
   * --------------------------------------------------------------------------
   */
  /*
  on(...args: any[]): any;

  off(...args: any[]): any;

  once(...args: any[]): any;
*/
  /*
   * --------------------------------------------------------------------------
   * COMPONENT ACCESSORS
   * --------------------------------------------------------------------------
   */
  /*
  transform: {
    transform(...args: any[]): any;

    startBatching(...args: any[]): any;

    endBatching(...args: any[]): any;
  };

  animation: {
    play(...args: any[]): any;

    pause(...args: any[]): any;

    resume(...args: any[]): any;

    stop(...args: any[]): any;
  };

  filter: {
    brightness(...args: any[]): any;

    glow(...args: any[]): any;

    shadow(...args: any[]): any;

    linearGradient(...args: any[]): any;

    radialGradient(...args: any[]): any;
  };

  event: {
    on(...args: any[]): any;

    off(...args: any[]): any;

    once(...args: any[]): any;
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
