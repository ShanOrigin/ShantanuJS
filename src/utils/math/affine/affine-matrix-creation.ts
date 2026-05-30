import { translate } from './transformations/translation.js';
import { scale } from './transformations/scale.js';
import { rotate } from './transformations/rotate.js';
import { skew } from './transformations/skew.js';

import type { CreateTransformationMatrixProps } from '../../../models/types/affine-transformations';
import { resetMatrix } from '../matrix/matrix-utils.js';
import { affineMatrixMultiply } from '../matrix/matrix-multiplication.js';

/**
 * Creates a composed 2D affine transformation matrix from the supplied
 * transformation components.
 *
 * ============================================================================
 * TRANSFORMATION ORDER
 * ============================================================================
 * Transformations are composed in the following order:
 *
 * 1. Skew
 * 2. Scale
 * 3. Rotate
 * 4. Translate
 *
 * Result:
 *
 * composed =
 *   Identity
 *   × Skew
 *   × Scale
 *   × Rotate
 *   × Translate
 *
 * ============================================================================
 * INTERNAL REPRESENTATION
 * ============================================================================
 * DOMMatrix is used internally to compose transformations.
 *
 * The resulting matrix is converted into a compact 3×3 affine matrix:
 *
 * Column-major:
 *
 * [
 *   a, b, 0,
 *   c, d, 0,
 *   e, f, 1
 * ]
 *
 * Equivalent matrix:
 *
 * ┌           ┐
 * │ a  b  0 │
 * │ c  d  0 │
 * │ e  f  1 │
 * └           ┘
 *
 * ============================================================================
 * BASE MATRIX COMPOSITION
 * ============================================================================
 * When:
 *
 * multiplyWithBase === true
 *
 * the final result becomes:
 *
 * baseTMatrix × composed
 *
 * allowing hierarchical transformation composition.
 *
 * ============================================================================
 * OUTPUT FORMAT
 * ============================================================================
 * major = 'column'
 *
 * [
 *   a, b, 0,
 *   c, d, 0,
 *   e, f, 1
 * ]
 *
 * major = 'row'
 *
 * [
 *   a, c, e,
 *   b, d, f,
 *   0, 0, 1
 * ]
 *
 * @param props Transformation matrix creation configuration.
 *
 * @returns A 3×3 affine transformation matrix stored as a Float32Array.
 */
export function createAffineTransformMatrix({
  transformations,
  baseTMatrix,
  multiplyWithBase = false,
  major = 'row'
}: CreateTransformationMatrixProps): Float32Array {
  const doScale = !!transformations?.scale;
  const doSkew = !!transformations?.skew;
  const doRotate = !!transformations?.rotate;
  const doTranslate = !!transformations?.translate;

  const composed = new DOMMatrix();
  const temp = new DOMMatrix();

  if (doSkew) {
    skew({ ...transformations.skew, oMatrix: temp });
    composed.multiplySelf(temp);
    resetMatrix(temp);
  }

  if (doScale) {
    scale({ ...transformations.scale, oMatrix: temp });
    composed.multiplySelf(temp);
    resetMatrix(temp);
  }

  if (doRotate) {
    rotate({ ...transformations.rotate, oMatrix: temp });
    composed.multiplySelf(temp);
    resetMatrix(temp);
  }

  if (doTranslate) {
    translate({ ...transformations.translate, oMatrix: temp });
    composed.multiplySelf(temp);
    resetMatrix(temp);
  }

  const output = new Float32Array(9);
  const compose = new Float32Array(9);

  compose[0] = composed.a;
  compose[1] = composed.b;
  compose[2] = 0;

  compose[3] = composed.c;
  compose[4] = composed.d;
  compose[5] = 0;

  compose[6] = composed.e;
  compose[7] = composed.f;
  compose[8] = 1;

  if (multiplyWithBase && baseTMatrix instanceof Float32Array) {
    affineMatrixMultiply(baseTMatrix, compose, output);
  }

  if (major === 'column') {
    return output;
  }

  return new Float32Array([
    output[0],
    output[3],
    output[6],

    output[1],
    output[4],
    output[7],

    output[2],
    output[5],
    output[8]
  ]);
}
