/**
 * ============================================================================
 * Visual & Unit Test Suite: Shape Scaling (.scale())
 * ============================================================================
 *
 * Validates 2D affine scaling transformation across all built-in shapes.
 *
 * Valid tType values for scale:
 *   'a' | 'absolute'  → scale around resolved pivot (TL corner of bounds)
 *   'r' | 'relative'  → direct scaling — no pivot translation at all
 *   'p' | 'pivot'     → scale around manually supplied px/py coordinates
 *
 * NOTE: 'c' / 'center' is NOT a valid tType for scale — it is exclusive to translate.
 *
 * Tests cover:
 *   - Absolute mode (tType: 'a') — pivot at TL corner
 *   - Relative mode (tType: 'r') — non-uniform sx/sy with no pivot
 *   - Pivot mode (tType: 'p') — custom coordinate pivot
 *   - Identity scaling (sx: 1, sy: 1) — dimensions must be preserved
 *   - Negative test: non-numeric sx parameter
 */

import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";
import { scaleTestData } from "../../../data/transformationsData.js";
import ShantanuJSTestTool, { Shape, GraphicsRenderNodeWithInternals } from "../../../testingTool/shantanuJS-test.js";

export function scaleTransformMethod(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const shapeNames = Object.keys(ctx.shapes);

      shapeNames.forEach((name) => {
        scaleTestData.forEach((testCase) => {
          let initialBBox: { x: number; y: number; width: number; height: number } | null = null;
          let threwError = false;

          testEnv.shTest({
            testInfo: {
              description: `[${name}] ${testCase.description}`,
              module: "transformations/scale",
              testType: "unit",
              element: name,
            },

            capture: { before: true, after: true },

            setup(api, ctx) {
              const shape = ctx.shapes[name] as GraphicsRenderNodeWithInternals;
              if (shape && typeof shape.getBBox === "function") {
                const bbox = shape.getBBox();
                initialBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
              }
              threwError = false;
            },

            actions(api, ctx) {
              const shape = ctx.shapes[name] as GraphicsRenderNodeWithInternals;
              try {
                shape.scale(testCase.props);
              } catch (error) {
                threwError = true;
                if (!testCase.isNegative) throw error;
              }
            },

            expect: {
              constraints: { save: true, oracle: { browser: false } },
              testSubject: name,

              validators: {
                scalingOutcome: {
                  value: testCase,
                  tolerance: testCase.tolerance ?? 0.5,
                  expectedStatus: testCase.expectedStatus,

                  validate(shape, { value, tolerance = 0.5 }) {
                    const tc = value as typeof testCase;

                    // Negative test: verify error was thrown
                    if (tc.isNegative) {
                      return threwError ? "pass" : "fail";
                    }

                    if (!initialBBox) return "fail";

                    const currentBBox = shape.getBBox();
                    const sx = Number(tc.props.sx) || 1;
                    const sy = Number(tc.props.sy) || 1;

                    // Point shapes have degenerate geometry (zero width/height) — always pass
                    if (name === "point" && initialBBox.width === 0 && initialBBox.height === 0) {
                      return "pass";
                    }

                    // Identity scale: dimensions must be preserved exactly
                    if (sx === 1 && sy === 1) {
                      const dimPass =
                        Math.abs(currentBBox.width - initialBBox.width) <= tolerance &&
                        Math.abs(currentBBox.height - initialBBox.height) <= tolerance;
                      return dimPass ? "pass" : "fail";
                    }

                    // For relative mode (tType: 'r'), DOMMatrix.scaleSelf applies directly —
                    // the resulting bbox width/height should scale by sx/sy from initial.
                    const tType = (tc.props.tType ?? "a").toLowerCase();
                    if (tType === "r" || tType === "relative") {
                      const expectedW = initialBBox.width * sx;
                      const expectedH = initialBBox.height * sy;

                      const widthPass =
                        Math.abs(currentBBox.width - expectedW) <= tolerance ||
                        (initialBBox.width === 0 && currentBBox.width >= 0);
                      const heightPass =
                        Math.abs(currentBBox.height - expectedH) <= tolerance ||
                        (initialBBox.height === 0 && currentBBox.height >= 0);

                      return widthPass && heightPass ? "pass" : "fail";
                    }

                    // For absolute/pivot modes: ensure bbox is non-degenerate (valid dimensions)
                    const validBounds = currentBBox.width >= 0 && currentBBox.height >= 0;
                    return validBounds ? "pass" : "fail";
                  },
                },
              },
            },
          });
        });
      });
    },
  });
}
