import { RenderNode } from '../../render-node/render-node.js';
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  assertAccess
} from '../../../internal/keys/dev-keys.js';
import {
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../../property-definitions/common/common-properties.js';

import {
  GraphicalElementProperties,
  dimensions
} from '../../../property-definitions/specific/specific-properties.js';
import type {
  InitialProps,
  ConstructorPropsTypes
} from '../../../models/types/common';
import {
  parameterTypeValidator,
  validProps
} from '../../../utils/helpers/helpers.js';

export class Circle extends RenderNode<'circle'> {
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

  constructor(props: ConstructorPropsTypes<'circle'>) {
    super('circle', props?.id ?? '');

    'id' in props && delete props.id;

    parameterTypeValidator(
      props,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      'circle'
    );

    // for initial setup through RenderNode
    (props as ConstructorPropsTypes<'circle'> & InitialProps)['initial'] = true;
    this.attrs(props);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'circle'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Circle {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { cx = 0, cy = 0, r = 0 } = this.#geometry;

      const style = { ...this.#style };
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${++this.#copies}`;
      }

      return new Circle({
        cx: offsetX + cx,
        cy: offsetY + cy,
        r,
        initial: true,
        ...style
      } as ConstructorPropsTypes<'circle'> & InitialProps);
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);

      const geo = this.#geometry as {
        cx: number;
        cy: number;
        r: number;
        buffer: Float32Array;
      };
      if (!geo) return;

      const { cx = 0, cy = 0, r = 0 } = geo;

      // Retrieve expected matrix dimensions for a line
      const [m, n] = dimensions['circle'] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set([cx, cy, 1, cx + r, cy, 1], 0);

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

      const [cx, cy] = [temporaryState[0]!, temporaryState[1]!]; // center if circle
      const [rx, ry] = [temporaryState[3]!, temporaryState[4]!]; // right most point on circle

      this.#geometry.r = Math.hypot(rx - cx, ry - cy);
      [this.#geometry.cx, this.#geometry.cy] = [
        temporaryState[0]!,
        temporaryState[1]!
      ];

      this.#computeBounds(temporaryState);
    } catch (e) {
      throw e;
    }
  }

  #computeBounds(buffer: Float32Array) {
    const geo = this.#geometry as {
      bounds: Float32Array;
      r: number;
    };

    const [cx, cy, _] = buffer;
    // Allocate the buffer once or reallocate only if the size has changed
    if (!geo.bounds || geo.bounds.length !== 4) {
      geo.bounds = new Float32Array(4);
    }

    const r = geo.r;
    geo.bounds[0] = cx - r;
    geo.bounds[1] = cy - r;
    geo.bounds[2] = cx + r;
    geo.bounds[3] = cy + r;
  }
}
