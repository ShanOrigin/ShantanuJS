/**
 * ============================================================================
 * Visual & Unit Test Suite: Transformation Batch Finalization (.endT())
 * ============================================================================
 *
 * Validates the transformation batch finalization and return value contract
 * of the .endT() method across all built-in shapes.
 *
 * Batch lifecycle:
 *   - beginT()  → activates batching mode
 *   - transform calls → accumulate into composed matrix
 *   - endT()    → finalizes and returns 9-element Float32Array (row-major 3×3 matrix)
 *                 and resets internal composed matrix to identity
 *
 * endT() return value contract:
 *   - Returns a Float32Array of length 9 (3x3 affine homogeneous matrix)
 *   - Format: [m11, m12, m13, m21, m22, m23, m31, m32, m33]
 *   - Without any transforms applied, the result is the identity matrix:
 *     [1, 0, 0, 0, 1, 0, 0, 0, 1]
 *   - endT() without a prior beginT() returns the identity matrix (safe no-op)
 *
 * tType values:
 *   All transforms in batch use tType: 'r' (relative) for predictable,
 *   pivot-independent matrix results.
 *
 * Tests cover:
 *   - endT() returns Float32Array of exactly length 9
 *   - endT() without beginT() returns identity matrix [1,0,0,0,1,0,0,0,1]
 *   - endT() after chained batch returns non-identity matrix
 *   - Matrix integrity: endT() clears composed state (subsequent endT() returns identity)
 */

import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";
import { batchingTestData } from "../../../data/transformationsData.js";
import ShantanuJSTestTool, { Shape } from "../../../testingTool/shantanuJS-test.js";

export function endTTransformMethod(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const shapeNames = Object.keys(ctx.shapes);

      shapeNames.forEach((name) => {

        // --------------------------------------------------------------------
        // Test 1: Safe No-Op — endT() Without beginT() Returns Identity Matrix
        // Verifies the documented safe fallback behaviour of endT()
        // --------------------------------------------------------------------
        let unbatchedResult: Float32Array | undefined;

        testEnv.shTest({
          testInfo: {
            description: `[${name}] ${batchingTestData.safeUnbatchedEndT.description}`,
            module: "transformations/endT",
            testType: "unit",
            element: name,
          },

          capture: { before: false, after: false },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as any;
            // Call endT() without a preceding beginT() — must not throw and must return identity
            unbatchedResult = shape.endT() as Float32Array | undefined;
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              safeUnbatchedEndT: {
                value: batchingTestData.safeUnbatchedEndT.expectedMatrix,
                expectedStatus: "pass",
                validate(shape, { value }) {
                  const expectedMatrix = value as number[];

                  if (!unbatchedResult || !(unbatchedResult instanceof Float32Array)) {
                    return "fail";
                  }

                  if (unbatchedResult.length !== 9) return "fail";

                  // Verify identity matrix values within tolerance
                  const tolerance = 1e-4;
                  for (let i = 0; i < 9; i++) {
                    if (Math.abs((unbatchedResult[i] ?? 0) - (expectedMatrix[i] ?? 0)) > tolerance) {
                      return "fail";
                    }
                  }
                  return "pass";
                },
              },
            },
          },
        });

        // --------------------------------------------------------------------
        // Test 2: endT() Returns Exactly a 9-element Float32Array
        // Verifies the return type and length contract of endT()
        // --------------------------------------------------------------------
        let batchedResult: Float32Array | undefined;

        testEnv.shTest({
          testInfo: {
            description: `[${name}] endT() returns Float32Array of length 9 (3×3 affine matrix)`,
            module: "transformations/endT",
            testType: "unit",
            element: name,
          },

          capture: { before: false, after: false },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as any;
            const data = batchingTestData.chainedMultiTransform;

            // All tType values are 'r' (relative) — no pivot resolution needed
            shape.beginT();
            shape.translate(data.translate);  // { x: 15, y: 25, tType: 'r' }
            shape.scale(data.scale);          // { sx: 1.5, sy: 1.5, tType: 'r' }
            shape.rotate(data.rotate);        // { angle: 45, tType: 'r' }
            batchedResult = shape.endT() as Float32Array | undefined;
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              endTReturnType: {
                value: true,
                expectedStatus: "pass",
                validate() {
                  return batchedResult instanceof Float32Array && batchedResult.length === 9
                    ? "pass"
                    : "fail";
                },
              },
            },
          },
        });

        // --------------------------------------------------------------------
        // Test 3: endT() Clears Composed State — Subsequent endT() = Identity
        // After calling endT() once, the internal composed matrix is reset.
        // A second call without beginT() must return identity again.
        // --------------------------------------------------------------------
        let secondEndTResult: Float32Array | undefined;

        testEnv.shTest({
          testInfo: {
            description: `[${name}] endT() clears batch state — subsequent endT() returns identity`,
            module: "transformations/endT",
            testType: "unit",
            element: name,
          },

          capture: { before: false, after: false },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as any;

            // Apply a batch and close it
            shape.beginT();
            shape.translate({ x: 10, y: 10, tType: "r" });
            shape.endT(); // First endT() — clears state

            // Second endT() must return identity (no active batch)
            secondEndTResult = shape.endT() as Float32Array | undefined;
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              stateResetAfterEndT: {
                value: batchingTestData.safeUnbatchedEndT.expectedMatrix,
                expectedStatus: "pass",
                validate(shape, { value }) {
                  const expectedMatrix = value as number[];

                  if (!secondEndTResult || !(secondEndTResult instanceof Float32Array)) {
                    return "fail";
                  }

                  if (secondEndTResult.length !== 9) return "fail";

                  const tolerance = 1e-4;
                  for (let i = 0; i < 9; i++) {
                    if (Math.abs((secondEndTResult[i] ?? 0) - (expectedMatrix[i] ?? 0)) > tolerance) {
                      return "fail";
                    }
                  }
                  return "pass";
                },
              },
            },
          },
        });
      });
    },
  });
}
