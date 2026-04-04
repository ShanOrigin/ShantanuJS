import {
  dimensions,
  type StyleForGShapeTag
} from '../../properties/provider/shapeProperties.js';

import {
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/provider/utils.js';

import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';
import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

import type { circlePropsType } from '../../types/shapes';

export class Circle extends GraphicsEntity<'circle'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  constructor(cx: number, cy: number, r: number, props: circlePropsType = {}) {
    super('circle', props?.id ?? '');
    try {
      const { cx: dcx = 0, cy: dcy = 0, r: dr = 0, ...rest } = props;

      'id' in props && delete props.id;
      const safeProps = {
        initial: true,
        cx: cx + +dcx,
        cy: cy + +dcy,
        r: r + +dr,
        ...rest
      };

      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'circle'
      );

      this.attrs(safeProps);
    } catch (e) {
      throw e;
    }
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'circle'
    );
  }

  public clone(
    offsetX: number = 10,
    offsetY: number = 10,
    visibleRadius?: number
  ): Circle {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, cx = 0, cy = 0, r = 0 } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as StyleForGShapeTag<'circle'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Circle(
        offsetX + cx,
        offsetY + cy,
        (visibleRadius ?? 0) + r,
        style as circlePropsType
      );
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

      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[],
    output: boolean = false
  ): boolean | number {
    try {
      assertAccess(accessKey);

      if (!this.#geometry || !this.#geometry.r) return false;

      if (matrix.length !== 2) return false;

      const [center, right] = matrix;

      const r = Math.hypot(right![0]! - center![0]!, right![1]! - center![1]!);

      if (output) return r;

      return Math.abs(r - this.#geometry.r) < 1e-6;
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array,
    basic: boolean = true
  ) {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;

      const [cx, cy] = [temporaryState[0]!, temporaryState[1]!]; // center if circle
      const [rx, ry] = [temporaryState[3]!, temporaryState[4]!]; // right most point on circle

      basic &&
        ((this.#geometry.r = Math.hypot(rx - cx, ry - cy)),
        ([this.#geometry.cx, this.#geometry.cy] = [
          temporaryState[0]!,
          temporaryState[1]!
        ]));
    } catch (e) {
      throw e;
    }
  }
}
