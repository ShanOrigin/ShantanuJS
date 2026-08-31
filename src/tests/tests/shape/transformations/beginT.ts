/**
 * ============================================================================
 * Visual & Unit Test Suite: Transformation Batching Start (.beginT())
 * ============================================================================
 *
 * Validates the transformation batching lifecycle activation across all built-in shapes.
 *
 * Batch mode:
 *   - beginT()  → activates batching; subsequent transform calls accumulate into
 *                 an internal DOMMatrix (#composedMatrix) without finalization
 *   - endT()    → finalizes the batch, returns a 9-element Float32Array (3×3 matrix)
 *                 and resets the composed matrix
 *   - Calling beginT() while already batching throws OperationInProgressError
 *
 * tType values in batch data:
 *   All transforms in the batch use tType: 'r' (relative) to avoid any dependency
 *   on shape-specific bound resolution (resolvePivots) for predictable results.
 *
 * Tests cover:
 *   - Batch activation and fluent method chaining (beginT() returns shape itself)
 *   - Chained translate → scale → rotate in a single batch
 *   - Negative test: nested/duplicate beginT() call throws OperationInProgressError
 */

import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";
import { batchingTestData } from "../../../data/transformationsData.js";
import ShantanuJSTestTool, { Shape, GraphicsRenderNodeWithInternals } from "../../../testingTool/shantanuJS-test.js";

export function beginTTransformMethod(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const shapeNames = Object.keys(ctx.shapes);

      shapeNames.forEach((name) => {

        // --------------------------------------------------------------------
        // Test 1: Batch Activation & Fluent Method Chaining
        // Verifies that .beginT() returns the shape instance itself (enables chaining)
        // --------------------------------------------------------------------
        let chainReturnedSelf = false;

        testEnv.shTest({
          testInfo: {
            description: `[${name}] Batch Activation — beginT() returns shape for chaining`,
            module: "transformations/beginT",
            testType: "unit",
            element: name,
          },

          capture: { before: true, after: true },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as Shape;
            const shapeRef = shape as any;

            // beginT() must return the shape (same reference) to enable fluent chaining
            const result = shapeRef.beginT();
            chainReturnedSelf = result === shape;

            // Apply one queued transform then close to leave shape in clean state
            shapeRef.translate({ x: 10, y: 10, tType: "r" });
            shapeRef.endT();
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              beginTChaining: {
                value: true,
                expectedStatus: "pass",
                validate() {
                  return chainReturnedSelf ? "pass" : "fail";
                },
              },
            },
          },
        });

        // --------------------------------------------------------------------
        // Test 2: Chained Multi-Transform Batch (translate → scale → rotate)
        // Verifies that multiple transforms accumulate and the final bbox is valid
        // after the batch is applied via endT()
        // --------------------------------------------------------------------
        testEnv.shTest({
          testInfo: {
            description: `[${name}] ${batchingTestData.chainedMultiTransform.description}`,
            module: "transformations/beginT",
            testType: "unit",
            element: name,
          },

          capture: { before: true, after: true },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as any;
            const data = batchingTestData.chainedMultiTransform;

            // All tType values are 'r' (relative) — no pivot resolution needed
            shape
              .beginT()
              .translate(data.translate)
              .scale(data.scale)
              .rotate(data.rotate)
              .endT();
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              batchedTransformResult: {
                value: true,
                expectedStatus: "pass",
                validate(shape) {
                  const bbox = shape.getBBox();
                  return bbox.width >= 0 && bbox.height >= 0 ? "pass" : "fail";
                },
              },
            },
          },
        });

        // --------------------------------------------------------------------
        // Test 3 (Negative): Nested beginT() Throws OperationInProgressError
        // Verifies that calling beginT() a second time while a batch is active
        // throws an OperationInProgressError
        // --------------------------------------------------------------------
        let nestedBatchThrew = false;

        testEnv.shTest({
          testInfo: {
            description: `[${name}] ${batchingTestData.nestedBatchError.description}`,
            module: "transformations/beginT",
            testType: "unit",
            element: name,
          },

          capture: { before: false, after: false },

          actions(api, ctx) {
            const shape = ctx.shapes[name] as any;
            nestedBatchThrew = false;

            try {
              shape.beginT();
              // Second call while batch is already active — must throw
              shape.beginT();
            } catch (_error) {
              nestedBatchThrew = true;
            } finally {
              // Always close batch to leave shape in clean state
              try { shape.endT(); } catch (_) { }
            }
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              nestedBeginTRejection: {
                value: true,
                expectedStatus: "pass",
                validate() {
                  return nestedBatchThrew ? "pass" : "fail";
                },
              },
            },
          },
        });
      });
    },
  });
}
