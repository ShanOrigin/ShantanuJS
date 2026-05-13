import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import { parameterTypeValidator } from '../../utils/provider/utils.js';

import type { rectStyleTypes, imagePropsType } from '../../types/shapes';

export class Image extends GraphicsEntity<'image'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  // Actual implementation
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    href: string,
    props: imagePropsType = {}
  ) {
    super('image', props?.id ?? ''); // ( shape generics , id , rander generics by default = 'path' )
    try {
      'id' in props && delete props.id;

      const mendatoryProps = {
        x,
        y,
        width,
        height
      };

      const {
        x: dx = 0,
        y: dy = 0,
        width: dw = 0,
        height: dh = 0,

        ...rest
      } = props;

      //   console.log('props ', props);
      const { x: ax, y: ay, width: aw, height: ah } = mendatoryProps;
      const safeProps = {
        initial: true, // sefty check for first time dont check parent available because parent is not available
        x: ax + +dx,
        y: ay + +dy,
        width: aw + +dw,
        height: ah + +dh,
        href,

        ...rest
      };

      parameterTypeValidator(
        props,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        {},
        'image'
      );

      // console.log('safePropsprops ', safeProps);
      this.attrs(safeProps);
    } catch (e) {
      throw e;
    }
  }
  /*
  static #validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'image'
    );
  }
*/
  public clone(
    offsetX: number = 10,
    offsetY: number = 10,
    width?: number,
    height?: number
  ): Image {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const {
        copies = 0,
        x = 0,
        y = 0,
        width: w = 0,
        height: h = 0,
        href = ''
      } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as rectStyleTypes;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Image(
        offsetX + x,
        offsetY + y,
        (width ?? 0) + w,
        (height ?? 0) + h,
        href,
        style as imagePropsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);

      const geo = this.#geometry as {
        x: number;
        y: number;
        width: number;
        height: number;
        buffer: Float32Array;
      };

      if (!geo) return;

      const { x = 0, y = 0, width: w = 0, height: h = 0 } = geo;

      // Retrieve expected matrix dimensions for a line
      const [m, n] = dimensions['image'] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set([x, y, 1, x + w, y, 1, x + w, y + h, 1, x, y + h, 1], 0);

      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
      //     renderer.render({ el: this });
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryStatus: Float32Array,
    basic: boolean = true
  ) {
    try {
      assertAccess(accessKey);

      const geo = this.#geometry as {
        x: number;
        y: number;
        width: number;
        height: number;
        buffer: Float32Array;
      };
      if (!geo) return;

      const base = geo.buffer;

      const m = [
        base.subarray(0, 3),
        base.subarray(3, 6),
        base.subarray(6, 9),
        base.subarray(9, 12)
      ];

      //   if (!isValidMatrix(m, 4, 3)) return;
      const dim = this.#validateShapeMatrix(DEV_INTERNAL_ACCESS, m, true) as [
        number,
        number
      ];
      basic &&
        Array.isArray(dim) &&
        (([geo.width, geo.height] = dim),
        ([geo.x, geo.y] = [
          temporaryStatus[0] as number,
          temporaryStatus[1] as number
        ]));
    } catch (e) {
      throw e;
    }
  }

  #validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[],
    output: boolean = false
  ): boolean | number[] {
    assertAccess(accessKey);
    if (matrix.length !== 4) return false;

    const [A, B, C, D] = matrix as [
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array
    ];

    // --- Utility functions ---
    const dist = ([x1, y1]: Float32Array, [x2, y2]: Float32Array): number =>
      Math.hypot(x2! - x1!, y2! - y1!);

    const dot = ([x1, y1]: Float32Array, [x2, y2]: Float32Array): number =>
      x1! * x2! + y1! * y2!;

    const vec = (
      [x1, y1]: Float32Array,
      [x2, y2]: Float32Array
    ): Float32Array => new Float32Array([x2! - x1!, y2! - y1!]);

    const cross = ([x1, y1]: Float32Array, [x2, y2]: Float32Array) =>
      x1! * y2! - y1! * x2!;

    // --- Compute vectors for sides ---
    const AB = vec(A, B);
    const BC = vec(B, C);
    const CD = vec(C, D);
    const DA = vec(D, A);

    // --- Compute side lengths ---
    const AB_len = dist(A, B);
    const BC_len = dist(B, C);
    const CD_len = dist(C, D);
    const DA_len = dist(D, A);

    // --- Dynamic epsilon (scaled by imageangle size) ---
    const maxSide = Math.max(AB_len, BC_len, CD_len, DA_len);
    const EPS = 1e-6 * (maxSide || 1);

    // --- self-intersecting check ---
    const orientation1 = cross(AB, vec(B, D));
    const orientation2 = cross(BC, vec(C, A));
    if (orientation1 * orientation2 < 0) return false;

    // --- 1) Ensure non-degenerate imageangle ---
    const hasNonZeroSides =
      AB_len > EPS && BC_len > EPS && CD_len > EPS && DA_len > EPS;
    if (!hasNonZeroSides) return false;

    // --- 2) Opposite sides must be equal ---
    const isOppositeEqual =
      Math.abs(AB_len - CD_len) < EPS && Math.abs(BC_len - DA_len) < EPS;
    if (!isOppositeEqual && !output) return false;

    // --- 3) All angles must be 90 degrees ---
    const isPerpendicular =
      Math.abs(dot(AB, BC)) < EPS &&
      Math.abs(dot(BC, CD)) < EPS &&
      Math.abs(dot(CD, DA)) < EPS &&
      Math.abs(dot(DA, AB)) < EPS;

    if (!isPerpendicular && !output) return false;

    // --- Optional: Snap coordinates back to perfect image ---
    if (!output) {
      // Snap opposite sides
      const avgWidth = (AB_len + CD_len) / 2;
      const avgHeight = (BC_len + DA_len) / 2;
      // Recompute positions with snapped lengths
      B.set([
        A[0]! + AB[0]! * (avgWidth / AB_len),
        A[1]! + AB[1]! * (avgWidth / AB_len)
      ]);
      C.set([
        B[0]! + BC[0]! * (avgHeight / BC_len),
        B[1]! + BC[1]! * (avgHeight / BC_len)
      ]);
      D.set([
        C[0]! - AB[0]! * (avgWidth / AB_len),
        C[1]! - AB[1]! * (avgWidth / AB_len)
      ]);
    }

    // --- If we want sizes back (optional) ---
    if (output) return [AB_len, BC_len];

    return true;
  }
}
