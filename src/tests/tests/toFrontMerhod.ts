import shantanuJSTest from "../testingTool/shantanuJS-test.js";
import { initializeCanvasAndShapes } from "../data/initializeCanvasAndShapes.js";

export function toFrontMethod() {
  const testEnv = new shantanuJSTest(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      const keys = Object.keys(ctx.shapes);
      let zIndex = keys.length;
      keys.forEach((name) => {
        testEnv.shTest({
          testInfo: {
            description: "Testing .toFront() method of shape",
            module: "core",
            testType: "unit",
            element: name,
          },

          actions(api, ctx) {
            ctx.shapes[name].toFront();
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              zIndex: {
                value: ++zIndex,
                expectedStatus: "pass",

                validate(shape, { tolerance, value }) {
                  return shape.geometry["zIndex"] === value ? "pass" : "fail";
                },
              },
            },
          },
        });
      });
    },
  });
}
