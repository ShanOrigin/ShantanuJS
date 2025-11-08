import { isValidMatrix } from '../../../utils/helpers/helpers.js';
import { base64 } from './CMATH.js';
/*
 *
type DOMMatrix = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

// These are the valid method names on Matrix
type MatrixMethodName =
  | 'multiply3x3By1x3'
  | 'multiply3x3By2x3'
  | 'multiply3x3By3x3'
  | 'multiply3x3By4x3'
  | 'multiply3x3By5x3'
  | 'multiply3x3Bynx3';
*/
export class CMATH {
  static #wasmInstance: WebAssembly.Instance;
  static #memory: WebAssembly.Memory;
  static #wasmBase64 = base64;

  static #TMatrix: Float32Array;
  static #TsMatrix: Float32Array;
  static #SMatrix: Float32Array;
  static #Data: Float32Array;
  static #Buffer: Uint8Array;
  static #SSize: number;
  static #SHSize: number;
  static #mem32: Int32Array;
  static #decoder = new TextDecoder('utf-8');

  constructor() {
    if (!CMATH.#wasmInstance) {
      const wasmBuffer = CMATH.#base64ToArrayBuffer(CMATH.#wasmBase64);

      const importObject = {
        env: {
          memory: new WebAssembly.Memory({ initial: 256 }),
          __memory_base: 0,
          __table_base: 0,
          table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
          emscripten_notify_memory_growth: () => {}
        }
      };

      const module = new WebAssembly.Module(wasmBuffer);
      CMATH.#wasmInstance = new WebAssembly.Instance(module, importObject);
      CMATH.#memory = CMATH.#wasmInstance.exports.memory as WebAssembly.Memory;

      const wasm = CMATH.#wasmInstance.exports as {
        getData: () => number;
        getTMatrix: () => number;
        getTsMatrix: () => number;
        getSMatrix: () => number;
        getStringBuf: () => number;
        getSSize: () => number;
        getSHSize: () => number;
      };

      // Set up views
      CMATH.#TMatrix = new Float32Array(
        CMATH.#memory.buffer,
        wasm.getTMatrix(),
        9
      );
      CMATH.#TsMatrix = new Float32Array(
        CMATH.#memory.buffer,
        wasm.getTsMatrix(),
        9
      );
      CMATH.#SMatrix = new Float32Array(
        CMATH.#memory.buffer,
        wasm.getSMatrix(),
        2048
      );
      CMATH.#Data = new Float32Array(CMATH.#memory.buffer, wasm.getData(), 10);
      CMATH.#Buffer = new Uint8Array(
        CMATH.#memory.buffer,
        wasm.getStringBuf(),
        2048
      );
      CMATH.#mem32 = new Int32Array(CMATH.#memory.buffer);

      CMATH.#SSize = wasm.getSSize();
      CMATH.#SHSize = wasm.getSHSize();

      // Initialize TsMatrix to identity
      CMATH.#TsMatrix.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
  }

  static #base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public getSVGPath(M: Float32Array[], D: Float32Array): string {
    if (!('buildPath' in CMATH.#wasmInstance.exports)) {
      throw new Error(`Function buildPath is not exported by the WASM module`);
    }

    CMATH.#Data.set(D);
    const fm = this.#mflat(M);

    CMATH.#SMatrix.set(fm);

    (CMATH.#wasmInstance.exports.buildPath as (a: number) => void)(
      (CMATH.#wasmInstance.exports.getSMatrix as () => number)()
    );

    const svgData: [string, number] = this.#getCStringPair();

    const svgPath = svgData[0] != '' ? svgData[0] : '';
    return svgPath;
  }

  #getCStringPair(): [string, number] {
    const strSize = CMATH.#mem32[CMATH.#SSize / 4];
    if (strSize == 0) return ['', 0];
    const view = CMATH.#Buffer;
    const utf8String = CMATH.#decoder.decode(view.subarray(0, strSize));
    return [utf8String, strSize];
  }

  #multiplyMatrix(
    funcName: string,
    T: DOMMatrix,
    M: Float32Array,
    D: Float32Array
  ): [Float32Array, [string, number]] {
    if (!(funcName in CMATH.#wasmInstance.exports)) {
      throw new Error(
        `Function ${funcName} is not exported by the WASM module`
      );
    }

    const flatT = new Float32Array([
      T.a,
      T.b,
      T.m13,
      T.c,
      T.d,
      T.m23,
      T.e,
      T.f,
      1
    ]);

    // Set memory buffers
    CMATH.#Data.set(D);
    CMATH.#TMatrix.set(flatT);
    const reset = new Float32Array(
      CMATH.#mem32[CMATH.#SHSize / 4] > 0 ? CMATH.#mem32[CMATH.#SHSize / 4] : 1
    );

    CMATH.#SMatrix.set(reset);

    CMATH.#SMatrix.set(M);

    // Write matrix size (divided by 3 for row count)
    CMATH.#mem32[CMATH.#SHSize / 4] = M.length / 3;

    // Call the WASM function
    (CMATH.#wasmInstance.exports[funcName] as () => void)();

    const updated = CMATH.#SMatrix.subarray(0, M.length);

    if (D[0] >= 0 && D[0] <= 15) {
      const strInfo = this.#getCStringPair();
      return [updated, strInfo];
    } else {
      return [updated, ['', 0]];
    }
  }

  public multiplyMatrix(
    T: DOMMatrix,
    M: Float32Array,
    funcName: string = 'multiply3x3Bynx3'
  ): Float32Array {
    if (!(funcName in CMATH.#wasmInstance.exports)) {
      throw new Error(
        `Function ${funcName} is not exported by the WASM module`
      );
    }

    const flatT = new Float32Array([
      T.a,
      T.b,
      T.m31,
      T.c,
      T.d,
      T.m32,
      T.e,
      T.f,
      1
    ]);

    // Set memory buffers
    /*
    console.warn('shape matrix X T matrix');
    console.warn('shape matrix : ', JSON.stringify(M));
    console.warn('T matrix :', JSON.stringify(flatT))
		*/
    CMATH.#TMatrix.set(flatT);
    const reset = new Float32Array(
      CMATH.#mem32[CMATH.#SHSize / 4] > 0 ? CMATH.#mem32[CMATH.#SHSize / 4] : 1
    );

    CMATH.#SMatrix.set(reset);

    CMATH.#SMatrix.set(M);

    // Write matrix size (divided by 3 for row count)
    CMATH.#mem32[CMATH.#SHSize / 4] = M.length / 3;

    // Call the WASM function
    (CMATH.#wasmInstance.exports[funcName] as () => void)();

    const updated = CMATH.#SMatrix.subarray(0, M.length);
    return updated;
  }

  public createMatrix(output: Float32Array, rows: number): Float32Array[] {
    const cols = 3;
    const total = rows * cols;

    if (output.length !== total) {
      throw new Error(
        `Output array does not match expected size of ${total} elements.`
      );
    }

    const resultMatrix = new Array(rows);

    for (let i = 0; i < rows; i++) {
      const row = new Float32Array(cols);
      row.set(output.subarray(i * cols, (i + 1) * cols));
      resultMatrix[i] = row;
    }

    return resultMatrix;
  }

  #mflat(m: Float32Array[]): Float32Array {
    const offsetLength = 3; // every row has 3 elements
    const sizeM = m.length * offsetLength;
    const flatMatrix = new Float32Array(sizeM);

    let offset = 0;
    for (let r = 0; r < m.length; r++) {
      flatMatrix.set(m[r], offset);
      offset += offsetLength;
    }

    return flatMatrix;
  }

  public sBatch(
    T: DOMMatrix,
    M: Float32Array[],
    O: Float32Array[],
    D: Float32Array
  ): [Float32Array[], Float32Array[], string] {
    const rowOffset = 3;
    let index = 0;
    const [mlen, olen] = [M.length, O.length];
    const mat = new Float32Array((mlen + olen) * rowOffset);
    for (let i = 0; i < mlen; i++) {
      mat.set(M[i], index);
      index += rowOffset;
    }
    for (let i = 0; i < olen; i++) {
      mat.set(O[i], index);
      index += rowOffset;
    }

    const result = this.#multiplyMatrix('multiply3x3Bynx3', T, mat, D);
    // console.log(result[0]);
    const r = result[0];
    const mOffset = mlen * rowOffset;

    const smat = this.createMatrix(r.subarray(0, mOffset), mlen);

    const omat = this.createMatrix(r.subarray(mOffset, r.length), olen);

    return [smat, omat, result[1][0]];
  }

  public multiply3x3By1x3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = M[0];

    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3By1x3',
      T,
      flatM,
      D
    );

    // console.time('createMatrix time ');
    const matrix = this.createMatrix(updated, 1);
    // console.timeEnd('createMatrix time ');
    if (!isValidMatrix(matrix, 1, 3)) {
      throw new Error('Updated matrix is invalid');
    }
    return [matrix, str];
  }

  public multiply3x3By2x3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = this.#mflat(M);
    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3By2x3',
      T,
      flatM,
      D
    );
    const matrix = this.createMatrix(updated, 2);

    if (!isValidMatrix(matrix, 2, 3)) {
      throw new Error('Updated matrix is invalid');
    }
    return [matrix, str];
  }

  /*
  public createDomMatrix(m: Float32Array): DOMMatrix {
    // m = [a , c , e , b , d , f , 0 , 0 , 1 ]

    return new DOMMatrix([m[0], m[3], m[1], m[4], m[2], m[5]]);
  }
*/

  // Example helper functions for each matrix type (you can add more)
  public multiply3x3By3x3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = this.#mflat(M);

    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3By3x3',
      T,
      flatM,
      D
    );

    const resultMatrix = this.createMatrix(updated, 3);
    if (!isValidMatrix(resultMatrix, 3, 3)) {
      throw new Error(' updated matrix is not valid matrix');
    }
    return [resultMatrix, str];
  }

  public multiply3x3By4x3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = this.#mflat(M);

    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3By4x3',
      T,
      flatM,
      D
    );

    const resultMatrix = this.createMatrix(updated, 4);
    if (!isValidMatrix(resultMatrix, 4, 3)) {
      throw new Error(' updated matrix is not valid matrix');
    }
    return [resultMatrix, str];
  }

  public multiply3x3By5x3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = this.#mflat(M);

    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3By5x3',
      T,
      flatM,
      D
    );

    const resultMatrix = this.createMatrix(updated, 5);
    if (!isValidMatrix(resultMatrix, 5, 3)) {
      throw new Error(' updated matrix is not valid matrix');
    }
    return [resultMatrix, str];
  }

  public multiply3x3Bynx3(
    T: DOMMatrix,
    M: Float32Array[],
    D: Float32Array
  ): [Float32Array[], [string, number]] {
    const flatM = this.#mflat(M);

    const mLen = M.length;
    const [updated, str] = this.#multiplyMatrix(
      'multiply3x3Bynx3',
      T,
      flatM,
      D
    );

    const resultMatrix = this.createMatrix(updated, mLen);
    if (!isValidMatrix(resultMatrix, mLen, 3)) {
      throw new Error(' updated matrix is not valid matrix');
    }
    return [resultMatrix, str];
  }

  public batchProcess(
    T: DOMMatrix,
    M: Float32Array,
    D: Float32Array
  ): Float32Array {
    const buffer = this.#multiplyMatrix('multiply3x3Bynx3', T, M, D);

    return buffer[0];
  }

  public matrixProductTxM(sharedBuffer: Float32Array, T: DOMMatrix) {
    //  const sharedBuffer = this.getIGeo()?.sharedBuffer as Float32Array;
    if (!(sharedBuffer instanceof Float32Array) || sharedBuffer.length < 1) {
      throw new Error(
        'There is Some Problem in Shape Matrix And Oriantation Matrix , may be you did sohing worng'
      );
    }

    const updatedMatrix = this.multiplyMatrix(T, sharedBuffer);

    if (
      !(updatedMatrix instanceof Float32Array) ||
      updatedMatrix.length !== sharedBuffer.length
    ) {
      throw new Error('Matrix Multiplication went Wrong');
    }

    sharedBuffer.set(updatedMatrix, 0);
  }
}

