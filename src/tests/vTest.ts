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
async function getExpectedBBoxPoints(canvas: any, shape: any) {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  const canvasRect = canvas
    .getIFig(DEV_INTERNAL_ACCESS)
    .getBoundingClientRect();
  const shapeFig = shape.getIFig(DEV_INTERNAL_ACCESS);
  const bbox = shape.getBBox();
  const svg = shapeFig.ownerSVGElement;
  const ctm = shapeFig.getScreenCTM();

  if (!svg || !ctm) return [];

  const pt = svg.createSVGPoint();

  const transform = (ux: number, uy: number) => {
    pt.x = ux;
    pt.y = uy;
    const r = pt.matrixTransform(ctm);
    return [r.x - canvasRect.x, r.y - canvasRect.y] as [number, number];
  };

  const corners = cornersFromRect(bbox.x, bbox.y, bbox.width, bbox.height);
  return corners; // .map(([x, y]) => transform(x, y));
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

  const sw = parseFloat(shapeFig.getAttribute?.('stroke-width') || '0') || 0;

  // convert stroke to screen px via CTM scale
  const ctm = shapeFig.getScreenCTM();
  const scale = (Math.abs(ctm?.a || 1) + Math.abs(ctm?.d || 1)) / 2;
  const shrink = (sw * scale) / 2;

  const { x, y, width, height } = rect;

  const corners = cornersFromRect(x, y, width, height);
  return corners;
  /*
  // shrink & convert to canvas-relative
  return corners.map(([px, py]) => [
    px - canvasRect.x, // + (px === x ? shrink : -shrink),
    py - canvasRect.y //+ (py === y ? shrink : -shrink)
  ]) as [number, number][];

	*/
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
    const [ax, ay] = actual[i];
    const [ex, ey] = expected[i];

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
  const expected = await getExpectedBBoxPoints(canvas, shape);

  console.log('actual  =', actual);
  console.log('expected=', expected);

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

/*
 
import { DEV_INTERNAL_ACCESS } from '../utils/providers/accesskeys.js';

function getActualBBox(canvas: any, shape: any): Promise<DOMRect> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canvasRect = canvas
          .getIFig(DEV_INTERNAL_ACCESS)
          .getBoundingClientRect();

        const shapeFig = shape.getIFig(DEV_INTERNAL_ACCESS);
        const shapeRect = shapeFig.getBoundingClientRect();

        // ✅ Get stroke width directly from shape
        // First try internal property, then attribute fallback
        let sw =
          parseFloat(shapeFig.getAttribute?.('stroke-width') || '0') || 0;

        // remove stroke expansion (half per side)
        const { x: sx, y: sy, width: swi, height: shi } = shapeRect;
        const { x: cx, y: cy, width: cwi, height: chi } = canvasRect;

        const bboxPoints = [
          [sx + 0.5 * sw, sy + 0.5 * sw],
          [sx - 0.5 * sw + swi, sy + 0.5 * sw],
          [sx - 0.5 * sw + swi, sy - 0.5 * sw + shi],
          [sx + 0.5 * sw, sy - 0.5 * sw + shi]
        ];

        const actualBBoxPoints = bboxPoints.map((p) => {
          return [p[0] - cx, p[1] - cy];
        });

        console.log('actualBBoxPoints = ', actualBBoxPoints);

        // for previous version only remove Math.trunc
        const x = Math.trunc(sx) + sw - (Math.trunc(cx) - sw);
        const y = Math.trunc(sy) + sw - (Math.trunc(cy) - sw);

        const relativeRect = new DOMRect(
          x,
          y,
          Math.max(0, Math.trunc(swi) - 2 * (sw + sw / 2)),
          Math.max(0, Math.trunc(shi) - 2 * (sw + sw / 2))
        );

        resolve(relativeRect);
      });
    });
  });
}

function checkCorrectNess(
  actual: { x: number; y: number; width: number; height: number },
  expected: { x: number; y: number; width: number; height: number },
  epsilon = 0.5 // Tolerance in pixels for float rounding
): void {
  const ToleranceT = {};

  const fail = (key: keyof typeof actual) => {
    const t = Math.abs(actual[key] - expected[key]);

    let Epsilon = epsilon;
    (key == 'width' || key == 'height') && (Epsilon = epsilon * 2);

    (ToleranceT as any)[key] = { computed: t, Epsilon };

    return t > Epsilon;
  };

  const mismatches = ['x', 'y', 'width', 'height'].filter((k) =>
    fail(k as keyof typeof actual)
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Bounding box mismatch on: ${mismatches.join(
        ', '
      )}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(
        actual
      )}`
    );
  } else {
    console.log('++++++ test succusefull ++++++');

    logToleranceTable(ToleranceT, epsilon);
  }
}

function logToleranceTable(deltas: object, epsilon: number) {
  const maxDelta = Math.max(...Object.values(deltas));
  if (maxDelta > epsilon * 0.75) {
    // close to limit
    console.log('Near-threshold tolerance table:', deltas);
  }
}

export function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
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

// Get actual screen-space bounding box relative to canvas

export async function visualTest(
  canvas: any,
  shape: any,
  epsilon: number = 0.5
) {
  const actualBBox = await getActualBBox(canvas, shape);

  const { x, y, width, height } = (shape as any).getBBox();

  console.log(x, y, width, height);

  const expectedBBox = { x, y, width, height };

  // Assert correctness (throws error if mismatch)
  checkCorrectNess(actualBBox, expectedBBox, epsilon);
}

export async function vTest(name: string, t: Function) {
  console.warn('--------------- Start ------------------');
  console.log('Testing :- ', name, '...');

  await t();

  console.warn('--------------- End ------------------');
}
*/

// example

/*
  async function RectTests() {
  // create actual canvas and Shape you want to test

  let canvas: HTMLElement; // assing actual canvas HTMLElement
  let shape: HTMLElement; // assing actual shape HTMLElement

  // use vTest Function
  await vTest('create Shape with basic propeties', async () => {
    // create shape here if you want
    // assing any propeties if you want to

    // use visualTest Function
    await visualTest(canvas, shape);
  });
}

*/
