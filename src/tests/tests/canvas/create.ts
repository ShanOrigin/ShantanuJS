// Import testing tool demo

import ShantanuJSTestTool from "../../testingTool/shantanuJS-test";

// Entry function (user-defined)
export function createCanvas() {
  // Create test environment (MANDATORY: pass import.meta.url)
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  // Start environment
  testEnv.env({
    // --------------------------------------------------
    // INITIALIZE PHASE
    // --------------------------------------------------
    initialize(api, ctx) {
      // Create canvas
      const canvas = new api.Canvas({ id: "testing", width: 200, height: 400 });

      // Apply base styles
      canvas.attrs({
        fill: "green",
        stroke: "red",
        "stroke-width": 0,
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
          description: "Update stroke color of a line",
          module: "shapes",
          testType: "unit",
          element: "line",
        },

        // --------------------------------------------------
        // SETUP PHASE (Arrange)
        // --------------------------------------------------
        // --------------------------------------------------
        // ACTIONS PHASE (Act)
        // --------------------------------------------------
        actions(api, ctx) {
          // Modify shape
          ctx.shapes.line.attrs({
            stroke: "blue",
          });

          console.log(ctx.shapes.line);
        },

        // --------------------------------------------------
        // EXPECT PHASE (Assert)
        // --------------------------------------------------
        expect: {
          constraints: { save: true, oracle: { browser: false } },
          // Target shapes (by key from ctx.shapes)
          testSubject: "line",

          // -------- STYLE VALIDATION --------
          style: {
            attrs: {
              stroke: {
                value: "blue",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 3,
                expectedStatus: "pass",
              },
            },
            notEqualTo: {
              stroke: {
                value: "red",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 2,
                expectedStatus: "fail",
              },
            },
          },

          validators: {
            buffer: {
              tolerance: 0.5,
              value: [20, 40, 50, 40],
              expectedStatus: "pass",
              validate(shape, expected) {
                const [x1, y1, , x2, y2] = shape.geometry.buffer; // Correctly destructuring the needed indices
                const actual = [x1, y1, x2, y2];
                const { value, tolerance = 0 } = expected as {
                  value: number[];
                  tolerance: number;
                };

                // Use .some() instead of .any(), fix type warnings, and use valid ternary syntax
                const hasMismatch = value.some(
                  (element: number, i: number) =>
                    Math.abs(element - actual[i]) > tolerance,
                );

                return hasMismatch ? "fail" : "pass";
              },
            },
          },

          // -------- GEOMETRY VALIDATION --------
          geometry: {
            equalTo: {},
            greaterThan: {},
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
