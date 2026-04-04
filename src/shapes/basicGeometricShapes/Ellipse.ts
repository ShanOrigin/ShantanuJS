import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import type { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/provider/utils.js';

import type { ellipsePropsType } from '../../types/shapes';

export class Ellipse extends GraphicsEntity<'ellipse'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  constructor(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    props: ellipsePropsType = {}
  ) {
    super('ellipse', props?.id ?? '');
    try {
      'id' in props && delete props.id;
      const {
        cx: dcx = 0,
        cy: dcy = 0,
        rx: drxOffset = 0,
        ry: dryOffset = 0,
        ...rest
      } = props;

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
        buffer: Float32Array;

        cx: number;
        cy: number;
        rx: number;
        ry: number;
      };

      if (!geo) return;

      const { cx = 0, cy = 0, rx = 0, ry = 0 } = geo;

      // Retrieve expected matrix dimensions for a line
      const [m, n] = dimensions['ellipse'] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set([cx, cy, 1, cx + rx, cy, 1, cx, cy + ry, 1], 0);

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
