import { parameterTypeValidator } from '../helpers/helpers.js';

import {
  propTypes,
  resetMatrix,
  typeCheck
} from './preBuilds/helpers/helpers.js';

import { Translate } from './preBuilds/transformations/translation.js';
import { Scale } from './preBuilds/transformations/scale.js';
import { Rotate } from './preBuilds/transformations/rotate.js';
import { Skew } from './preBuilds/transformations/skew.js';
import { Flip } from './preBuilds/transformations/flip.js';

import { parseExpression } from './preBuilds/transformDSL/parsingAndApply.js';
import { computeAABBPoints } from './preBuilds/boundingBoxes/axisAlignedBoundingBox.js';
import { applyTransformToHomogeneousBuffer } from './preBuilds/matrix/matrixMultiplication.js';
import { assertAccess, DEV_INTERNAL_ACCESS } from '../providers/accesskeys.js';
import type {
  TranslateMethodProps,
  ScaleMethodProps,
  RotateMethodProps,
  SkewMethodProps,
  FlipMethodProps,
  ParsedDaTa,
  createTransformationMatrixProps
} from '../../types/transformations';
import { transformStack } from '../../types/index.js';

export function TransformMinix<
  TBase extends abstract new (...args: any[]) => any
>(Base: TBase) {
  abstract class Transformable extends Base {
    constructor(...rest: any[]) {
      super(...rest);
    }

    #geometry = this['getIGeo'](DEV_INTERNAL_ACCESS);
    #style = this['getIStyle'](DEV_INTERNAL_ACCESS);
    //#isProjection: boolean = false;
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ Transformation Batching  Methods +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // batching Dom Matrix for transformation batching

    #__batchedComposeTMatrix: DOMMatrix = new DOMMatrix();
    #__composeTMatrix: DOMMatrix = new DOMMatrix();

    #__tempTMatrix: DOMMatrix = new DOMMatrix();

    #isBatching: boolean = false; // track batching

    #batchCallback!: Function; // actual restore Function after batching done

    // method to start batching

    public beginT(): this {
      if (this.#isBatching)
        throw new Error(
          'there is already Transformation batching is on going , please call .endT() before next .beginT()'
        );

      this.#isBatching = true;
      return this;
    }

    // batching getter method

    public isBatching(): boolean {
      return this.#isBatching;
    }

    // method to reset batching matrix

    #resetMatrix(mat: DOMMatrix = this.#__composeTMatrix): void {
      resetMatrix(mat);
    }

    // method to end batching and finalizeTransform batching in visuals

    public endT(): void {
      if (!this.#isBatching) return;

      this.#isBatching = false;

      this.#finalizeTransform({
        callback: this.#batchCallback,
        transformMatrix: this.#__batchedComposeTMatrix,
        transformName: 'cumulative',
        transformType: 'batched'
      });

      this.#resetMatrix(this.#__batchedComposeTMatrix);
    }

    // method to batch transformation matric only affetcs buffer not visual output for next batch transform

    #batch__composeTMatrix(T: DOMMatrix): void {
      if (
        this.#isBatching &&
        T &&
        T instanceof DOMMatrix &&
        this.#__batchedComposeTMatrix &&
        this.#__batchedComposeTMatrix instanceof DOMMatrix
      ) {
        this.#__batchedComposeTMatrix.multiplySelf(T);
      }
    }

    public createTransformMatrix({
      transformations,
      baseTMatrix,
      multiplyWithBase = false,
      major = 'row',
      arrayType = 'normal'
    }: createTransformationMatrixProps): Float32Array | number[][] {
      // quick flags
      const hasTransforms = !!transformations;
      const doScale =
        hasTransforms && 'scale' in transformations && transformations.scale;
      const doSkew =
        hasTransforms && 'skew' in transformations && transformations.skew;
      const doRotate =
        hasTransforms && 'rotate' in transformations && transformations.rotate;
      const doTranslate =
        hasTransforms &&
        'translate' in transformations &&
        transformations.translate;

      // reset temp matrices once up-front and begin batching only if needed

      this.#resetMatrix(this.#__batchedComposeTMatrix);
      this.#resetMatrix(this.#__tempTMatrix);
      if (doScale || doSkew || doRotate || doTranslate) {
        this.beginT();
        doSkew && this.Skew(transformations.skew as SkewMethodProps);

        doScale && this.Scale(transformations.scale as ScaleMethodProps);
        doRotate && this.Rotate(transformations.rotate as RotateMethodProps);
        doTranslate &&
          this.Translate(transformations.translate as TranslateMethodProps);
      }

      // Extract composed matrix elements from the batched DOMMatrix (single source of truth)
      // DOMMatrix 2D properties: a, b, c, d, e, f (and m31,m32 for translation in 3x3 form)
      const composed = this.#__batchedComposeTMatrix as DOMMatrix;
      // If no transforms were applied, composed should be identity; still safe to read properties.
      let a = composed.a as number;
      let b = composed.b as number;
      let c = composed.c as number;
      let d = composed.d as number;
      let e = composed.e as number;
      let f = composed.f as number;
      let m31 = composed.m31 as number;
      let m32 = composed.m32 as number;

      // If baseTMatrix is provided and we must multiply with base, do a 3x3 multiplication:
      // result = base * composed
      if (baseTMatrix instanceof Float32Array && multiplyWithBase) {
        // Interpret baseTMatrix as 'column' major 1D matrix

        // COLUMN-major output layout (major === 'column'):
        //  [ a, b, m31,
        //    c, d, m32,
        //    e, f, 1 ]
        //
        // We'll extract base elements consistently into baseA..baseM32 and perform base * composed.
        let ba: number,
          bb: number,
          bc: number,
          bd: number,
          be: number,
          bf: number,
          bm31: number,
          bm32: number;

        // column-major layout
        // index mapping:
        // [0]=a_b, [1]=b_b, [2]=m31_b, [3]=c_b, [4]=d_b, [5]=m32_b, [6]=e_b, [7]=f_b, [8]=1
        ba = baseTMatrix[0] as number;
        bb = baseTMatrix[1] as number;
        bm31 = baseTMatrix[2] as number;
        bc = baseTMatrix[3] as number;
        bd = baseTMatrix[4] as number;
        bm32 = baseTMatrix[5] as number;
        be = baseTMatrix[6] as number;
        bf = baseTMatrix[7] as number;

        // Build base 3x3:
        // base 3x3 matrix (row-major conceptual):
        // [ ba  bc  be ]
        // [ bb  bd  bf ]
        // [ bm31 bm32 1 ]

        // composed 3x3 matrix (row-major conceptual):
        // [ a  c  e ]
        // [ b  d  f ]
        // [ m31 m32 1 ]

        // Multiply base * composed (3x3)
        const r00 = ba * a + bc * b + be * m31;
        const r01 = ba * c + bc * d + be * m32;
        const r02 = ba * e + bc * f + be * 1;

        const r10 = bb * a + bd * b + bf * m31;
        const r11 = bb * c + bd * d + bf * m32;
        const r12 = bb * e + bd * f + bf * 1;

        const r20 = bm31 * a + bm32 * b + 1 * m31;
        const r21 = bm31 * c + bm32 * d + 1 * m32;
        //const r22 = bm31 * e + bm32 * f + 1 * 1;

        // Now assign back to the a..f,m31,m32 in the same variable names expected later
        a = r00;
        c = r01;
        e = r02;

        b = r10;
        d = r11;
        f = r12;

        m31 = r20;
        m32 = r21;
        // r22 should be 1 (or close), ignore
      }

      // Clean-up batching state once
      this.#resetMatrix(this.#__batchedComposeTMatrix);
      this.#resetMatrix(this.#__tempTMatrix);
      this.#isBatching = false;

      // Build output in requested format
      if (arrayType === 'float32') {
        let out!: Float32Array;

        major === 'row' &&
          (out = new Float32Array([a, c, e, b, d, f, m31, m32, 1]));
        major === 'column' &&
          (out = new Float32Array([a, b, m31, c, d, m32, e, f, 1]));

        return out;
      } else {
        // normal nested arrays
        const tM: number[][] = [];

        if (major === 'row') {
          // rows: [ [a, c, e], [b, d, f], [m31, m32, 1] ]
          tM[0] = [a, c, e];
          tM[1] = [b, d, f];
          tM[2] = [m31, m32, 1];
        } else {
          // columns interpreted as rows here: [ [a, b, m31], [c, d, m32], [e, f, 1] ]
          tM[0] = [a, b, m31];
          tM[1] = [c, d, m32];
          tM[2] = [e, f, 1];
        }
        return tM;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ Healper  Methods +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public getBBox(includeStroke = true) {
      if (!this.#geometry || !this.#style) {
        throw new Error('geometry or style is not initialized');
      }

      const sw = includeStroke ? (this.#style['stroke-width'] ?? 0) / 2 : 0;

      const canonical = this.#geometry.buffer as Float32Array;
      const M = this.#composeTransforms(true) as DOMMatrix;

      // Transform all canonical points into screen space

      const transformed = applyTransformToHomogeneousBuffer(M, canonical);

      this.#resetMatrix(this.#__composeTMatrix);
      this.#resetMatrix(this.#__tempTMatrix);

      // Extract AABB
      const { minX, minY, maxX, maxY } = computeAABBPoints(transformed);

      // Stroke expansion (screen-space)
      const x = minX - sw;
      const y = minY - sw;
      const width = maxX + sw - x;
      const height = maxY + sw - y;

      // Extra user-friendly 4-corner matrix (optional but valid for AABB)
      const matrix = [
        [x, y, 1],
        [x + width, y, 1],
        [x + width, y + height, 1],
        [x, y + height, 1]
      ];

      return { x, y, width, height, matrix };
    }

    // method to multiply Transformation matrix with buffer of Shape through WASM-> C -> TS

    #matrixProductTxM(T: DOMMatrix, assing: boolean = false) {
      const buffer = this.#geometry.buffer as Float32Array;
      if (!(buffer instanceof Float32Array) || buffer.length < 1) {
        throw new Error(
          'There is Some Problem in Shape Matrix And Oriantation Matrix , may be you did something worng'
        );
      }

      return applyTransformToHomogeneousBuffer(T, buffer, assing);
    }

    public getMProduct(key: symbol, transformMatrix: DOMMatrix) {
      assertAccess(key);
      return () => this.#matrixProductTxM(transformMatrix);
    }

    // main method which finalizeTransforms transformation matrix to buffer and visually

    #finalizeTransform({
      callback,
      transformMatrix,
      transformName,
      transformType
    }: {
      callback: Function;
      transformMatrix: DOMMatrix | null;
      transformName: string;
      transformType: string;
    }) {
      let temporaryState!: Float32Array;

      const geo = this.#geometry as { transformStack: transformStack };
      const stack = geo.transformStack.stack;

      if (transformMatrix instanceof DOMMatrix) {
        const { a, b, m31, c, d, m32, e, f } = transformMatrix;

        // column major because shape matrix is row major and for clearity

        const tm = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

        stack.push({
          transformMatrix: tm,
          transformName,
          transformType
        });
      }

      const composedMat = this.#composeTransforms(true) as DOMMatrix;
      const { a, b, m31, c, d, m32, e, f } = composedMat;

      // column major because shape matrix is row major and for clearity

      const finalizedMatrix = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

      stack[0].transformMatrix = finalizedMatrix;

      (transformType != 'batched' &&
        (temporaryState = this.#matrixProductTxM(composedMat, false))) ||
        (temporaryState = this.#matrixProductTxM(composedMat, false));

      if (callback && typeof callback === 'function') {
        callback({
          temporaryState
        });
        const transform = `${a},${b},${c},${d},${e},${f}`;
        this['attrs']({ transform });
      } else {
        throw new Error(
          `call back must be given by the over return method and it should be the function in ${transformName} method `
        );
      }
    }

    #composeTransforms(required = false) {
      const { stack, skip } = (
        this.#geometry as { transformStack: transformStack }
      ).transformStack;

      this.#resetMatrix(this.#__tempTMatrix);
      if (!required) {
        const t = stack[0].transformMatrix as Float32Array;

        this.#resetMatrix(this.#__tempTMatrix);
        // Load into reusable DOMMatrix
        this.#__tempTMatrix.a = t[0] as number;
        this.#__tempTMatrix.b = t[1] as number;
        this.#__tempTMatrix.c = t[3] as number;
        this.#__tempTMatrix.d = t[4] as number;
        this.#__tempTMatrix.e = t[6] as number;
        this.#__tempTMatrix.f = t[7] as number;

        return this.#__tempTMatrix;
      }

      // reset reusable _res matrix to identity

      this.#resetMatrix();
      for (let i = 1; i < stack.length - skip; i++) {
        const t = stack?.[i]?.transformMatrix as Float32Array;

        // load into scratch matrix (no allocation)
        this.#__tempTMatrix.a = t[0] as number;
        this.#__tempTMatrix.b = t[1] as number;
        this.#__tempTMatrix.c = t[3] as number;
        this.#__tempTMatrix.d = t[4] as number;
        this.#__tempTMatrix.e = t[6] as number;
        this.#__tempTMatrix.f = t[7] as number;

        // multiply into reusable matrix
        this.#__composeTMatrix.multiplySelf(this.#__tempTMatrix);
      }

      return this.#__composeTMatrix;
    }

    public getCMatrix(key: symbol) {
      assertAccess(key);
      return () => this.#composeTransforms(true);
    }

    #batchingAndFinalizeTransformHandler({
      transformMatrix,
      transformName,
      transformType,
      callback
    }: {
      transformMatrix: DOMMatrix;
      transformName: string;
      transformType: string;
      callback: Function;
    }): this | void {
      if (this.#isBatching) {
        this.#batchCallback = callback as Function;

        this.#batch__composeTMatrix(transformMatrix);
        return this;
      }

      this.#finalizeTransform({
        callback: callback as Function,
        transformMatrix,
        transformName,
        transformType
      });
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ TRANSLATE METHOD  +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Translate({
      x,
      y,
      tType = 'a',
      px = 0,
      py = 0,

      callback = function () {}
    }: TranslateMethodProps): void | this | DOMMatrix {
      try {
        tType = tType == 'c' || tType == 'center' ? 'c' : typeCheck(tType);

        parameterTypeValidator({ x, y, tType, px, py }, propTypes, {}, {}, '');

        if (
          tType == 'a' ||
          tType == 'absolute' ||
          tType == 'c' ||
          tType == 'center'
        ) {
          const obb = this.getBBox(false) as {
            x: number;
            y: number;
            width: number;
            height: number;
          };

          (tType == 'a' || tType == 'absolute') && ([px, py] = [obb.x, obb.y]);

          (tType == 'c' || tType == 'center') &&
            ([px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2]);
        }

        this.#resetMatrix(this.#__tempTMatrix);
        Translate({ x, y, tType, px, py, oMatrix: this.#__tempTMatrix });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix: this.#__tempTMatrix,
          transformType: tType,

          transformName: 'translate',
          callback: callback as Function
        });
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ SCALE METHOD  +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Scale({
      sx,
      sy,
      tType = 'a',
      px = 0,
      py = 0,

      callback = function () {}
    }: ScaleMethodProps): void | this | DOMMatrix {
      try {
        tType = typeCheck(tType);
        parameterTypeValidator(
          { sx, sy, tType, px, py },
          propTypes,
          {},
          {},
          ''
        );

        if (tType == 'a' || tType == 'absolute') {
          const obb = this.getBBox(false) as {
            x: number;
            y: number;
            width: number;
            height: number;
          };

          [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
        }

        this.#resetMatrix(this.#__tempTMatrix);
        Scale({ sx, sy, tType, px, py, oMatrix: this.#__tempTMatrix });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix: this.#__tempTMatrix,
          transformType: tType,

          transformName: 'scale',
          callback: callback as Function
        });
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ ROTATE METHOD +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Rotate({
      angle,
      tType = 'a',
      px = 0,
      py = 0,

      callback = function () {}
    }: RotateMethodProps): void | this | DOMMatrix {
      try {
        tType = typeCheck(tType);
        parameterTypeValidator({ angle, tType, px, py }, propTypes, {}, {}, '');

        angle = angle % 360;

        if (tType == 'a' || tType == 'absolute') {
          const obb = this.getBBox(false) as {
            x: number;
            y: number;
            width: number;
            height: number;
          };

          [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
        }

        this.#resetMatrix(this.#__tempTMatrix);
        Rotate({ angle, tType, px, py, oMatrix: this.#__tempTMatrix });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix: this.#__tempTMatrix,
          transformType: tType,

          transformName: 'rotate',
          callback: callback as Function
        });
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ SKWE METHOD  +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Skew({
      sx,
      sy,
      tType = 'a',
      px = 0,
      py = 0,

      callback = function () {}
    }: SkewMethodProps): void | this | DOMMatrix {
      try {
        tType = typeCheck(tType);
        parameterTypeValidator(
          { sx, sy, tType, px, py },
          propTypes,
          {},
          {},
          ''
        );

        [sx, sy] = [sx % 360, sy % 360];

        if (tType == 'a' || tType == 'absolute') {
          const obb = this.getBBox(false) as {
            x: number;
            y: number;
            width: number;
            height: number;
          };

          [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
        }

        this.#resetMatrix(this.#__tempTMatrix);
        Skew({ sx, sy, tType, px, py, oMatrix: this.#__tempTMatrix });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix: this.#__tempTMatrix,
          transformType: tType,

          transformName: 'skew',
          callback: callback as Function
        });
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++ FLIP METHOD +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Flip({
      flipX,
      flipY,
      dirX = 'x+',
      dirY = 'y+',

      callback = function () {}
    }: FlipMethodProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { flipX, flipY, dirX, dirY },
          propTypes,
          {},
          {},
          ''
        );

        const { x, y, width, height } = this.getBBox() as {
          height: number;
          width: number;
          x: number;
          y: number;
        };

        this.#resetMatrix(this.#__tempTMatrix);
        Flip({
          flipX,
          flipY,
          dirX,
          dirY,
          x,
          y,
          width,
          height,
          oMatrix: this.#__tempTMatrix
        });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix: this.#__tempTMatrix,
          transformType: `${dirX}${dirY}`,

          transformName: 'flip',
          callback: callback as Function
        });
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ METHOD  to applying combine T matrix via transform method +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    #applyTransformations(
      TranslateOptions: ParsedDaTa[],
      callback: Function
    ): void {
      try {
        for (let index = 0; index < TranslateOptions.length; index++) {
          const element = TranslateOptions[index] as ParsedDaTa;

          const Data = {
            isEffect: false,
            isVEffect: false,
            callback: callback,
            ...element.data
          };

          this[element.tName](Data);
        }
      } catch (e) {
        throw e;
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ method to apply combine transformations  +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    public transform(input: string, callback?: Function[]): void | this {
      try {
        const isBatching = this.#isBatching;

        input.trim();
        let directMode = input[input.length - 1] === 'D' ? true : false;
        input = directMode ? input.slice(0, input.length - 1) : input;

        const expressions = input.match(/(?:[TSHRF][^)]*)\)/g);

        if (!expressions) {
          throw new Error(
            'Invalid expression , Given expression is not valid '
          );
        }

        const results: ParsedDaTa[] = [];
        let transformation = '',
          Ttype = '';

        for (const expr of expressions) {
          const parsed = parseExpression(expr.trim());
          if (parsed) {
            results.push(parsed);
            transformation += parsed.tName + ' -> ';
            'data' in parsed &&
              'tType' in parsed.data &&
              (Ttype += parsed.data.tType + ' -> ');
          } else {
            throw new Error(
              `Invalid expression , Check there may be something missing parameter or mismatch data types : ${expr}`
            );
          }
        }

        if (callback && typeof callback[0] === 'function') {
          !isBatching && this.beginT();

          this.#applyTransformations(results, callback[0]);

          !isBatching && this.endT();
        } else {
          throw new Error(
            'call back must be given by the over return method and it should be the       function'
          );
        }
      } catch (e) {
        throw e;
      }
    }
  }
  return Transformable;
}
