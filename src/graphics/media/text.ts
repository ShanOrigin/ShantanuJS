import { RenderNode } from '../render-node/render-node.js';
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  assertAccess
} from '../../internal/keys/dev-keys.js';
import {
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../property-definitions/common/common-properties.js';

import {
  GraphicalElementProperties,
  dimensions
} from '../../property-definitions/specific/specific-properties.js';
import type {
  InitialProps,
  ConstructorPropsTypes
} from '../../models/types/common';

import {
  Log,
  parameterTypeValidator,
  validProps
} from '../../utils/helpers/helpers.js';

export class Text extends RenderNode<'text'> {
  #copies: number = 0;
  /**
   * Reference to the base class’s internal geometry object.
   *
   * This is a direct reference, not a copy. Any mutation performed through this
   * field will affect the original geometry maintained by the parent/base class.
   * Intended strictly for internal use with privileged access.
   *
   * @private
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Reference to the base class’s internal style object.
   *
   * This field points to the original style state owned by the parent/base class.
   * Mutations propagate immediately to the source style and influence rendering
   * or appearance wherever that style is consumed.
   *
   * @private
   */
  #style = this[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Reference to the parent class’s internal private properties container.
   *
   * Provides privileged access to selected private state of the parent class.
   * This is used to coordinate behavior across inheritance boundaries without
   * duplicating or re-owning state.
   *
   * @private
   */
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS_KEY);

  constructor(props: ConstructorPropsTypes<'text'>) {
    super('text', props.id ?? '');

    parameterTypeValidator(
      props,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      'text'
    );

    // for initial setup through RenderNode
    (props as ConstructorPropsTypes<'text'> & InitialProps)['initial'] = true;
    this.attrs(props);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'text'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Text {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { x = 0, y = 0, text = '' } = this.#geometry;

      const style = { ...this.#style };
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${++this.#copies}`;
      }

      return new Text({
        x: offsetX + x,
        y: offsetY + y,
        text,
        initial: true,
        ...style
      } as ConstructorPropsTypes<'text'> & InitialProps);
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        buffer: Float32Array;

        x: number;
        y: number;
      };
      if (!geo) return;

      const { x = 0, y = 0 } = geo;

      const [m, n] = dimensions['text']!;
      const totalLength = m * n;

      // Allocate once and reuse to minimize GC pressure
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set([x, y, 1], 0);

      this.restoreDimension(DEV_INTERNAL_ACCESS_KEY, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ) {
    try {
      assertAccess(accessKey);

      if (!this.#geometry) return;

      [this.#geometry.x, this.#geometry.y] = [
        temporaryState[0]!,
        temporaryState[1]!
      ]; // center if circle
    } catch (e) {
      throw e;
    }
  }
}
