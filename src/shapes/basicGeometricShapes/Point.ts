import { renderer } from '../../core/graphics/providers/graphics.js';
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

import {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../../properties/provider/shapeProperties';

import {
  checkParent,
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/providers/utils.js';

type propsType = Partial<IGraphicalElementProperties['dot']> &
  Partial<StyleForGShapeTag<'dot'>>;

export class Point extends Shape<'dot', 'circle'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  // #Animations!: Animation<'dot'>[]; // for timeline support but not implementated yet
  constructor(cx: number, cy: number, r: number, props: propsType = {}) {
    super('dot', props.id ?? '', 'circle');
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
    checkParent(this.#fig, 'dot');

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
        style as propsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;

      const { cx = 0, cy = 0 } = this.#geometry;
      const shapeRows = 1;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (
        !this.#geometry.sharedBuffer ||
        this.#geometry.sharedBuffer.length !== totalLength
      ) {
        this.#geometry.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = this.#geometry.sharedBuffer as Float32Array;
      sb.set([cx, cy, 1], 0);

      // Only recreate views if buffer was reallocated
      if (!this.#geometry.matrix) {
        this.#geometry.matrix = [new Float32Array(sb.buffer, 0 * 4, 3)];
      }

      renderer.render({ el: this });
      this.restoreDimension(DEV_INTERNAL_ACCESS);
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(accessKey: symbol) {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;
      const m = this.#geometry.matrix as Float32Array[];

      if (!isValidMatrix(m, 1, 3)) return;
      [this.#geometry.cx, this.#geometry.cy] = m[0]; // center if circle
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

  protected override getAttrsAccordingToShape(
    accessKeys: symbol,
    attrs: Record<string, any>
  ): { x: number; y: number; width: number; height: number } {
    assertAccess(accessKeys);

    const {
      cx: ucx,
      cy: ucy,
      r: ur
    } = attrs as { cx: number; cy: number; r: number };
    let nr = 0;
    if (ur > 5) nr = 5;
    if (ur < 1) nr = 1;

    return { x: ucx ?? 0, y: ucy ?? 0, width: nr, height: nr };
  }

  protected override getUpdatedGeometryAccordingToShape(accessKeys: symbol): {
    x: number;
    y: number;
    width?: number;
    height?: number;
  } {
    assertAccess(accessKeys);
    const { cx, cy, r } = this.#geometry as {
      cx: number;
      cy: number;
      r: number;
    };

    return { x: cx, y: cy, width: r, height: r };
  }
}
