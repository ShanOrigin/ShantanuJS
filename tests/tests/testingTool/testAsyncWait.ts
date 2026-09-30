import ShantanuJSTest from "../../testingTool/shantanuJS-test.js";

export async function testAsyncWait(): Promise<void> {
  const testEnv = new ShantanuJSTest(import.meta.url);

  const startTime = Date.now();

  await testEnv.env({
    // ================================================================
    // Initialization
    // ================================================================

    async: {
      waitTime: 200,
    },

    initialize(api, ctx) {
      // initialize() itself should execute immediately.
      if (Date.now() - startTime > 100) {
        throw new Error("Initialize ran too late");
      }

      ctx.canvas = new api.Canvas({
        id: "testing",
        width: 100,
        height: 100,
      });

      ctx.shapes = {};
      ctx.custom = {
        initialized: true,
      };
    },

    // ================================================================
    // Run
    // ================================================================

    async run(ctx) {
      // --------------------------------------------------------------
      // Test 1: Initialization Wait
      // --------------------------------------------------------------

      const initializationElapsed = Date.now() - startTime;

      if (initializationElapsed < 150) {
        throw new Error("Run ran too early: " + initializationElapsed);
      }

      ctx.custom!.runAt = initializationElapsed;

      // --------------------------------------------------------------
      // Test 2: beforeAction Wait
      // --------------------------------------------------------------

      await testEnv.shTest({
        testInfo: {
          description: "beforeAction wait",
          module: "test",
          testType: "async",
        },

        async: {
          beforeAction: {
            waitTime: 200,
          },
        },

        setup(api, ctx) {
          ctx.shapes.line = new api.Shapes.Line({
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10,
          });

          ctx.canvas.add(ctx.shapes.line);

          const elapsed = Date.now() - startTime;

          // beforeAction wait has not happened yet.
          if (elapsed < 150) {
            throw new Error("Setup ran too early: " + elapsed);
          }
        },

        actions(api, ctx) {
          const elapsed = Date.now() - startTime;

          // At least the initialization wait + beforeAction wait
          // should have elapsed.
          if (elapsed < 350) {
            throw new Error("Actions ran too early: " + elapsed);
          }

          ctx.custom!.beforeActionCompleted = elapsed;
        },

        expect: {
          // ------------------------------------------------------------------
          // EXPECTATION CONSTRAINTS
          // ------------------------------------------------------------------

          constraints: {
            save: true,

            oracle: {
              browser: false,
              library: true,
            },
          },
          testSubject: "line",

          validators: {
            customValidator: {
              value: 1,
              expectedStatus: "pass",

              validate() {
                return "pass";
              },
            },
          },
        },
      });

      // --------------------------------------------------------------
      // Test 3: afterAction Wait
      // --------------------------------------------------------------

      await testEnv.shTest({
        testInfo: {
          description: "afterAction wait",
          module: "test",
          testType: "async",
        },

        async: {
          afterAction: {
            waitTime: 200,
          },
        },

        setup() {
          // setup
        },

        actions() {
          const elapsed = Date.now() - startTime;

          // No additional wait should have happened before actions.
          if (elapsed < 350) {
            throw new Error("Actions ran too early: " + elapsed);
          }

          ctx.custom!.afterActionStarted = elapsed;
        },

        expect: {
          testSubject: "line",

          validators: {
            customValidator: {
              value: 1,
              expectedStatus: "pass",

              validate() {
                const elapsed = Date.now() - startTime;

                // The afterAction wait should now have occurred.
                if (elapsed < 550) {
                  throw new Error("Expect ran too early: " + elapsed);
                }

                return "pass";
              },
            },
          },
        },
      });
    },
  });
}
