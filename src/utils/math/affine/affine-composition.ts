import type { TransformStack } from '../../../models/types/common';
import { affineMatrixMultiply } from '../matrix/matrix-multiplication.js';

/**
 * Composes the active affine transformation matrices contained within a
 * transformation stack.
 *
 * ============================================================================
 * TRANSFORM STACK STRUCTURE
 * ============================================================================
 * The stack contains affine transformation matrices stored as 3×3
 * Float32Array instances:
 *
 * [
 *   a, b, 0,
 *   c, d, 0,
 *   e, f, 1
 * ]
 *
 * ============================================================================
 * COMPOSITION ORDER
 * ============================================================================
 * Matrices are multiplied sequentially from left to right:
 *
 * result =
 *   T₁ × T₂ × T₃ × ... × Tₙ
 *
 * where:
 *
 * T₁ = stack[1]
 * T₂ = stack[2]
 * ...
 *
 * The first matrix in the multiplication chain is applied first.
 *
 * ============================================================================
 * SKIP SEMANTICS
 * ============================================================================
 * The `skip` value indicates how many matrices from the end of the stack
 * should be excluded from composition.
 *
 * Example:
 *
 * stack.length = 8
 * skip = 2
 *
 * composed range:
 *
 * stack[1] ... stack[5]
 *
 * ============================================================================
 * FAST PATH
 * ============================================================================
 * When `required` is false, no composition is performed and the base
 * transformation matrix is returned directly.
 *
 * ============================================================================
 * PERFORMANCE
 * ============================================================================
 * This implementation avoids mutating matrices contained in the stack.
 * A copy is returned whenever the base transform is requested directly.
 *
 * @param transformStack Transformation stack definition.
 * @param required Whether full transformation composition is required.
 *
 * @returns The composed affine transformation matrix.
 */
export function composeAffineTransformations(
  transformStack: TransformStack,
  required = false
): Float32Array {
  const { stack, skip } = transformStack;

  if (!required) {
    return new Float32Array(stack[0] as Float32Array);
  }

  const end = stack.length - skip;

  let composed = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  let temp = new Float32Array(9);

  for (let i = 1; i < end; i++) {
    affineMatrixMultiply(composed, stack[i] as Float32Array, temp);

    const swap = composed;
    composed = temp;
    temp = swap;
  }
  return composed;
}
