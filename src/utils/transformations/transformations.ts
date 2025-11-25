import { CMATH } from '../../webAsm/interface/TS/CMATH_Interface.js';
import { parameterTypeValidator } from '../helpers/helpers.js';

import { propTypes, resetMatrix } from './preBuilds/helpers/helpers.js';

import { Translate } from './preBuilds/transformations/translation.js';
import { Scale } from './preBuilds/transformations/scale.js';
import { Rotate } from './preBuilds/transformations/rotate.js';
import { Skew } from './preBuilds/transformations/skew.js';
import { Flip } from './preBuilds/transformations/flip.js';

import { parseExpression } from './preBuilds/transformDSL/parsingAndApply.js';
import { computeAABBPoints } from './preBuilds/boundingBoxes/axisAlignedBoundingBox.js';
import { assertAccess, DEV_INTERNAL_ACCESS } from '../providers/accesskeys.js';
import type {
  TranslateProps,
  ScaleProps,
  RotateProps,
  SkewProps,
  FlipProps,
  ParsedDaTa
} from '../../types/transformations';
import { transformStack } from '../../types/index.js';

export function InheritTransformationClassByMinix<
  TBase extends abstract new (...args: any[]) => any
>(Base: TBase) {
  abstract class MixedClass extends Base {
    constructor(...rest: any[]) {
      super(...rest);
    }

    #cmath = new CMATH();

    #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);
    #style = this.getIStyle(DEV_INTERNAL_ACCESS);
    //#isProjection: boolean = false;
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ Transformation Batching  Methods +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // batching Dom Matrix for transformation batching

    #TMatrix: DOMMatrix = new DOMMatrix([
      1,
      0,
      0,
      0, // Column 1: m11, m12, m13, m14
      0,
      1,
      0,
      0, // Column 2: m21, m22, m23, m24
      0,
      0,
      1,
      0, // Column 3: m31, m32, m33, m34 (perspective)
      0,
      0,
      0,
      1 // Column 4: m41, m42, m43, m44
    ]);

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

    #resetMatrix(): void {
      resetMatrix(this.#TMatrix);
    }

    // method to end batching and finalizeTransform batching in visuals

    public endT(): void {
      if (!this.#isBatching) return;

      this.#isBatching = false;

      this.#finalizeTransform({
        callback: this.#batchCallback,
        transformMatrix: this.#TMatrix,
        transformName: 'cumulative',
        transformType: 'batched',
        isEffect: true,
        isVEffect: true
      });

      this.#resetMatrix();
    }

    // method to batch transformation matric only affetcs buffer not visual output for next batch transform

    #batchTMatrix(T: DOMMatrix): void {
      if (
        this.#isBatching &&
        T &&
        T instanceof DOMMatrix &&
        this.#TMatrix &&
        this.#TMatrix instanceof DOMMatrix
      ) {
        this.#matrixProductTxM(T, true);
        this.#TMatrix = T.multiply(this.#TMatrix);

        //console.log(this.#TMatrix.a, this.#TMatrix.d);
      }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ Healper  Methods +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public getBBox() {
      if (!this.#geometry || !this.#style) {
        throw new Error('geometry or style is not initialized');
      }

      const sw = (this.#style['stroke-width'] ?? 0) / 2;

      const canonical = this.#geometry.sharedBuffer as Float32Array;
      const M = this.#composeTransforms(true) as DOMMatrix;

      // Transform all canonical points into screen space
      const transformed = this.#cmath.multiplyMatrix(M, canonical);

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

    // method to multiply Transformation matrix with sharedBuffer of Shape through WASM-> C -> TS

    #matrixProductTxM(T: DOMMatrix, assing: boolean = false) {
      const sharedBuffer = this.#geometry.sharedBuffer as Float32Array;
      if (!(sharedBuffer instanceof Float32Array) || sharedBuffer.length < 1) {
        throw new Error(
          'There is Some Problem in Shape Matrix And Oriantation Matrix , may be you did something worng'
        );
      }

      const updatedBuffer = this.#cmath.multiplyMatrix(T, sharedBuffer);

      if (
        !(updatedBuffer instanceof Float32Array) ||
        updatedBuffer.length !== sharedBuffer.length
      ) {
        throw new Error('Matrix Multiplication went Wrong');
      }

      assing &&
        sharedBuffer.set(
          updatedBuffer.subarray(updatedBuffer.length - 12),
          sharedBuffer.length - 12
        );

      return updatedBuffer;
    }

    public getMProduct(key: symbol, transformMatrix: DOMMatrix) {
      assertAccess(key);
      return () => this.#matrixProductTxM(transformMatrix);
    }

    // main method which finalizeTransforms transformation matrix to sharedBuffer and visually

    #finalizeTransform({
      callback,
      transformMatrix,
      transformName,
      transformType,

      isEffect,
      isVEffect
    }: {
      callback: Function;
      transformMatrix: DOMMatrix | null;
      transformName: string;
      transformType: string;
      isEffect: boolean;
      isVEffect: boolean;
    }) {
      let temporaryState!: Float32Array;

      const geo = this.#geometry as { transformStack: transformStack };

      if (transformMatrix instanceof DOMMatrix) {
        const { a, b, m31, c, d, m32, e, f } = transformMatrix;

        // column major because shape matrix is row major and for clearity

        const tm = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

        geo.transformStack.stack.push({
          transformMatrix: tm,
          transformName,
          transformType
        });
      }

      const composedMat = this.#composeTransforms(true) as DOMMatrix;
      const { a, b, m31, c, d, m32, e, f } = composedMat;

      // column major because shape matrix is row major and for clearity

      const finalizedMatrix = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

      geo.transformStack.stack[0].transformMatrix = finalizedMatrix;

      (transformType != 'batched' &&
        (temporaryState = this.#matrixProductTxM(composedMat, true))) ||
        (temporaryState = this.#matrixProductTxM(composedMat, false));

      if (callback && typeof callback === 'function') {
        callback({
          transformMatrix: finalizedMatrix,
          temporaryState,
          isEffect,
          isVEffect
        });
      } else {
        throw new Error(
          `call back must be given by the over return method and it should be the function in ${transformName} method `
        );
      }
    }

    #composeTransforms(required: boolean = false) {
      const { stack, skip } = (
        this.#geometry as { transformStack: transformStack }
      ).transformStack;

      if (!required) {
        const t = stack[0].transformMatrix as Float32Array;
        const dm = new DOMMatrix([
          t[0],
          t[1], // a , b , 0
          t[3],
          t[4], // c , d , 0
          t[6],
          t[7] // e , f , 1
        ]);

        return dm;
      }

      let res = new DOMMatrix();

      for (let i = 1; i < stack.length - skip; i++) {
        const T = stack[i];
        const t = T.transformMatrix as Float32Array;
        // convert your column-major 3×3 into DOMMatrix
        const dm = new DOMMatrix([
          t[0],
          t[1], // a , b , 0
          t[3],
          t[4], // c , d , 0
          t[6],
          t[7] // e , f , 1
        ]);

        // correct multiplication order
        res = dm.multiply(res);
      }

      const cm = stack[0].transformMatrix;
      const [da, db, dc, dd, de, df] = [
        Math.abs(cm[0] - res.a),
        Math.abs(cm[1] - res.b),
        Math.abs(cm[3] - res.c),
        Math.abs(cm[4] - res.d),
        Math.abs(cm[6] - res.e),
        Math.abs(cm[7] - res.f)
      ];
      console.log(
        `Floating Point Drinfts : a : ${da} , b : ${db} , c : ${dc} , d : ${dd} , e : ${de} , f : ${df} `
      );

      return res;
    }

    public getCMatrix(key: symbol) {
      assertAccess(key);
      return () => this.#composeTransforms(true);
    }

    #undo(N: number = 1, callback: Function) {
      const geo = this.#geometry as { transformStack: transformStack };
      geo.transformStack.skip = Math.min(
        geo.transformStack.skip + N,
        geo.transformStack.stack.length
      );

      this.#finalizeTransform({
        callback,
        transformMatrix: null,
        transformName: '',
        transformType: '',
        isEffect: true,
        isVEffect: true
      });
    }

    #redo(N: number = 1, callback: Function) {
      const geo = this.#geometry as { transformStack: transformStack };
      geo.transformStack.skip = Math.max(geo.transformStack.skip - N, 0);

      this.#finalizeTransform({
        callback,
        transformMatrix: null,
        transformName: '',
        transformType: '',
        isEffect: true,
        isVEffect: true
      });
    }

    #batchingAndFinalizeTransformHandler({
      transformMatrix,
      transformName,
      transformType,
      isEffect,
      isVEffect,
      callbacks
    }: {
      transformMatrix: DOMMatrix;
      transformName: string;
      transformType: string;
      isEffect: boolean;
      isVEffect: boolean;

      callbacks: Function;
    }) {
      if (this.#isBatching) {
        this.#batchCallback = callbacks as Function;

        this.#batchTMatrix(transformMatrix);
        return this;
      }

      this.#finalizeTransform({
        callback: callbacks as Function,
        transformMatrix,
        transformName,
        transformType,
        isEffect: isEffect ?? true,
        isVEffect: isVEffect ?? true
      });
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ TRANSLATE METHOD  +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    public Translate({
      x,
      y,
      type = 'a',
      px = 0,
      py = 0,
      isEffect = true,
      callbacks = function () {},
      isVEffect = true
    }: TranslateProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { x, y, type, px, py, isEffect, isVEffect },
          propTypes,
          {},
          {},
          ''
        );

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const transformMatrix = Translate({ x, y, type, px, py, buffer });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix,
          transformType: type,
          isEffect,
          isVEffect,
          transformName: 'translate',
          callbacks: callbacks as Function
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
      type = 'a',
      px = 0,
      py = 0,
      isEffect = true,
      callbacks = function () {},
      isVEffect = true
    }: ScaleProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { sx, sy, type, px, py, isEffect, isVEffect },
          propTypes,
          {},
          {},
          ''
        );

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const transformMatrix = Scale({ sx, sy, type, px, py, buffer });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix,
          transformType: type,
          isEffect,
          isVEffect,
          transformName: 'scale',
          callbacks: callbacks as Function
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
      type = 'a',
      px = 0,
      py = 0,
      isEffect = true,
      callbacks = function () {},
      isVEffect = true
    }: RotateProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { angle, type, px, py, isEffect, isVEffect },
          propTypes,
          {},
          {},
          ''
        );

        angle = angle % 360;

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const transformMatrix = Rotate({ angle, type, px, py, buffer });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix,
          transformType: type,
          isEffect,
          isVEffect,
          transformName: 'rotate',
          callbacks: callbacks as Function
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
      type = 'a',
      px = 0,
      py = 0,
      isEffect = true,
      callbacks = function () {},
      isVEffect = true
    }: SkewProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { sx, sy, type, px, py, isEffect, isVEffect },
          propTypes,
          {},
          {},
          ''
        );

        [sx, sy] = [sx % 360, sy % 360];

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const transformMatrix = Skew({ sx, sy, type, px, py, buffer });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix,
          transformType: type,
          isEffect,
          isVEffect,
          transformName: 'skew',
          callbacks: callbacks as Function
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
      isEffect = true,
      callbacks = function () {},
      isVEffect = true
    }: FlipProps): void | this | DOMMatrix {
      try {
        parameterTypeValidator(
          { flipX, flipY, dirX, dirY, isEffect, isVEffect },
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

        const transformMatrix = Flip({
          flipX,
          flipY,
          dirX,
          dirY,
          x,
          y,
          width,
          height
        });

        this.#batchingAndFinalizeTransformHandler({
          transformMatrix,
          transformType: `${dirX}${dirY}`,
          isEffect,
          isVEffect,
          transformName: 'flip',
          callbacks: callbacks as Function
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
          const element = TranslateOptions[index];

          const Data = {
            isEffect: false,
            isVEffect: false,
            callbacks: callback,
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
    public transform(input: string, callbacks?: Function[]): void | this {
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
              'type' in parsed.data &&
              (Ttype += parsed.data.type + ' -> ');
          } else {
            throw new Error(
              `Invalid expression , Check there may be something missing parameter or mismatch data types : ${expr}`
            );
          }
        }

        if (callbacks && typeof callbacks[0] === 'function') {
          !isBatching && this.beginT();

          this.#applyTransformations(results, callbacks[0]);

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
  return MixedClass;
}
