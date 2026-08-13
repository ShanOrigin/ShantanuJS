import {
  initializeCanvasAndShapes,
  shapeGeometry,
} from "../../../data/initializeCanvasAndShapes.js";
import ShantanuJSTestTool from "../../../testingTool/shantanuJS-test.js";

const bbox = {};

function calculateTextBBox(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
  letterSpacing: number,
  wordSpacing: number,
  textAnchor: string,
  alignmentBaseline: string,
  dominantBaseline: string,
) {
  // ---------------------------------------------------------
  // Width approximation
  // ---------------------------------------------------------

  let widthFactor = 0.55;

  switch (fontWeight) {
    case "bold":
      widthFactor *= 1.05;
      break;

    case "bolder":
      widthFactor *= 1.1;
      break;

    case "lighter":
      widthFactor *= 0.95;
      break;
  }

  switch (fontStyle) {
    case "italic":
    case "oblique":
      widthFactor *= 1.02;
      break;
  }

  const charWidth = text.length * fontSize * widthFactor;

  const letterWidth = Math.max(0, text.length - 1) * letterSpacing;

  const spaceCount = (text.match(/ /g) || []).length;

  const wordWidth = spaceCount * wordSpacing;

  const width = charWidth + letterWidth + wordWidth;

  // ---------------------------------------------------------
  // Height approximation
  // ---------------------------------------------------------

  const height = fontSize;

  // ---------------------------------------------------------
  // Horizontal anchor
  // ---------------------------------------------------------

  let minX = x;
  let maxX = x + width;

  switch (textAnchor) {
    case "middle":
      minX = x - width / 2;
      maxX = x + width / 2;
      break;

    case "end":
      minX = x - width;
      maxX = x;
      break;

    case "start":
    default:
      minX = x;
      maxX = x + width;
      break;
  }

  // ---------------------------------------------------------
  // Vertical baseline
  // ---------------------------------------------------------

  const baseline = dominantBaseline || alignmentBaseline;

  let minY = y;
  let maxY = y + height;

  switch (baseline) {
    case "middle":
    case "central":
      minY = y - height / 2;
      maxY = y + height / 2;
      break;

    case "hanging":
      minY = y;
      maxY = y + height;
      break;

    case "text-bottom":
    case "bottom":
      minY = y - height;
      maxY = y;
      break;

    case "baseline":
    default:
      // SVG baseline approximation:
      // ~80% ascent, ~20% descent

      minY = y - height * 0.8;
      maxY = y + height * 0.2;
      break;
  }

  return [minX, minY, maxX, maxY];
}

function generateBounds(
  shape: string,
  buffer: Float32Array,
  extra: Record<string, any> = {},
) {
  const b = bbox as any;
  switch (shape) {
    case "line":
      {
        const [x1, y1, , x2, y2] = buffer;
        b[shape] = [x1, y1, x2, y2];
      }
      break;

    case "point":
      {
        const [cx, cy] = buffer;
        const r = extra.r;
        b[shape] = [cx - r, cy - r, cx + r, cy + r];
      }
      break;
    case "circle":
      {
        const [cx, cy, , rx] = buffer;
        const r = Math.abs(rx - cx);
        b[shape] = [cx - r, cy - r, cx + r, cy + r];
      }
      break;
    case "ellipse":
      {
        let [cx, cy, rx, , , , ry] = buffer;
        rx = Math.abs(rx - cx);
        ry = Math.abs(cy - ry);
        b[shape] = [cx - rx, cy - ry, cx + rx, cy + ry];
      }
      break;

    case "rect":
    case "image":
      {
        const [x1, y1, , , , , x3, y3] = buffer;
        b[shape] = [x1, y1, x3, y3];
      }
      break;

    case "text": {
      const {
        text,
        x,
        y,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        wordSpacing,
        textAnchor,
        alignmentBaseline,
        dominantBaseline,
      } = extra;

      b[shape] = calculateTextBBox(
        text,
        x,
        y,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        wordSpacing,
        textAnchor,
        alignmentBaseline,
        dominantBaseline,
      );
    }
    case "polyline":
    case "polygon":
    case "earcCurve":
    case "quadraticCurve":
    case "cubicCurve":
    case "arcCurve":
      {
        let minX = buffer[0];
        let minY = buffer[1];
        let maxX = buffer[0];
        let maxY = buffer[1];

        for (let i = 3; i < buffer.length; i += 3) {
          const x = buffer[i];
          const y = buffer[i + 1];

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        b[shape] = [minX, minY, maxX, maxY];
      }
      break;
  }
}

export function getBBoxMethod() {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      Object.keys(ctx.shapes).forEach((name) => {
        testEnv.shTest({
          testInfo: {
            description: "Testing .getBBox() method",
            module: "core",
            testType: "unit",
            element: name,
          },

          actions(api, ctx) {
            const shape = ctx.shapes[name];
            let extra: Record<string, any> = {};

            if (name === "point") {
              extra.r = shape.geometry.r;
            } else if (name === "text") {
              debugger;
              const { text, x, y } = shape.geometry;
              const {
                fontSize,
                fontWeight,
                fontStyle,
                letterSpacing,
                wordSpacing,
                textAnchor,
                alignmentBaseline,
                dominantBaseline,
              } = shape.style;

              extra = {
                text,
                x,
                y,
                fontSize,
                fontWeight,
                fontStyle,
                letterSpacing,
                wordSpacing,
                textAnchor,
                alignmentBaseline,
                dominantBaseline,
              };
            }
            generateBounds(name, shape.geometry.buffer, extra);
            console.warn(" shape ", name);
          },

          expect: {
            constraints: {
              save: true,
              oracle: { browser: false },
            },

            testSubject: name,

            validators: {
              bounds: {
                value: (bbox as any)[name],
                tolerance: 0.25,
                expectedStatus: "pass",

                validate(shape, { value = [], tolerance = 0 }) {
                  const matrix = shape.getBBox().matrix;

                  const actual = [
                    matrix[0][0],
                    matrix[0][1],
                    matrix[2][0],
                    matrix[2][1],
                  ];

                  const expected = value as number[];

                  const hasMismatch = actual.some(
                    (actualValue, index) =>
                      Math.abs(actualValue - expected[index]) > tolerance,
                  );

                  return hasMismatch ? "fail" : "pass";
                },
              },
            },
          },
        });
      });
    },
  });
}