export const cmath = new CMATH();

/*
 *
function multiply(M: Float32Array[], T: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < M.length; i++) {
    const row = M[i];
    const transformed: number[] = [];
    for (let j = 0; j < 3; j++) {
      let value = 0;
      for (let k = 0; k < 3; k++) {
        value += row[k] * T[j][k]; // Corrected: T[j][k], not T[k][j]
      }
      transformed.push(value);
    }
    result.push(transformed);
  }
  return result;
}

//const obj = new Matrix();

const t: number[][] = [
  [1, 0, 10],
  [0, 1, 0],
  [0, 0, 1]
];

// const tm = new DOMMatrix([1, 0, 0, 1, 10, 0]);

const T: DOMMatrix = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 10,
  f: 0
};

const data = new Float32Array([0, 3, 2]);
const data1 = new Float32Array([1, 3, 10]);
const m: Float32Array[] = [new Float32Array([10, 10, 1])];
const m2: Float32Array[] = [
  new Float32Array([10, 10, 1]),
  new Float32Array([20, 10, 1]),
  new Float32Array([20, 20, 1]),
  new Float32Array([10, 20, 1])
];

console.log('+++++++++++++++++++++++++++++++++++');
console.log('3x3 By 1x3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', m, '\n ');

//console.log('\nby js function = ', multiply(m, t));
//console.time('dot');
//
//
const st = performance.now();
const d = cmath.sBatch(T, m, m2, data); //cmath.multiply3x3By1x3(T, m, data);
//console.timeEnd('dot');
const en = performance.now();

console.log('Approch 1 : combile and splite ');
console.log(
  'total time for 1x3 multiply and svg path for dot is using performance.now =',
  en - st
);
console.log('\n\nby C WebAssembly  = ', d, '\n');

data[0] = -1;
const ost = performance.now();
const odd = cmath.multiply3x3By4x3(T, m2, data);
const oen = performance.now();

console.log(
  'total time for 1x3 multiply and svg path for dot is using performance.now =',
  oen - ost
);
console.log('\n\nby C WebAssembly  = ', odd, '\n');

data[0] = 0;

const sst = performance.now();
const dd = cmath.multiply3x3By1x3(T, m, data);
const sen = performance.now();

console.log(' Approch 2 : seperate multiply ');

console.log(
  'total time for 1x3 multiply and svg path for dot is using performance.now =',
  sen - sst
);
console.log('\n\nby C WebAssembly  = ', dd, '\n');

console.log(sen - sst + (oen - ost), ' <-> ', en - st);

const m0: Float32Array[] = [
  new Float32Array([10, 10, 1]),
  new Float32Array([20, 10, 1])
];

const m1: number[][] = [
  [10, 10, 1],
  [20, 10, 1],
  [20, 20, 1]
];

const m3: number[][] = [
  [10, 10, 1],
  [20, 10, 1],
  [20, 20, 1],
  [10, 20, 1],
  [5, 15, 1]
];

const mn: Float32Array[] = [
  new Float32Array([10, 10, 1]),
  new Float32Array([20, 10, 1]),
  new Float32Array([20, 20, 1]),
  new Float32Array([10, 20, 1]),
  new Float32Array([5, 15, 1]),
  new Float32Array([10, 10, 1]),
  new Float32Array([20, 10, 1]),
  new Float32Array([20, 20, 1]),
  new Float32Array([10, 20, 1])
];
*/

