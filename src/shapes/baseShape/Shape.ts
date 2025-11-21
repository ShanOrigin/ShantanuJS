import {
  GraphicalElementComposer,
  renderer
} from '../../core/graphics/providers/graphics.js';

import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import {
  // utils helpers functions
  checkParent,
  parameterTypeValidator,
  animationChecks,
  computeBBox,
  getTransformationMatrix,
  assignBBoxMatrix,
  trackTransformation,
  cwarn
} from '../../utils/providers/utils.js';

import { Animation } from '../../utils/providers/utils.js';
import { Filter } from '../../utils/providers/utils.js';
import { InheritTransformationClassByMinix } from '../../utils/providers/utils.js';

import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/internals/accessKeys.js';

export { DEV_INTERNAL_ACCESS, assertAccess };
// ------ Type Imports ------

import type { animatableProps } from '../../utils/animations/animation.js';
import type { attrsMethodReturnTypes, transformStack } from '../../types/index';
import type {
  IadvanceProps,
  EasingType,
  EasingFunction
} from '../../types/animation';
import type {
  TranslateMethodProps,
  ScaleMethodProps,
  RotateMethodProps,
  SkewMethodProps,
  FlipMethodProps
} from '../../types/transformations';
import type { shapesPropsType, lineGeoTypes } from '../../types/shapes';

import {
  boxShadowProps,
  innerShadowProps,
  colorMatrixProps,
  displacementEffectProps,
  lightEffectProps,
  linearGradientProps,
  radialGradientProps,
  neuMorphProps,
  glassMorphProps,
  SVGFiltersParams
} from '../../types/filters';

import type { IGraphicalElementProperties as IG } from '../../properties/provider/shapeProperties';
import type { GShpesTages } from '../../core/graphics/graphics/graphicalElement';
import { CMATH } from '../../webAsm/interface/TS/CMATH_Interface.js';

const combinationOfSVGAndTransformationsClasses =
  InheritTransformationClassByMinix(GraphicalElementComposer);

export abstract class Shape<
  T extends GShpesTages,
  S extends GShpesTages
