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

import { renderer } from '../../core/graphics/providers/graphics.js';

import {
  DEV_INTERNAL_ACCESS,
  assertAccess,
  Shape
} from '../baseShape/Shape.js';
import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

type propsType = Partial<IGraphicalElementProperties['circle']> &
  Partial<StyleForGShapeTag<'circle'>>;

export class Circle extends Shape<'circle', 'circle'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  // #Animations!: Animation<'circle'>[]; // for timeline support but not implementated yet

  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  constructor(cx: number, cy: number, r: number, props: propsType = {}) {
    super('circle', props?.id ?? '', 'circle');
    try {
      const { cx: dcx = 0, cy: dcy = 0, r: dr = 0, ...rest } = props;

      'id' in props && delete props.id;
      parameterTypeValidator(
        props,
        GraphicalElementProperties,
        {},
        {},
        'circle'
      );

      autoFixGeometry(props, ['r']);

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

      autoFixGeometry(props, ['r', 'stroke-width']);

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

      const style = { ...this.#style } as StyleForGShapeTag<'circle'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Circle(
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

      const geo = this.#geometry as {
        cx: number;
        cy: number;
        r: number;
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
      };
      if (!geo) return;

      const { cx = 0, cy = 0, r = 0 } = geo;
      const shapeRows = 2;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set([cx, cy, 1, cx + r, cy, 1], 0);
      // Only recreate views if buffer was reallocated
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [
          new Float32Array(sb.buffer, 0 * 4, 3),
          new Float32Array(sb.buffer, 3 * 4, 3)
        ];
      }
      renderer.render({ el: this });
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

      const r = Math.hypot(right[0] - center[0], right[1] - center[1]);

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
      //    const m = this.#geometry.matrix as Float32Array[];

      //      if (!isValidMatrix(m, 2, 3)) return;
      const [cx, cy] = [temporaryState[0], temporaryState[1]]; // center if circle
      const [rx, ry] = [temporaryState[3], temporaryState[4]]; // right most point on circle

      basic &&
        ((this.#geometry.r = Math.hypot(rx - cx, ry - cy)),
        ([this.#geometry.cx, this.#geometry.cy] = [
          temporaryState[0],
          temporaryState[1]
        ]));
    } catch (e) {
      throw e;
    }
  }
}
