export type BBoxPoints = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

// ----------------------------------------------
//  Axis-Aligned Bounding Box (AABB)
// ----------------------------------------------
// Input :
//     shapeTransformedMat [x1,y1,1,x2,y2,1,......] N x 3 homogeneous
// Output :
//     { minX, minY, maxX, maxY }

export function computeAABBPoints(
  shapeTransformedMat: Float32Array
): BBoxPoints {
  const len = shapeTransformedMat.length;

  if (len === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (let i = 0; i < len; i += 3) {
    const x = shapeTransformedMat[i];
    const y = shapeTransformedMat[i + 1];

    x < minX && (minX = x);
    y < minY && (minY = y);
    x > maxX && (maxX = x);
    y > maxY && (maxY = y);
  }

  return { minX, minY, maxX, maxY };
}
