import shantanuJSTest from "../testingTool/shantanuJS-test.js";
import { initializeCanvasAndShapes } from "../data/initializeCanvasAndShapes.js";

export function showMethod() {
  const testEnv = new shantanuJSTest(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      Object.keys(ctx.shapes).forEach((name) => {
        testEnv.shTest({
          testInfo: {
            description: "Testing .show() method of shape",
            module: "core",
            testType: "unit",
            element: name,
          },

          setup(api, ctx) {
            ctx.shapes[name].attrs({ opacity: 0 });
          },

          actions(api, ctx) {
            ctx.shapes[name].show();
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            style: {
              attrs: {
                opacity: {
                  value: 1,
                  expectedStatus: "pass",
                },
              },

              notEqualTo: {
                opacity: {
                  value: 0,
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
