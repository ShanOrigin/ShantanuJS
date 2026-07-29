import shantanuJSTest, { Shape } from "../testingTool/shantanuJS-test.js";
import { initializeCanvasAndShapes } from "../data/initializeCanvasAndShapes.js";

export function hideMethod() {
  // Create test environment (MANDATORY: pass import.meta.url)
  const testEnv = new shantanuJSTest(import.meta.url);

  // Start environment
  testEnv.env({
    // --------------------------------------------------
    // INITIALIZE PHASE
    // --------------------------------------------------
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    // --------------------------------------------------
    // RUN PHASE (Test Execution Entry)
    // --------------------------------------------------
    run(ctx) {
      Object.keys(ctx.shapes).forEach((name) => {
        testEnv.shTest({
          // --------------------------------------------------
          // TEST METADATA (REQUIRED)
          // --------------------------------------------------
          testInfo: {
            description: "Testing .hide() method of shape",
            module: "core",
            testType: "unit",

            element: name,
          },

          setup(api, ctx) {
            ctx.shapes[name].attrs({ opacity: 1 });
          },
          // --------------------------------------------------
          // ACTIONS PHASE (Act)
          // --------------------------------------------------
          actions(api, ctx) {
            // Modify shape
            (ctx.shapes[name] as Shape).hide();
          },

          // --------------------------------------------------
          // EXPECT PHASE (Assert)
          // --------------------------------------------------
          expect: {
            constraints: { save: false, oracle: { browser: false } },
            // Target shapes (by key from ctx.shapes)
            testSubject: name,

            // -------- STYLE VALIDATION --------
            style: {
              attrs: {
                opacity: {
                  value: 0,
                  expectedStatus: "pass",
                },
              },
              notEqualTo: {
                opacity: {
                  value: 1,
                  expectedStatus: "pass",
                },
              },
            },
          },
        });
      });
    },
  });
}
