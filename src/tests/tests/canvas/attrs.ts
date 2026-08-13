// Import testing tool demo

import { height, width } from "happy-dom/lib/PropertySymbol.js";
import ShantanuJSTestTool from "../../testingTool/shantanuJS-test.js";

// Entry function (user-defined)
export function attrsCanvasMethod() {
  // Create test environment (MANDATORY: pass import.meta.url)
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  // Start environment
  testEnv.env({
    // --------------------------------------------------
    // INITIALIZE PHASE
    // --------------------------------------------------
    initialize(api, ctx) {
      // Create canvas
      const canvas = new api.Canvas({
        id: "testing",
        width: 200,
        height: 400,
        opacity: 0,
      });

      // Store in context (shared across phases)
      ctx.canvas = canvas;

      // Store shapes in context
      ctx.shapes = {};
      ctx.shapes.canvas = canvas;
    },

    // --------------------------------------------------
    // RUN PHASE (Test Execution Entry)
    // --------------------------------------------------
    run(ctx) {
      testEnv.shTest({
        // --------------------------------------------------
        // TEST METADATA (REQUIRED)
        // --------------------------------------------------
        testInfo: {
          description: "Canvas initialization",
          module: "system/canvas",
          testType: "unit",
          element: "canvas",
        },

        // --------------------------------------------------
        // SETUP PHASE (Arrange)
        // --------------------------------------------------
        // --------------------------------------------------
        // ACTIONS PHASE (Act)
        // --------------------------------------------------
        actions(api, ctx) {
          // Apply base styles
          ctx.canvas.attrs({
            fill: "green",
            stroke: "red",
            "stroke-width": 1,
            opacity: 1,
            x: 50,
            y: 20,
            width: 100,
            height: 200,
            "stroke-dasharray": "5 2",
          });
        },

        // --------------------------------------------------
        // EXPECT PHASE (Assert)
        // --------------------------------------------------
        expect: {
          constraints: { save: true, oracle: { browser: false } },
          // Target shapes (by key from ctx.shapes)
          testSubject: "canvas",

          // -------- STYLE VALIDATION --------
          style: {
            attrs: {
              id: { value: "testing-Canvas", expectedStatus: "pass" },
              fill: {
                value: "green",
                expectedStatus: "pass",
              },
              stroke: {
                value: "red",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 1,
                expectedStatus: "pass",
              },
              opacity: {
                value: 1,
                expectedStatus: "pass",
              },
            },

            notEqualTo: {
              id: { value: "testing-Canvas", expectedStatus: "fail" },
              fill: {
                value: "blue",
                expectedStatus: "pass",
              },
              stroke: {
                value: "green",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 5,
                expectedStatus: "pass",
              },
              opacity: {
                value: 0.5,
                expectedStatus: "pass",
              },
            },
          },

          // -------- GEOMETRY VALIDATION --------

          geometry: {
            equalTo: {
              shape: { value: "scene", expectedStatus: "pass" },
              x: {
                value: 50,
                expectedStatus: "pass",
              },
              y: {
                value: 20,
                expectedStatus: "pass",
              },
              width: {
                value: 100,
                expectedStatus: "pass",
              },
              height: {
                value: 200,
                expectedStatus: "pass",
              },
            },

            notEqualTo: {
              shape: { value: "scene", expectedStatus: "fail" },
              x: {
                value: 10,
                expectedStatus: "pass",
              },
              y: {
                value: 20,
                expectedStatus: "fail",
              },
              width: {
                value: 200,
                expectedStatus: "pass",
              },
              height: {
                value: 300,
                expectedStatus: "pass",
              },
            },
          },

          validators: {
            worldMatrix: {
              tolerance: 0.15,
              value: [1, 0, 0, 0, 1, 0, 0, 0, 1],
              expectedStatus: "pass",

              validate(shape, expected) {
                const actual = [...shape.geometry.worldMatrix];

                const { value, tolerance = 0 } = expected as {
                  value: number[];
                  tolerance: number;
                };

                const hasMismatch = value.some(
                  (element, i) => Math.abs(element - actual[i]) > tolerance,
                );

                return hasMismatch ? "fail" : "pass";
              },
            },
          },

          // -------- ERROR VALIDATION (optional) --------
          error: {
            expected: new Error("Expected error"),
            expectedStatus: "pass",
          },
        },
      });
    },
  });
}
