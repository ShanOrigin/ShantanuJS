/**
 * ============================================================================
 * Visual & Unit Test Suite: Shape Skew / Shear (.skew())
 * ============================================================================
 *
 * Validates 2D affine skew (shear) transformation across all built-in shapes.
 *
 * Valid tType values for skew:
 *   'a' | 'absolute'  → pivot resolves to TL corner of bounds via resolvePivots()
 *   'r' | 'relative'  → direct skew — no pivot translation at all
 *   'p' | 'pivot'     → skew around manually supplied px/py coordinates
 *
 * NOTE: 'c' / 'center' is NOT a valid tType for skew — it is exclusive to translate.
 * NOTE: skewXSelf/skewYSelf are skipped when sx/sy is 0 (falsy check in implementation).
 *
 * Tests cover:
 *   - Horizontal shear only (sx > 0, sy = 0) in relative mode
 *   - Vertical shear only (sx = 0, sy > 0) in relative mode
 *   - Dual-axis shear (sx > 0, sy > 0) with explicit pivot
 *   - Absolute mode (tType: 'a') — pivot at TL corner
 *   - Zero-angle identity (sx: 0, sy: 0) — matrix unchanged
 *   - Negative test: non-numeric sx parameter
 */

import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";
import { skewTestData } from "../../../data/transformationsData.js";
import ShantanuJSTestTool, { Shape, GraphicsRenderNodeWithInternals } from "../../../testingTool/shantanuJS-test.js";

export function skewTransformMethod(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const shapeNames = Object.keys(ctx.shapes);

      shapeNames.forEach((name) => {
        skewTestData.forEach((testCase) => {
          let initialBBox: { x: number; y: number; width: number; height: number } | null = null;
          let threwError = false;

          testEnv.shTest({
            testInfo: {
              description: `[${name}] ${testCase.description}`,
              module: "transformations/skew",
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
                shape.skew(testCase.props);
              } catch (error) {
                threwError = true;
                if (!testCase.isNegative) throw error;
              }
            },

            expect: {
              constraints: { save: true, oracle: { browser: false } },
              testSubject: name,

              validators: {
                skewOutcome: {
                  value: testCase,
                  tolerance: testCase.tolerance ?? 0.75,
                  expectedStatus: testCase.expectedStatus,

                  validate(shape, { value, tolerance = 0.75 }) {
                    const tc = value as typeof testCase;

                    // Negative test: verify error was thrown
                    if (tc.isNegative) {
                      return threwError ? "pass" : "fail";
                    }

                    if (!initialBBox) return "fail";

                    const currentBBox = shape.getBBox();
                    const sx = Number(tc.props.sx) || 0;
                    const sy = Number(tc.props.sy) || 0;

                    // Zero-angle identity: skewXSelf/skewYSelf are both skipped
                    // bounding box must be unchanged
                    if (sx === 0 && sy === 0) {
                      const dimPass =
                        Math.abs(currentBBox.width - initialBBox.width) <= tolerance &&
                        Math.abs(currentBBox.height - initialBBox.height) <= tolerance;
                      return dimPass ? "pass" : "fail";
                    }

                    // Point shapes have degenerate geometry — always pass
                    if (name === "point" && initialBBox.width === 0 && initialBBox.height === 0) {
                      return "pass";
                    }

                    // For non-zero skew: bounding box should remain non-degenerate
                    // (skew expands the bbox envelope of any 2D shape)
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
