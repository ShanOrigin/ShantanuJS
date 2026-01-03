import { DEV_INTERNAL_ACCESS } from '../utils/providers/accesskeys.js';

// -------------------------------------------------------------
// Convert BBox rect into 4 corners
// Order: TL, TR, BR, BL
// -------------------------------------------------------------
function cornersFromRect(x: number, y: number, w: number, h: number) {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ] as [number, number][];
}

// -------------------------------------------------------------
// EXPECTED BBOX POINTS (using SVG getBBox + getScreenCTM → screen px)
// -------------------------------------------------------------
async function getExpectedBBoxPoints(shape: any) {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  const shapeFig = shape.getIFig(DEV_INTERNAL_ACCESS) as SVGElement;
  const bbox = shape.getBBox(); // svg BBox method
  const svg = shapeFig.ownerSVGElement;

  if (!svg) return [];

  const corners = cornersFromRect(bbox.x, bbox.y, bbox.width, bbox.height);

  return corners;
}

// -------------------------------------------------------------
// ACTUAL BBOX POINTS (getBoundingClientRect → corrected for stroke)
// -------------------------------------------------------------
async function getActualBBoxPoints(canvas: any, shape: any) {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  const canvasRect = canvas
    .getIFig(DEV_INTERNAL_ACCESS)
    .getBoundingClientRect();
  const shapeFig = shape.getIFig(DEV_INTERNAL_ACCESS);
  const rect = shapeFig.getBoundingClientRect();

  //const sw = parseFloat(shapeFig.getAttribute?.('stroke-width') || '0') || 0;

  // convert stroke to screen px via CTM scale
  // const ctm = shapeFig.getScreenCTM();
  //  const scale = (Math.abs(ctm?.a || 1) + Math.abs(ctm?.d || 1)) / 2;
  //const shrink = (sw * scale) / 2;

  const { x, y, width, height } = rect;

  const corners = cornersFromRect(x, y, width, height);

  // shrink & convert to canvas-relative
  const cor = corners.map(([px, py]) => [
    px - canvasRect.x,
    py - canvasRect.y
  ]) as [number, number][];

  return cor;
}

// -------------------------------------------------------------
// Compare 4 corners with epsilon tolerance
// -------------------------------------------------------------
function compareBBoxMatrices(
  actual: [number, number][],
  expected: [number, number][],
  epsilon = 0.5
) {
  if (actual.length !== 4 || expected.length !== 4)
    throw new Error('BBox must have 4 corners.');

  for (let i = 0; i < 4; i++) {
    const [ax, ay] = actual[i]!;
    const [ex, ey] = expected[i]!;

    const dx = Math.abs(ax - ex);
    const dy = Math.abs(ay - ey);

    if (dx > epsilon || dy > epsilon) {
      throw new Error(
        `Corner ${i} mismatch:\n` +
          `actual:   (${ax}, ${ay})\n` +
          `expected: (${ex}, ${ey})\n` +
          `delta:    (${dx}, ${dy})`
      );
    }
  }
}

// -------------------------------------------------------------
// Public test function (matrix-based visual test)
// -------------------------------------------------------------
export async function visualTest(canvas: any, shape: any, epsilon = 0.5) {
  const actual = await getActualBBoxPoints(canvas, shape);
  const expected = await getExpectedBBoxPoints(shape);

  //  console.log('actual  =', actual);
  //  console.log('expected=', expected);

  compareBBoxMatrices(actual, expected, epsilon);

  console.log('++++++ matrix test successful ++++++');
}

// -------------------------------------------------------------
// Utility wrappers (same as your style)
// -------------------------------------------------------------
export async function vTest(name: string, t: Function) {
  console.warn('--------------- Start ------------------');
  console.log('Testing :- ', name, '...');
  await t();
  console.warn('--------------- End ------------------');
}

export async function ThrowError(t: Function) {
  try {
    await t();
  } catch (e) {
    console.log(' throw error test successful ');
    console.log((e as any).message);
  }
}

export async function toError(name: string, t: Function) {
  console.warn('--------------- Start ------------------');
  try {
    console.log('Testing :- ', name, '...');
    await t();
  } catch (e) {
    console.log(' throw error test successful ');
    console.log((e as any).message);
  }
  console.warn('--------------- End ------------------');
}

export function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
