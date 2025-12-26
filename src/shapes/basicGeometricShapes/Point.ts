import {
  Shape,
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../baseShape/Shape.js';
import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

import { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/providers/utils.js';

import { pointPropsType } from '../../types/shapes';

export class Point extends Shape<'dot'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  // #Animations!: Animation<'dot'>[]; // for timeline support but not implementated yet
  constructor(cx: number, cy: number, r: number, props: pointPropsType = {}) {
    super('dot', props.id ?? '');
    try {
      const { cx: dcx = 0, cy: dcy = 0, r: dr = 0, ...rest } = props;

      'id' in props && delete props.id;
      parameterTypeValidator(props, GraphicalElementProperties, {}, {}, 'dot');

      autoFixGeometry(props, ['width', 'height', 'rx', 'ry']);

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
        'dot'
      );

      autoFixGeometry(props, ['cx', 'cy', 'r', 'stroke-width']);

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
      'dot'
    );
  }

  public clone(
    offsetX: number = 10,
    offsetY: number = 10,
    visibleRadius?: number
  ): Point {
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

      const style = { ...this.#style } as StyleForGShapeTag<'dot'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Point(
        offsetX + cx,
        offsetY + cy,
        (visibleRadius ?? 0) + r,
        style as pointPropsType
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
        canonicalMatrix: Float32Array[];
        sharedBuffer: Float32Array;
      };
      if (!geo) return;

      const { cx = 0, cy = 0 } = geo;
      const shapeRows = 1;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set([cx, cy, 1], 0);

      // Only recreate views if buffer was reallocated
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [new Float32Array(sb.buffer, 0 * 4, 3)];
      }

      //     renderer.render({ el: this });
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
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

      // if (!isValidMatrix(m, 1, 3)) return;
      [this.#geometry.cx, this.#geometry.cy] = [
        temporaryState[0],
        temporaryState[1]
      ]; // center if circle
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[]
  ): boolean {
    assertAccess(accessKey);
    if (matrix.length != 3 || isNaN(matrix[0][0]) || isNaN(matrix[0][1]))
      return false;

    return true;
  }
}
