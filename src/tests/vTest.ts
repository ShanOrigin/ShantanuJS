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

        const x = shapeRect.x + sw - (canvasRect.x - sw);
        const y = shapeRect.y + sw - (canvasRect.y - sw);

        const relativeRect = new DOMRect(
          x,
          y,
          Math.max(0, shapeRect.width - 2 * (sw + sw / 2)),
          Math.max(0, shapeRect.height - 2 * (sw + sw / 2))
        );

        /*
        const ctm = shapeFig.getScreenCTM();
        const scaleX = ctm?.a || 1;
        const scaleY = ctm?.d || 1;

        // shrink visually, scaled to screen pixels
        const shrinkX = (strokeWidth / 2) * scaleX;
        const shrinkY = (strokeWidth / 2) * scaleY;

        const relativeRect = new DOMRect(
          shapeRect.x - canvasRect.x + shrinkX,
          shapeRect.y - canvasRect.y + shrinkY,
          Math.max(0, shapeRect.width - strokeWidth * scaleX),
          Math.max(0, shapeRect.height - strokeWidth * scaleY)
        );
*/

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
    /*
		console.log(
      'Given epsilon : ' + epsilon + '\n Tolerance Table \n',
      ToleranceT
    );
		*/
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
