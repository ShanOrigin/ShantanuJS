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
import { IGraphicsModel } from './graphics-model';

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
