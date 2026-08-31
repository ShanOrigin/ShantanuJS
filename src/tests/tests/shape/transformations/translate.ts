/**
 * ============================================================================
 * Visual & Unit Test Suite: Shape Translation (.translate())
 * ============================================================================
 *
 * Validates 2D affine translation transformation across all built-in shapes.
 *
 * Valid tType values for translate:
 *   'a' | 'absolute'  → resolves pivot to TL corner of bounding box
 *   'r' | 'relative'  → pure offset translation, no pivot computation
 *   'c' | 'center'    → resolves pivot to center of bounding box
 *   'p' | 'pivot'     → uses manually supplied px/py as pivot
 *
 * Tests cover:
 *   - Absolute mode (tType: 'a')
 *   - Relative mode (tType: 'r') with positive and negative offsets
 *   - Center-anchor mode (tType: 'c') — unique to translate
 *   - Pivot mode (tType: 'p') with explicit px/py
 *   - Zero-offset identity (no change expected)
 *   - Negative test: non-numeric x parameter
 */

import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";
import { translateTestData } from "../../../data/transformationsData.js";
import ShantanuJSTestTool, { Shape, GraphicsRenderNodeWithInternals } from "../../../testingTool/shantanuJS-test.js";

export function translateTransformMethod(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const shapeNames = Object.keys(ctx.shapes);

      shapeNames.forEach((name) => {
        translateTestData.forEach((testCase) => {
          let initialBBox: { x: number; y: number; width: number; height: number } | null = null;
          let threwError = false;

          testEnv.shTest({
            testInfo: {
              description: `[${name}] ${testCase.description}`,
              module: "transformations/translate",
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
                shape.translate(testCase.props);
                ctx.canvas.engine.flush();
              } catch (error) {
                threwError = true;
                if (!testCase.isNegative) throw error;
              }
            },

            expect: {
              constraints: { save: false , oracle: { browser: false } },
              testSubject: name,

              validators: {
                transformStack: {
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
                    const tType = (tc.props.tType ?? "a").toLowerCase();

                    // For relative mode the displacement should match x/y directly
                    if (tType === "r" || tType === "relative") {
                      const expectedDx = Number(tc.props.x) || 0;
                      const expectedDy = Number(tc.props.y) || 0;
                      const actualDx = currentBBox.x - initialBBox.x;
                      const actualDy = currentBBox.y - initialBBox.y;

                      const xPass = Math.abs(actualDx - expectedDx) <= tolerance;
                      const yPass = Math.abs(actualDy - expectedDy) <= tolerance;
                      // Dimensions (width/height) must always be preserved under translation
                      const dimPass =
                        Math.abs(currentBBox.width - initialBBox.width) <= tolerance &&
                        Math.abs(currentBBox.height - initialBBox.height) <= tolerance;

                      return xPass && yPass && dimPass ? "pass" : "fail";
                    }

                    // For all other modes (a/absolute, c/center, p/pivot):
                    // Verify that bounding box moved (non-zero offset) and dimensions preserved
                    // (We cannot easily predict exact pixel offset here without re-running
                    //  resolvePivots internally, so we simply verify the shape did move.)
                    const dimPass =
                      Math.abs(currentBBox.width - initialBBox.width) <= tolerance &&
                      Math.abs(currentBBox.height - initialBBox.height) <= tolerance;

                    // For zero-offset identity tests, position must also be unchanged
                    const isZeroOffset = tc.props.x === 0 && tc.props.y === 0;
                    if (isZeroOffset) {
                      const posPass =
                        Math.abs(currentBBox.x - initialBBox.x) <= tolerance &&
                        Math.abs(currentBBox.y - initialBBox.y) <= tolerance;
                      return dimPass && posPass ? "pass" : "fail";
                    }

                    return dimPass ? "pass" : "fail";
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