> extends combinationOfSVGAndTransformationsClasses<T, S> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  // #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  // #deferedTaskes : Function[]  = [];

  //#Animations!: Animation<T>[]; // for timeline support but not implementated yet
  #isAnimations: boolean = false; // animation control to avoid multiple animation do not run at same time

  #classProp: {
    selectable: boolean;
    hasCanvasSelectable: boolean;
  } = {
    selectable: false,
    hasCanvasSelectable: false
  }; // future use

  // Actual implementation
  constructor(shape: T, id: string, tagname: S) {
    super(shape, id, tagname); // ( shape generics , id , rander generics by default = 'path' )
  }

  protected getClassProps(accessKey: symbol) {
    assertAccess(DEV_INTERNAL_ACCESS);

    return this.#classProp;
  }
  //++++++++++++++++++++++++++++++ Child Class Going to Override this below methods  ++++±+++++++++++++++++++++++++++++

  // In this function the code of matrix generation for that particular shape should be implementated.
  // According to the how are generating that shape matrix
  protected abstract generateMatrix(accessKeys: symbol): void;

  // in this function the code of restore dimensions according to the particular shape should be implemented.
  // Restore dimension code should be according to the shape
  protected abstract restoreDimension(
    accessKeys: symbol,
    temporaryState: Float32Array,
    basic?: boolean
  ): void;

  // In this function the the validation code of that particular shape matrix should be implementated on which this method is going to be  override.
  // According to the implementation of shape Matrix in that class

  // Example - Rect class  should validate rect matrix
  // Example - Ellipe class should validate Ellipse matrix
  protected abstract validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[],
    outputn?: boolean
  ): boolean | number[] | number;

  //++++++++++++++++++++++++++++++++++±+++++++++++++++++++++++++++++

  #flattenTransforms() {
    const composedMatrix = this.getCMatrix(DEV_INTERNAL_ACCESS)() as DOMMatrix;

    const { a, b, m31, c, d, m32, e, f } = composedMatrix;

    // column major because shape matrix is row major and for clearity

    const transformMatrix = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

    const updatedBuffer = this.getMProduct(
      DEV_INTERNAL_ACCESS,
      composedMatrix
    )() as Float32Array;

    this.#restore({
      transformMatrix,
      temporaryState: updatedBuffer,
      isEffect: true,
      isVEffect: false
    });

    this.generateMatrix(DEV_INTERNAL_ACCESS);

    /*
      renderer.render({ el: this });

      //    'obbox' in geo && delete geo.obbox;

      assignBBoxMatrix(this.#geometry, () => super.getBBox(), 'obbox');
      // setting '' to transform attribute of svg
      this.attrs({ transform: '' });
      // clearing all transformations stack history
      geo.transforStack.stack.length = 1;
      // assinging identity matrix to composed or cumulative  matrix

      (geo.transforStack.stack[0].transformMatrix as Float32Array).set(
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        0
      );

*/
  }

  public attrs(
    props: shapesPropsType | string,
    mode: string = 'absolute'
  ): attrsMethodReturnTypes {
    try {
      const shape = this.#geometry?.shape;
      if (!shape || shape == '') {
        throw new Error('Shape is not difined');
      }

      if (typeof props === 'object') {
        if ('initial' in props && props.initial) {
          delete props.initial;
          super.attrs(props);
          this.generateMatrix(DEV_INTERNAL_ACCESS);
        } else {
          checkParent(this.#fig, shape);

          parameterTypeValidator(
            props,
            GraphicalElementProperties,
            AllGShapeStyleProperties,
            this.#classProp,
            shape
          );

          //ToDo : autoFixGeometry according to shape
          //autoFixGeometry(props, ['rx', 'ry', 'stroke-width']);

          const elementProps = GraphicalElementProperties[shape as keyof IG];
          const styleProps =
            AllGShapeStyleProperties[
              shape as keyof typeof AllGShapeStyleProperties
            ];

          // g for storing Geometry specific properties
          const g: Record<string, number | undefined> = {};
          // s for storing Style specific properties
          const s: Record<string, string | number | undefined> = {};

          for (const key in props) {
            if (key in elementProps) {
              const k = key as keyof typeof elementProps;

              g[k] = props[k]; // TS now knows k is valid
            } else if (key in styleProps) {
              const k = key as keyof typeof styleProps;
              s[k] = props[k]; // TS now knows k is valid
            }
          }
          if (shape === 'rect') {
            'rx' in g && ((s['rx'] = g['rx']), delete g['rx']);
            'ry' in g && ((s['ry'] = g['ry']), delete g['ry']);
          }

          // applying style properties only
          super.attrs(s);

          // applying geometric perperties with respect to shape if any property available

          // Object.keys(g).length > 0 && this.#applyTransformsByAttrs(g, mode);
          Object.keys(g).length > 0 && this.#flattenTransforms();
          super.attrs(g);
        }
      } else if (typeof props === 'string') {
        let result = super.attrs(props);
        if (result != null) {
          return result;
        }
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }

  public setSMatrix(m: number[][], rollback: boolean = false): void {
    try {
      if (this.#isAnimations) {
        cwarn('Animation is Going on So can not set matrix seperataly...!');
        return;
      }

      cwarn(
        'setSMatrix: All previous transformations are cleared , becarefull , you might loose all privouse dara of shape.'
      );

      const geo = this.#geometry as {
        transforStack: transformStack;
        canonicalMatrix: Float32Array[];
        sharedBuffer: Float32Array;
        shape: string;
        obbox: Float32Array[];
      };

      if (!geo) {
        throw new Error('Geometry not initialized');
      }
      const shape = geo.shape as keyof typeof dimensions;

      const [rowSize, columnSize] = dimensions[shape];

      checkParent(this.#fig, shape);

      const sb = geo.sharedBuffer as Float32Array;
      const prev = new Float32Array(sb.slice(0, columnSize * rowSize)); // backup

      for (let i = 0; i < rowSize; i++) {
        for (let j = 0; j < columnSize; j++) {
          sb[i * columnSize + j] = m[i]?.[j] ?? 1;
        }
      }

      const matrix = geo.canonicalMatrix as Float32Array[];

      if (
        !Array.isArray(matrix) ||
        !this.validateShapeMatrix(DEV_INTERNAL_ACCESS, matrix)
      ) {
        if (rollback) {
          sb.set(prev, 0); // rollback
        } else {
          throw new Error(
            'given Matrix for Rectangle is invalid maybe it is not actually the shape which you want to give'
          );
        }
      }

      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
      renderer.render({ el: this });

      //    'obbox' in geo && delete geo.obbox;

      assignBBoxMatrix(this.#geometry, () => super.getBBox(), 'obbox');
      // setting '' to transform attribute of svg
      this.attrs({ transform: '' });
      // clearing all transformations stack history
      geo.transforStack.stack.length = 1;
      // assinging identity matrix to composed or cumulative  matrix

      (geo.transforStack.stack[0].transformMatrix as Float32Array).set(
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        0
      );
    } catch (e) {
      throw e;
    }
  }
  // returning a transformation Matrix applied by user

  public getTMatrix(
    which: string | number = 0,
    major: 'r' | 'c' = 'r'
  ): number[][] {
    return getTransformationMatrix(
      (this.#geometry as { transforStack: transformStack }).transforStack.stack,
      which,
      major
    ) as number[][];
  }

  #restore({
    transformMatrix,
    temporaryState,
    isEffect,
    isVEffect = true
  }: {
    transformMatrix: Float32Array;
    temporaryState: Float32Array;
    isEffect: boolean;
    isVEffect: boolean;
  }) {
    isEffect && this.restoreDimension(DEV_INTERNAL_ACCESS, temporaryState);

    //cwarn('in restore ', isVEffect);
    isVEffect &&
      renderer.render({
        el: this,
        finalMatrix: transformMatrix,
        isEffect: isVEffect
      });
  }

  /*
  public gettBBox() {
    return computeBBox(this.#geometry, () => super.getBBox());
  }
	*/

  public getBBox() {
    const geo = this.#geometry as { obbox: Float32Array[] };

    !geo?.obbox && assignBBoxMatrix(geo, () => super.getBBox(), 'obbox');

    const matrix = geo?.obbox as Float32Array[];

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (let i = 0; i < matrix.length; i++) {
      const [x, y] = matrix[i] as Float32Array;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const [cx, cy] = [minX + width / 2, minY + height / 2];
    // Create the 4 corner points in canvas order (top-left, top-right, bottom-right, bottom-left)
    const bboxMatrix = [
      new Float32Array([minX, minY, 1]), // top-left
      new Float32Array([maxX, minY, 1]), // top-right
      new Float32Array([maxX, maxY, 1]), // bottom-right
      new Float32Array([minX, maxY, 1]) // bottom-left
    ];
    return {
      x: minX,
      y: minY,
      width,
      height,
      cx,
      cy,
      matrix: bboxMatrix
    };
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Transformations Section
  //++++++++++++++++++++++++++++++++++++++++++++
  #preChecks(mode: string, px: number, py: number) {
    checkParent(this.#fig, 'Rect');
    //  this.#geometry && !this.#geometry.Obbox && this.getBBox();

    if ((mode == 'p' || mode == 'pivot') && px == 0 && py == 0) {
      cwarn(
        "pivot px , py both are zero so effect is same as relative transformation even if type is 'pivot' or 'p' , falling to 'relative' type to save computations."
      );
      mode = 'r';
    }
    return mode;
  }

  public override Translate({
    x,
    y,
    type = 'a',
    px = 0,
    py = 0
  }: TranslateMethodProps): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      type = this.#preChecks(type, px, py);

      super.Translate({
        x,
        y,
        type,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override Scale({
    sx = 1,
    sy = 1,
    type = 'a',
    px = 0,
    py = 0
  }: ScaleMethodProps): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }

      type = this.#preChecks(type, px, py);
      super.Scale({
        sx,
        sy,
        type,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override Rotate({
    angle,
    type = 'a',
    px = 0,
    py = 0
  }: RotateMethodProps): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }

      type = this.#preChecks(type, px, py);

      super.Rotate({
        angle,
        type,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }
  public override Skew({
    sx,
    sy,
    type = 'a',
    px = 0,
    py = 0
  }: SkewMethodProps): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      type = this.#preChecks(type, px, py);

      super.Skew({
        sx,
        sy,
        type,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }
  public override Flip({
    flipX,
    flipY,
    dirX = 'x+',
    dirY = 'y+'
  }: FlipMethodProps): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      this.#preChecks('', 1, 1);

      super.Flip({
        flipX,
        flipY,
        dirX,
        dirY,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override transform(input: string): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      this.#preChecks('', 1, 1);
      super.transform(input, [this.#restore.bind(this)]);
      return this;
    } catch (e) {
      throw e;
    }
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Animation Section
  //++++++++++++++++++++++++++++++++++++++++++++

  #isAnimationsGoingOn(arg: boolean): boolean | undefined {
    if (!arg) return this.#isAnimations;
    this.#isAnimations = !this.#isAnimations;
  }

  public animate(
    attrs: animatableProps & IG['rect'],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): void | Promise<void> {
    this.#preChecks('', 1, 1);
    animationChecks(attrs, avdProp, duration, ease, onComplete);

    const animation = new Animation<'rect'>(
      this,
      this.#isAnimationsGoingOn.bind(this),
      function () {}
    );
    return animation.animate(attrs, avdProp, duration, ease, onComplete, true);
  }

  public animatia(
    attrs: animatableProps & IG['rect'],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): {
    start: () => void | Promise<void>;
    pause: () => void;
    resume: () => Promise<void>;
    isPaused: () => boolean;
    isRunning: () => boolean;
  } {
    this.#preChecks('', 1, 1);
    animationChecks(attrs, avdProp, duration, ease, onComplete);
    const animation = new Animation<'rect'>(
      this,
      this.#isAnimationsGoingOn.bind(this),
      function () {}
    );
    animation.animate(attrs, avdProp, duration, ease, onComplete, false);

    return {
      start: animation.start.bind(animation),
      pause: animation.pause.bind(animation),
      resume: animation.resume.bind(animation),
      isPaused: animation.isPaused.bind(animation),
      isRunning: animation.isRunning.bind(animation)
    };
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Filter Section
  //++++++++++++++++++++++++++++++++++++++++++++
  public boxShadow(props: boxShadowProps) {
    new Filter().boxShadow(this.#fig, props);
  }

  public innerShadow(props: innerShadowProps) {
    new Filter().innerShadow(this.#fig, props);
  }

  public blur(blur: number) {
    new Filter().blur(this.#fig, blur);
  }

  public glow(bright: number) {
    new Filter().glow(this.#fig, bright);
  }

  public linearGradient(
    props: linearGradientProps = { direction: 'LR', stops: [] }
  ) {
    new Filter().linearGradient(this.#fig, props);
  }

  public radialGradient(
    props: radialGradientProps = {
      direction: 'CENTER',
      stops: []
    }
  ) {
    new Filter().radialGradient(this.#fig, props);
  }

  public lightEffect(
    props: lightEffectProps = {
      lightingColor: 'red',
      surfaceScale: 1,
      intensityOfLight: 1,
      horizontalAngleOfLight: 45,
      verticalAngleOfLight: 45
    }
  ) {
    new Filter().lightEffect(this.#fig, props);
  }

  public displacementEffect(
    props: displacementEffectProps = {
      patternStyle: 'turbulence',
      waveFrequency: 0.6,
      detailLevel: 3,
      distortionAmount: 5,
      distortDirectionX: 'B',
      distortDirectionY: 'G'
    }
  ) {
    new Filter().displacementEffect(this.#fig, props);
  }

  public colorMatrixTransformation(
    props: colorMatrixProps = {
      type: 'saturate',
      values: 1,
      inSource: 'SourceGraphic'
    }
  ) {
    new Filter().colorMatrixTransformation(this.#fig, props);
  }

  public neuMorph(
    props: neuMorphProps = {
      backgroundColor: '#e6eef6',
      outerShadowColor: '#b8c9db',
      highlightColor: '#ffffff',
      innerShadowColor: '#000000',

      outerBlur: 10,
      outerOffsetX: 8,
      outerOffsetY: 8,
      outerShadowOpacity: 0.85,

      highlightBlur: 6,
      highlightOffsetX: -6,
      highlightOffsetY: -6,
      highlightOpacity: 0.9,

      innerBlur: 6,
      innerOffsetX: 4,
      innerOffsetY: 4,
      innerShadowOpacity: 0.12
    }
  ) {
    new Filter().neuMorph(this.#fig, props);
  }

  public glassMorph(
    props: glassMorphProps = {
      blurAmount: 10,
      frostOpacity: 0.05,
      edgeBlur: 1.2,
      edgeHighlightOpacity: 0.35
    }
  ) {
    new Filter().glassMorph(this.#fig, props);
  }
}

/*
 * // +++++++++++! Do not delete below code i  future we will going to use it +++++++++++
 *  #setEqa() {
    try {
      if (!this.#geometry) return;
      const m = this.#geometry.matrix as Float32Array[]; // assume length >= 2
      let str = '';

      for (let i = 0; i < m.length; i++) {
        const [x1, y1] = m[i] as Float32Array;
        const [x2, y2] = m[(i + 1) % m.length] as Float32Array; // wraps to 0
        str += linearEquation([x1, y1], [x2, y2]) + ' | ';
      }

      return str.slice(0, -3); // remove trailing " | "
    } catch (e) {
      throw e;
    }
  }

  #area() {
    try {
      let area = 0;
      if (!this.#geometry || !this.#geometry.matrix) return;
      const m = this.#geometry?.matrix as Float32Array[];

      if (isValidMatrix(m, 4, 3)) {
        area =
          triangleAreaByShoelaceFormula([
            this.#geometry.matrix[0] as Float32Array,
            this.#geometry.matrix[1] as Float32Array,
            this.#geometry.matrix[2] as Float32Array
          ]) +
          triangleAreaByShoelaceFormula([
            this.#geometry.matrix[0] as Float32Array,
            this.#geometry.matrix[3] as Float32Array,
            this.#geometry.matrix[2] as Float32Array
          ]);
      }
      return area;
    } catch (e) {
      throw e;
    }
  }

  #getData(): Float32Array {
    return new Float32Array([
      this.#geometry?.rx || this.#geometry?.ry ? 5 : 4,
      4,
      this.#geometry?.rx ?? 0,
      this.#geometry?.ry ?? 0
    ]);
  }


 *
 *
 *  //++++++++++++++++++++++++++±++++++++

  public override perspective({
    g,
    h,
    type = 'r',
    px = 0,
    py = 0,
    isEffect = true
  }: {
    g: number;
    h: number;
    type?: string;
    px?: number;
    py?: number;
    isEffect?: boolean;
  }): this {
    super.perspective({
      g,
      h,
      type,
      px,
      py,
      isEffect,
      callbacks: this.#restore.bind(this)
    });

    return this;
  }
 *
 *
 *
 *  public getTMatrix(
    which: string | number = 0,
    major: 'r' | 'c' = 'r'
  ): number[][] {
    const TMat = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];

    try {
      const tList = this.#geometry?.TList;
      if (!Array.isArray(tList) || tList.length === 0) {
        //cwarn('No transformations applied yet.');
        return TMat;
      }

      let index = typeof which === 'number' ? which : 0;
      if (index === -1) index = tList.length - 1;
      if (index < 0 || index >= tList.length) {
        //cwarn(`Invalid transformation index: ${index}`);
        return TMat;
      }

      const tmat = tList[index]?.TMatrix;
      if (!(tmat instanceof Float32Array) || tmat.length < 9) {
        //cwarn('Invalid transformation matrix.');
        return TMat;
      }

      const [a, b, g, c, d, h, e, f, i] = tmat;

      if (major === 'r') {
        // Row-major: [ [a c e], [b d f], [g h i] ]
        TMat[0] = [a, c, e];
        TMat[1] = [b, d, f];
        TMat[2] = [g, h, i];
      } else {
        // Column-major: [ [a b g], [c d h], [e f i] ]
        TMat[0] = [a, b, g];
        TMat[1] = [c, d, h];
        TMat[2] = [e, f, i];
      }

      return TMat;
    } catch (e) {
      //cerror('getTMatrix() failed:', e);
      return TMat;
    }
  }

  #restore({
    tmat,
    transformation,
    type,
    isEffect,
    isVEffect = true,
    isProjections = true,
    track = true
  }: {
    tmat: DOMMatrix;
    transformation: string;
    type: string;
    isEffect: boolean;
    isVEffect: boolean;
    isProjections: boolean;
    track: boolean;
  }) {
    const TM = new Float32Array([
      tmat.a,
      tmat.b,
      0,
      tmat.c,
      tmat.d,
      0,
      tmat.e,
      tmat.f,
      1
    ]); // column major because shape matrix is row major and for clearity

    track &&
      this.#geometry &&
      trackTransformation(this.#geometry, transformation, type, TM);
    isEffect && this.#restoreDimension();
    isVEffect &&
      randerer.rander({
        el: this,
        T: tmat,
        isEffect: isVEffect,
        isProjections
      });
  }

  public getBBox() {
    if (!this.#geometry?.Obbox) {
      //console.log('Rect getBBox');
      const g = () => super.getBBox();
      assignBBoxMatrix(this.#geometry, g, 'Obbox');
    }
    const matrix = this.#geometry?.Obbox as Float32Array[];
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (let i = 0; i < matrix.length; i++) {
      const [x, y] = matrix[i] as Float32Array;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const [cx, cy] = [minX + width / 2, minY + height / 2];
    // Create the 4 corner points in canvas order (top-left, top-right, bottom-right, bottom-left)
    const bboxMatrix = [
      new Float32Array([minX, minY, 1]), // top-left
      new Float32Array([maxX, minY, 1]), // top-right
      new Float32Array([maxX, maxY, 1]), // bottom-right
      new Float32Array([minX, maxY, 1]) // bottom-left
    ];
    return {
      x: minX,
      y: minY,
      width,
      height,
      cx,
      cy,
      matrix: bboxMatrix
    };
  }



 *
 *
 */

/*
function getSuperMethod(obj: any, methodName: string): Function {
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    if (proto.hasOwnProperty(methodName)) {
      const parentProto = Object.getPrototypeOf(proto);
      if (parentProto && typeof parentProto[methodName] === "function") {
        return parentProto[methodName];
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  throw new Error(`Parent method ${methodName} not found`);
}

const parentTranslate = getSuperMethod(Shape, "Translate");
parentTranslate.call(Shape, { x: 20, y: 30 });



function getSuperMethods(obj: any, methodNames: string[]): Record<string, Function> {
  const result: Record<string, Function> = {};

  for (const methodName of methodNames) {
    let proto = Object.getPrototypeOf(obj);
    while (proto) {
      if (proto.hasOwnProperty(methodName)) {
        const parentProto = Object.getPrototypeOf(proto);
        if (parentProto && typeof parentProto[methodName] === "function") {
          result[methodName] = parentProto[methodName].bind(obj);
          break;
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    if (!result[methodName]) {
      throw new Error(`Parent method ${methodName} not found`);
    }
  }

  return result;
}

// Usage
const superMethods = getSuperMethods(Shape, ["Translate", "Rotate", "Scale"]);

// Call parent methods directly
superMethods.Translate({ x: 100, y: 50 });
superMethods.Rotate({ angle: 45 });


const RAW_KEY = "system_access_key";
const SYSTEM_KEY_BASE64 = Buffer.from(RAW_KEY).toString("base64");

class Child extends Base {
  #restore() {
    //console.log("Restore called!");
  }

  getPrivateMethod(methodName: string, keyBase64: string): Function | undefined {
    const decoded = Buffer.from(keyBase64, "base64").toString("utf-8");
    if (decoded !== RAW_KEY) throw new Error("Unauthorized access");
    if (methodName === "restore") {
      return this.#restore.bind(this);
    }
    throw new Error("Method not found");
  }
}

// Usage
const obj = new Child();
const restoreMethod = obj.getPrivateMethod("restore", SYSTEM_KEY_BASE64);
restoreMethod?.(); // Works


*/
