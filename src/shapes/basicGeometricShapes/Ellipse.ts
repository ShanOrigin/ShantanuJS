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

import type { ellipsePropsType } from '../../types/shapes';

export class Ellipse extends Shape<'ellipse'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  // #Animations!: SAnimation<'ellipse'>[]; // for timeline support but not implementated yet

  constructor(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    props: ellipsePropsType = {}
  ) {
    super('ellipse', props?.id ?? '');
    try {
      const {
        cx: dcx = 0,
        cy: dcy = 0,
        rx: drxOffset = 0,
        ry: dryOffset = 0,
        ...rest
      } = props;

      'id' in props && delete props.id;
      parameterTypeValidator(
        props,
        GraphicalElementProperties,
        {},
        {},
        'ellipse'
      );

      autoFixGeometry(props, ['rx', 'ry']);

      const safeProps = {
        initial: true,
        cx: cx + +dcx,
        cy: cy + +dcy,
        rx: rx + +drxOffset,
        ry: ry + +dryOffset,
        ...rest
      };

      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'ellipse'
      );

      autoFixGeometry(props, ['rx', 'ry', 'stroke-width']);

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
      'ellipse'
    );
  }
  public clone(
    offsetX: number = 10,
    offsetY: number = 10,
    visibleRadiusX?: number,
    visibleRadiusY?: number
  ): Ellipse {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, cx = 0, cy = 0, rx = 0, ry = 0 } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as StyleForGShapeTag<'ellipse'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Ellipse(
        offsetX + cx,
        offsetY + cy,
        (visibleRadiusX ?? 0) + rx,
        (visibleRadiusY ?? 0) + ry,
        style as ellipsePropsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
        cx: number;
        cy: number;
        rx: number;
        ry: number;
      };

      if (!geo) return;

      const { cx = 0, cy = 0, rx = 0, ry = 0 } = geo;
      const shapeRows = 3;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set([cx, cy, 1, cx + rx, cy, 1, cx, cy + ry, 1], 0);
      // Only recreate views if buffer was reallocated
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [
          new Float32Array(sb.buffer, 0 * 4, 3),
          new Float32Array(sb.buffer, 3 * 4, 3),
          new Float32Array(sb.buffer, 6 * 4, 3)
        ];
      }
      //     renderer.render({ el: this });
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[],
    output: boolean = false
  ): boolean | number[] {
    try {
      assertAccess(accessKey);

      if (!this.#geometry || matrix.length !== 3) return false;
      const [center, right, bottom] = matrix;
      const crx = Math.hypot(
        right![0]! - center![0]!,
        right![1]! - center![1]!
      );
      const cry = Math.hypot(
        bottom![0]! - center![0]!,
        bottom![1]! - center![1]!
      );
      const [rx, ry] = [this.#geometry.rx ?? 0, this.#geometry.ry ?? 0];

      const rValid = Math.abs(rx - crx) < 1e-6 && Math.abs(ry - cry) < 1e-6;

      if (output && rValid) {
        return [crx, cry];
      }

      return rValid;
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

      const [cx, cy] = [temporaryState[0]!, temporaryState[1]!]; // center of ellipse

      const a = Math.hypot(temporaryState[3]! - cx, temporaryState[4]! - cy);

      const b = Math.hypot(temporaryState[6]! - cx, temporaryState[7]! - cy);

      basic &&
        (([this.#geometry.rx, this.#geometry.ry] = [a, b]),
        ([this.#geometry.cx, this.#geometry.cy] = [cx, cy]));
    } catch (e) {
      throw e;
    }
  }
}
