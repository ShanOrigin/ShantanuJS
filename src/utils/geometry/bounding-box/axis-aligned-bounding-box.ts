type BBoxPoints = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * Computes the axis-aligned bounding box (AABB) from transformed geometry points.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function calculates the minimum axis-aligned rectangle that fully
 * contains a set of 2D points expressed in homogeneous coordinates.
 *
 * It operates purely on numeric data and performs no transformation itself.
 *
 * -------------------------------------------------------------------------
 * INPUT CONTRACT
 * -------------------------------------------------------------------------
 * - The input buffer is expected to be a flat Float32Array
 * - Points must be stored in homogeneous form:
 *     [x1, y1, 1, x2, y2, 1, ...]
 * - The buffer length should be a multiple of 3
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - Only X and Y components are considered
 * - Z components are ignored
 * - The bounding box is always axis-aligned
 * - No allocation beyond primitive numbers is performed
 *
 * -------------------------------------------------------------------------
 * EDGE CASE BEHAVIOR
 * -------------------------------------------------------------------------
 * - An empty buffer yields a zero-sized bounding box at the origin
 * - No errors are thrown for empty input
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param shapeTransformedMat - Flat buffer of transformed homogeneous points.
 *
 * -------------------------------------------------------------------------
 * RETURNS
 * -------------------------------------------------------------------------
 * An object containing the minimum and maximum X and Y extents:
 * { minX, minY, maxX, maxY }
 */
export function computeAABBPoints(
  shapeTransformedMat: Float32Array
): BBoxPoints {
  // -----------------------------------------------------------
  // STEP 1: Handle empty input buffer
  // -----------------------------------------------------------

  const len = shapeTransformedMat.length;

  if (len === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  // -----------------------------------------------------------
  // STEP 2: Initialize bounding extents
  // -----------------------------------------------------------

  let minX: number = Infinity,
    minY: number = Infinity,
    maxX: number = -Infinity,
    maxY: number = -Infinity;

  // -----------------------------------------------------------
  // STEP 3: Iterate over homogeneous points and update bounds
  // -----------------------------------------------------------

  for (let i = 0; i < len; i += 3) {
    const x = shapeTransformedMat[i] as number;
    const y = shapeTransformedMat[i + 1] as number;

    x < minX && (minX = x);
    y < minY && (minY = y);
    x > maxX && (maxX = x);
    y > maxY && (maxY = y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Computes the center point of an axis-aligned bounding box (AABB).
 *
 * Expected bounds layout:
 *
 * [ minX, minY, maxX, maxY ]
 *
 * @param bounds Bounding box represented as
 *               [ minX, minY, maxX, maxY ].
 *
 * @returns An object containing the center coordinates.
 */
export function getBoundsCenter(bounds: Float32Array): {
  cx: number;
  cy: number;
} {
  return {
    cx: (bounds[0] + bounds[2]) * 0.5,
    cy: (bounds[1] + bounds[3]) * 0.5
  };
}
