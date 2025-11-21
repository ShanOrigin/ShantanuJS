import { CMATH } from '../../webAsm/interface/TS/CMATH_Interface.js';
import { parameterTypeValidator } from '../helpers/helpers.js';

import { propTypes, resetMatrix } from './preBuilds/helpers/helpers.js';

import { Translate } from './preBuilds/transformations/translation.js';
import { Scale } from './preBuilds/transformations/scale.js';
import { Rotate } from './preBuilds/transformations/rotate.js';
import { Skew } from './preBuilds/transformations/skew.js';
import { Flip } from './preBuilds/transformations/flip.js';

import { parseExpression } from './preBuilds/transformDSL/parsingAndApply.js';

import { DEV_INTERNAL_ACCESS } from '../providers/accesskeys.js';
import type {
  TranslateProps,
  ScaleProps,
  RotateProps,
  SkewProps,
  FlipProps,
  ParsedDaTa
} from '../../types/transformations';

export function InheritTransformationClassByMinix<
  TBase extends abstract new (...args: any[]) => any
>(Base: TBase) {
  abstract class MixedClass extends Base {
    constructor(...rest: any[]) {
      super(...rest);
    }

    #cmath = new CMATH();

    #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

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

    // method to end batching and affect batching in visuals

    public endT(track: boolean = true): void {
      if (!this.#isBatching) return;

      this.#isBatching = false;

      this.#affect({
        callback: this.#batchCallback,
        m: this.#TMatrix,
        transformation: 'cumulative',
        Ttype: 'batched',
        isEffect: true,
        isVEffect: true,
        track
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
        this.#matrixProductTxM(T);
        this.#TMatrix = T.multiply(this.#TMatrix);

        //console.log(this.#TMatrix.a, this.#TMatrix.d);
      }
    }

    /*
    public createTransformationMatrix(
      transformations: createTransformationMatrixProps,
      major: 'row' | 'column'
    ): tMatrixData {
      const isS = transformations && 'scale' in transformations;
      const isSk = transformations && 'skew' in transformations;
      const isR = transformations && 'rotate' in transformations;
      const isT = transformations && 'translate' in transformations;

      const sharedBuffer = this.#geometry.sharedBuffer as Float32Array;
      const temp = new Float32Array(sharedBuffer.length);
      temp.set(sharedBuffer, 0);

      this.#resetMatrix();
      this.beginT();

      isS && this.Scale(transformations.scale as ScaleProps);

      isSk && this.Skwe(transformations.skew as SkewProps);

      isR && this.Rotate(transformations.rotate as RotateProps);

      isT && this.Translate(transformations.translate as TranslateProps);

      console.log(' transformation = ', transformations);
      const { a, b, c, d, e, f, m31, m32 } = this.#TMatrix as DOMMatrix;

      let tM = [];
      major == 'row' &&
        ((tM[0] = [a, c, e]), (tM[1] = [b, d, f]), (tM[2] = [m31, m32, 1]));

      major == 'column' &&
        ((tM[0] = [a, b, m31]), (tM[1] = [c, d, m32]), (tM[2] = [e, f, 1]));

      this.#resetMatrix();
      this.#isBatching = false;

      console.log(' tepm and buffer ', temp, JSON.stringify(sharedBuffer));
      sharedBuffer.set(temp, 0);
      return tM as tMatrixData;
    }



    // method to check user given custom transformation matrix is correct or not if yes return that

    public setTMatrix(tmat: number[][] | DOMMatrix): void | DOMMatrix {
      tmat = setTMatrix(tmat) as DOMMatrix;

      console.log('in set T ', tmat);
      this.#matrixProductTxM(tmat);

      return tmat;
    }
*/

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++ Healper  Methods +++++++++++++++
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // method to multiply Transformation matrix with sharedBuffer of Shape through WASM-> C -> TS

    #matrixProductTxM(T: DOMMatrix) {
      const sharedBuffer = this.#geometry.sharedBuffer as Float32Array;
      if (!(sharedBuffer instanceof Float32Array) || sharedBuffer.length < 1) {
        throw new Error(
          'There is Some Problem in Shape Matrix And Oriantation Matrix , may be you did something worng'
        );
      }

      const updatedMatrix = this.#cmath.multiplyMatrix(T, sharedBuffer);

      if (
        !(updatedMatrix instanceof Float32Array) ||
        updatedMatrix.length !== sharedBuffer.length
      ) {
        throw new Error('Matrix Multiplication went Wrong');
      }

      sharedBuffer.set(updatedMatrix, 0);
    }
    // main method which affects transformation matrix to sharedBuffer and visually

    #affect({
      callback,
      m,
      transformation,
      Ttype,
      isEffect,
      isVEffect,
      track = true
    }: {
      callback: Function;
      m: DOMMatrix;
      transformation: string;
      Ttype: string;
      isEffect: boolean;
      isVEffect: boolean;
      track?: boolean;
    }) {
      Ttype != 'batched' && this.#matrixProductTxM(m);

      if (callback && typeof callback === 'function') {
        callback({
          tmat: m,
          transformation,
          Ttype,
          isEffect,
          isVEffect,
          track
        });
      } else {
        throw new Error(
          `call back must be given by the over return method and it should be the function in ${transformation} method `
        );
      }
    }

    #batchingAndAffectHandler(
      matrix: DOMMatrix,
      type: string,
      isEffect: boolean,
      isVEffect: boolean,
      transform: string,
      callback: Function
    ) {
      if (this.#isBatching) {
        this.#batchCallback = callback as Function;

        this.#batchTMatrix(matrix);
        return this;
      }

      this.#affect({
        callback: callback as Function,
        m: matrix,
        transformation: transform,
        Ttype: type,
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
        const matrix = Translate({ x, y, type, px, py, buffer });

        this.#batchingAndAffectHandler(
          matrix,
          type,
          isEffect ?? true,
          isVEffect ?? true,
          'translate',
          callbacks as Function
        );
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
        const matrix = Scale({ sx, sy, type, px, py, buffer });

        this.#batchingAndAffectHandler(
          matrix,
          type,
          isEffect ?? true,
          isVEffect ?? true,
          'scale',
          callbacks as Function
        );
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

        const r = this.#geometry as any;
        r['rotation'] = (r['rotation'] ?? 0) + angle;

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const matrix = Rotate({ angle, type, px, py, buffer });

        this.#batchingAndAffectHandler(
          matrix,
          type,
          isEffect ?? true,
          isVEffect ?? true,
          'rotate',
          callbacks as Function
        );
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
        const r = this.#geometry as any;
        r['skewX'] = (r['skewX'] ?? 0) + sx;
        r['skewY'] = (r['skewY'] ?? 0) + sy;

        const Buffer = this.#geometry.sharedBuffer as Float32Array;
        const buffer = Buffer.subarray(Buffer.length - 12);
        const matrix = Skew({ sx, sy, type, px, py, buffer });

        this.#batchingAndAffectHandler(
          matrix,
          type,
          isEffect ?? true,
          isVEffect ?? true,
          'skew',
          callbacks as Function
        );
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

        const matrix = Flip({ flipX, flipY, dirX, dirY, x, y, width, height });

        this.#batchingAndAffectHandler(
          matrix,
          `${dirX}${dirY}`,
          isEffect ?? true,
          isVEffect ?? true,
          'flip',
          callbacks as Function
        );
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
