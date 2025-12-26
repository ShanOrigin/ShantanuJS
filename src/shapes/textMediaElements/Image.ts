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
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/providers/utils.js';

import type { rectStyleTypes, imagePropsType } from '../../types/shapes';

export class Image extends Shape<'image'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  // Actual implementation
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    href: String,
    props: imagePropsType
  ) {
    super('image', ''); // ( shape generics , id , rander generics by default = 'path' )
    try {
      /*
      const props: rectPropsType = Rect.#getParams(
        arg5,
        arg6,
        arg7
      ) as rectPropsType;

      parameterTypeValidator(
        props,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        {},
        'rect'
      );

      //    console.log('props ', props);

      autoFixGeometry(props, ['width', 'height', 'stroke-width']); // fix if any available and if any of  negative because its not valid

      const mendatoryProps = {
        x,
        y,
        width,
        height
      };

      parameterTypeValidator(
        mendatoryProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'rect'
      );

      autoFixGeometry(mendatoryProps, ['width', 'height']); // fix if any of negative because its not valid

      const {
        x: dx = 0,
        y: dy = 0,
        width: dw = 0,
        height: dh = 0,
        rx: drx = 0,
        ry: dry = 0,
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
        rx: drx,
        ry: dry,
        ...rest
      };

      // console.log('safePropsprops ', safeProps);
      this.attrs(safeProps);

			*/
    } catch (e) {
      throw e;
    }
  }

  static #validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'rect'
    );
  }

  static #getParams(
    arg5: number | rectPropsType | undefined,
    arg6: number | rectPropsType | undefined,
    arg7: rectPropsType | undefined,
    id = false
  ): rectPropsType | string {
    let props: rectPropsType = {} as rectPropsType;

    const rid = (o: object) => {
      if ('id' in o) {
        const sid = (o.id ?? '') as string;
        delete o.id;
        return sid;
      }
      return '';
    };

    const cornerRadius = () => {
      const [rx, ry] = [Math.abs(props.rx ?? 0), Math.abs(props.ry ?? 0)];

      props['rx'] = (rx +
        (typeof arg5 === 'number' ? Math.abs(arg5) : 0)) as number;
      props['ry'] = (ry +
        (typeof arg6 === 'number'
          ? Math.abs(arg6)
          : typeof arg5 === 'number'
          ? Math.abs(arg5)
          : 0)) as number;
    };

    if (typeof arg5 === 'object' && arg5 !== null) {
      // Case 1: Only props

      if (id) return rid(arg5);

      props = arg5;
      cornerRadius();
    } else if (typeof arg6 === 'object' && arg6 !== null) {
      // Case 2: rx and props

      if (id) return rid(arg6);
      props = arg6;

      cornerRadius();
    } else if (typeof arg7 === 'object' && arg7 !== null) {
      // Case 3: rx, ry, props

      if (id) return rid(arg7);
      props = arg7;

      cornerRadius();
    } else {
      // Fallback case
      if (id) return '' as string;
      cornerRadius();
    }

    return props;
  }

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
        height: h = 0
      } = this.#geometry;

      const nextCopies = copies + 1;

      const style = { ...this.#style } as rectStyleTypes;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;
      return new Rect(
        offsetX + x,
        offsetY + y,
        (width ?? 0) + w,
        (height ?? 0) + h,
        style as rectPropsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  protected override getAttrsAccordingToShape(
    accessKey: symbol,
    attrs: Record<string, any>
  ): { x: number; y: number; width: number; height: number } {
    assertAccess(accessKey);

    // if class is Rect then attrs should be only x , y , width , height , rx , ry nothing except this
    const {
      x = 0,
      y = 0,
      width = 0,
      height = 0
    } = attrs as { x: number; y: number; width: number; height: number };

    return { x, y, width, height };
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);

      if (!this.#geometry) return;

      const { x = 0, y = 0, width: w = 0, height: h = 0 } = this.#geometry;
      const shapeRows = 4;
      const bboxRows = 4;
      7;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (
        !this.#geometry.buffer ||
        this.#geometry.buffer.length !== totalLength
      ) {
        this.#geometry.buffer = new Float32Array(totalLength);
      }

      const sb = this.#geometry.buffer as Float32Array;
      sb.set([x, y, 1, x + w, y, 1, x + w, y + h, 1, x, y + h, 1], 0);

      // Only recreate views if buffer was reallocated
      if (!this.#geometry.buffer) {
        /*
				this.#geometry.buffer
          new Float32Array(sb.buffer, 0 * 4, 3),
          new Float32Array(sb.buffer, 3 * 4, 3),
          new Float32Array(sb.buffer, 6 * 4, 3),
          new Float32Array(sb.buffer, 9 * 4, 3)
        ];
				*/
      }

      this.restoreDimension(DEV_INTERNAL_ACCESS);
      //     renderer.render({ el: this });
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[],
    output: boolean = false
  ): boolean | number[] {
    assertAccess(accessKey);
    if (matrix.length !== 4) return false;

    const [A, B, C, D] = matrix;

    // --- Utility functions ---
    const dist = ([x1, y1]: Float32Array, [x2, y2]: Float32Array): number =>
      Math.hypot(x2 - x1, y2 - y1);

    const dot = ([x1, y1]: Float32Array, [x2, y2]: Float32Array): number =>
      x1 * x2 + y1 * y2;

    const vec = (
      [x1, y1]: Float32Array,
      [x2, y2]: Float32Array
    ): Float32Array => new Float32Array([x2 - x1, y2 - y1]);

    const cross = ([x1, y1]: Float32Array, [x2, y2]: Float32Array) =>
      x1 * y2 - y1 * x2;

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

    // --- Dynamic epsilon (scaled by rectangle size) ---
    const maxSide = Math.max(AB_len, BC_len, CD_len, DA_len);
    const EPS = 1e-6 * (maxSide || 1);

    // --- self-intersecting check ---
    const orientation1 = cross(AB, vec(B, D));
    const orientation2 = cross(BC, vec(C, A));
    if (orientation1 * orientation2 < 0) return false;

    // --- 1) Ensure non-degenerate rectangle ---
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

    // --- Optional: Snap coordinates back to perfect rectangle ---
    if (!output) {
      // Snap opposite sides
      const avgWidth = (AB_len + CD_len) / 2;
      const avgHeight = (BC_len + DA_len) / 2;
      // Recompute positions with snapped lengths
      B.set([
        A[0] + AB[0] * (avgWidth / AB_len),
        A[1] + AB[1] * (avgWidth / AB_len)
      ]);
      C.set([
        B[0] + BC[0] * (avgHeight / BC_len),
        B[1] + BC[1] * (avgHeight / BC_len)
      ]);
      D.set([
        C[0] - AB[0] * (avgWidth / AB_len),
        C[1] - AB[1] * (avgWidth / AB_len)
      ]);
    }

    // --- If we want sizes back (optional) ---
    if (output) return [AB_len, BC_len];

    return true;
  }

  protected override restoreDimension(
    accessKey: symbol,
    basic: boolean = true
  ) {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;
      const m = this.#geometry?.matrix as Float32Array[];
      if (!isValidMatrix(m, 4, 3)) return;
      const dim = this.validateShapeMatrix(DEV_INTERNAL_ACCESS, m, true);
      basic &&
        Array.isArray(dim) &&
        (([this.#geometry.width, this.#geometry.height] = dim),
        ([this.#geometry.x, this.#geometry.y] = m[0]));
    } catch (e) {
      throw e;
    }
  }
}
