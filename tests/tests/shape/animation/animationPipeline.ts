// ============================================================================
// Animation Pipeline Regression Test
// ============================================================================


import ShantanuJSTestTool, {
  Shape,
} from "../../../testingTool/shantanuJS-test.js";

// ============================================================================
// TEST ENTRY POINT
// ============================================================================

export function animationPipeline(): void {
  // --------------------------------------------------------------------------
  // CREATE TEST ENVIRONMENT
  // --------------------------------------------------------------------------

  const testEnv = new ShantanuJSTestTool(import.meta.url);

  // --------------------------------------------------------------------------
  // INITIALIZE TEST ENVIRONMENT
  // --------------------------------------------------------------------------

  testEnv.env({
    initialize(api, ctx) {
      const canvas = new api.Canvas({
        id: "testing",
        width: 400,
        height: 300,
      });

      ctx.canvas = canvas;
      ctx.custom = {};
    },

    // ------------------------------------------------------------------------
    // RUN PHASE
    // ------------------------------------------------------------------------

    run(ctx) {
     return testEnv.shTest({
        // ====================================================================
        // TEST METADATA
        // ====================================================================

        testInfo: {
          description:
            "Verify that starting a translation animation updates the shape transformation pipeline",
          module: "animation",
          testType: "unit",
          element: "rectangle",
        },

        // ====================================================================
        // STATE CAPTURE
        // ====================================================================

        capture: {
          before: true,
          after: true,
        },

        // ====================================================================
        // SETUP PHASE — ARRANGE
        // ====================================================================

        setup(api, ctx) {
          const rectangle = new api.Shapes.Rect({
            x: 20,
            y: 40,
            width: 50,
            height: 40,
          });

          ctx.canvas.add(rectangle);

          ctx.shapes = {
            rectangle,
          };

          // ----------------------------------------------------------------
          // Animation lifecycle state
          // ----------------------------------------------------------------
          if (!ctx.custom) {
            ctx.custom = {};
          }
          ctx.custom.animationStarted = false;
          ctx.custom.animationCompleted = false;

          // ----------------------------------------------------------------
          // Create animation.
          //
          // Only translation is used intentionally. This keeps the regression
          // focused on the animation pipeline rather than physics, curves,
          // pivots, or animation controls.
          // ----------------------------------------------------------------

          ctx.custom.animation = rectangle.animation({
            attrs: {
              translate: {
                x: 100,
                y: 50,
              },
            },

            advanceOptions :{
        physics: { speed: 1, enabled: true },
        curve: { enabled: true, path: "linear", samples: 100, curvature: 1 },
        controls: {
          direction: "normal",
          optimizationTechnique: "fitPolynomialCoefficient",
        },
        pivots:{ mode : "c"}
      
            },

            duration: 1000,

            onComplete() {
              ctx.custom!.animationCompleted = true;
            },
          });
        },

        // ====================================================================
        // ACTIONS PHASE — ACT
        // ====================================================================

        actions(api, ctx) {
          // --------------------------------------------------------------
          // The animation is explicitly started so the test covers the
          // animation() -> start() pipeline.
          // --------------------------------------------------------------

          ctx.custom!.animationStarted = true;

          (ctx.custom as any).animation.start();
        },

        async :{
            afterAction : {
                waitTime : 1500
            }
        } ,

        // ====================================================================
        // EXPECT PHASE — ASSERT
        // ====================================================================

        expect: {
          // ------------------------------------------------------------------
          // EXPECTATION CONSTRAINTS
          // ------------------------------------------------------------------

          constraints: {
            save:true ,

            oracle: {
              browser: false,
              library: true,
            },
          },

          // ------------------------------------------------------------------
          // TEST SUBJECT
          // ------------------------------------------------------------------

          testSubject: "rectangle",

          // ------------------------------------------------------------------
          // CUSTOM VALIDATORS
          // ------------------------------------------------------------------

          validators: {
            // --------------------------------------------------------------
            // Verify that the animation lifecycle was entered.
            // --------------------------------------------------------------

            animation: {
              value: true,
              expectedStatus: "pass",

              validate(shape, expected) {


                
                if (ctx.custom?.animationCompleted === true) {
                  return "pass";
                }
                return "fail";
              },
            },

            // --------------------------------------------------------------
            // Verify that the shape's bounds represents the translated
            // position.
            //
            // Original rectangle:
            //
            // x = 20
            // y = 40
            // width = 50
            // height = 40
            //
            // Translation:
            //
            // x = +100
            // y = +50
            //
            // Expected:
            //
            // x = 120
            // y = 90
            // x2 = 170
            // y2 = 130
            // --------------------------------------------------------------

            bounds: {
              tolerance: 0.5,

              value: [120, 90, 170, 130],

              expectedStatus: "pass",

              validate(shape, expected) {
                const bounds = shape?.geometry?.bounds as Float32Array;

                if (!bounds || bounds.length < 4) {
                  return "fail";
                }

                const [x1, y1, x2, y2] = bounds;

                const actual = [x1, y1, x2, y2];

                const { value, tolerance = 0 } = expected as {
                  value: number[];
                  tolerance: number;
                };

                const hasMismatch = value.some(
                  (expectedValue: number, index: number) =>
                    Math.abs(expectedValue - actual[index]) > tolerance,
                );

                return hasMismatch ? "fail" : "pass";
              },
            },
          },
        },
      });
    },
  });
}
