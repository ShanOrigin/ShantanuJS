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
  parameterTypeValidator
} from '../../utils/providers/utils.js';

type propsType = Partial<IGraphicalElementProperties['line']> &
  Partial<StyleForGShapeTag<'line'>>;

export class Line extends Shape<'line', 'line'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  // #Animations!: Animation<'line'>[]; // for timeline support but not implementated yet

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    props: propsType = {}
  ) {
    super('line', props?.id ?? '', 'line');

    parameterTypeValidator(
      props as propsType,
      GraphicalElementProperties,
      {},
      {},
      'line'
    );
    const {
      x1: dx1 = 0,
      y1: dy1 = 0,
      x2: dx2 = 0,
      y2: dy2 = 0,
      ...rest
    } = props as propsType;

    const safeProps = {
      'stroke-linecap': 'square',
      initial: true,
      x1: x1 + +dx1,
      y1: y1 + +dy1,
      x2: x2 + +dx2,
      y2: y2 + +dy2,
      ...rest
    };

    parameterTypeValidator(
      safeProps,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      'line'
    );

    this.attrs(safeProps);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'line'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Line {
    checkParent(this.#fig, 'Rect');

    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as StyleForGShapeTag<'line'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Line(
        offsetX + x1,
        offsetY + y1,
        offsetX + x2,
        offsetY + y2,
        style as propsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
      };

      if (!geo) return;
      const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = geo;
      const shapeRows = 2;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set([x1, y1, 1, x2, y2, 1], 0);

      // Only recreate views if buffer was reallocated
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [
          new Float32Array(sb.buffer, 0 * 4, 3),
          new Float32Array(sb.buffer, 3 * 4, 3)
        ];
      }

      console.log('hi');
      renderer.render({ el: this });
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    m: Float32Array[]
  ): boolean {
    assertAccess(accessKey);
    return isValidMatrix(m, 2, 3);
  }
  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ) {
    assertAccess(accessKey);
    //    const m = this.#geometry?.matrix as Float32Array[];
    //   if (!this.#geometry || !isValidMatrix(m, 2, 3)) return;

    const geo = this.#geometry as {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    [geo.x1, geo.y1] = [temporaryState[0], temporaryState[1]];
    [geo.x2, geo.y2] = [temporaryState[3], temporaryState[4]];
  }
}
