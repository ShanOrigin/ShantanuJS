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

import { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  validProps,
  parameterTypeValidator
} from '../../utils/provider/utils.js';

import { textPropsType } from '../../types/shapes';

export class Text extends GraphicsEntity<'text'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  //#Animations!: Animation<'text'>[]; // for timeline support but not implementated yet
  constructor(x: number, y: number, text: string, props: textPropsType = {}) {
    super('text', props.id ?? '');
    try {
      const { x: dx = 0, y: dy = 0, ...rest } = props;

      'id' in props && delete props.id;
      parameterTypeValidator(props, GraphicalElementProperties, {}, {}, 'text');

      // autoFixGeometry(props, ['width', 'height', 'rx', 'ry']);

      const safeProps = {
        initial: true,
        x: x + +dx,
        y: y + +dy,
        text,
        ...rest
      };

      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'text'
      );

      // autoFixGeometry(props, ['x', 'y', 'r', 'stroke-width']);

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
      const { copies = 0, x = 0, y = 0, text = '' } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as StyleForGShapeTag<'text'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Text(offsetX + x, offsetY + y, text, style as textPropsType);
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
        x: number;
        y: number;
      };
      if (!geo) return;

      const { x = 0, y = 0 } = geo;
      const shapeRows = 1;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set([x, y, 1], 0);

      // Only recreate views if buffer was reallocated
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [new Float32Array(sb.buffer, 0 * 4, 3)];
      }

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

      [this.#geometry.x, this.#geometry.y] = [
        temporaryState[0]!,
        temporaryState[1]!
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
    if (matrix.length != 3 || isNaN(matrix[0]![0]!) || isNaN(matrix[0]![1]!))
      return false;

    return true;
  }
}