/*
 *
console.log('\n+++++++++++++++++++++++++++++++++++');
console.log('3x3 By 2x3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', m0, '\n ');
console.time('2x3 multiply and Line svg path ');
console.log('by C WebAssembly = ', cmath.multiply3x3By2x3(T, m0, data1), '\n');

console.timeEnd('2x3 multiply and Line svg path ');
console.log('by js function = ', multiply(m0, t));
*/

/*
 *
console.log('\n+++++++++++++++++++++++++++++++++++');
console.log('3x3 By 3x3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', m1, '\n ');

console.log('by C WebAssembly = ', obj.multiply3x3By3x3(T, m1), '\n');

console.log('by js function = ', multiply(m1, t));
*/

/*
const rd = new Float32Array([5, 6, 10, 10, 4, 8]);
console.log('\n+++++++++++++++++++++++++++++++++++');
console.log('3x3 By 4x3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', m2, '\n ');

const rst = performance.now();
const r = cmath.multiply3x3By4x3(T, m2, rd);
const ren = performance.now();

console.log('by C ', r, '\n time taken ', ren - rst);

console.log('by js function = ', multiply(m2, t));
*/

/*
console.log('\n+++++++++++++++++++++++++++++++++++');
console.log('3x3 By 5x3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', m3, '\n ');

console.log('by C WebAssembly = ', obj.multiply3x3By5x3(T, m3), '\n');

console.log('by js function = ', multiply(m3, t));
*/
/*
console.log('\n+++++++++++++++++++++++++++++++++++');
console.log('3x3 By nx3');
console.log('+++++++++++++++++++++++++++++++++++');
console.log('T matrix = ', t, '\n M matrix = ', mn, '\n ');
const cr = new Float32Array([10, 3, 9]);

const cst = performance.now();
const cru = cmath.multiply3x3Bynx3(T, mn, cr);

const cen = performance.now();

console.log('by C ', cru, '\n time taken ', cen - cst);

console.log('by js function = ', multiply(mn, t));
*/
