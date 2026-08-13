import shantanuJSTest, { Shape } from "../../../testingTool/shantanuJS-test.js";
import { initializeCanvasAndShapes } from "../../../data/initializeCanvasAndShapes.js";

export function toBackMethod() {
  const testEnv = new shantanuJSTest(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      let zIndex = 0;
      Object.keys(ctx.shapes).forEach((name) => {
        testEnv.shTest({
          testInfo: {
            description: "Testing .toBack() method of shape",
            module: "core",
            testType: "unit",
            element: name,
          },

          actions(api, ctx) {
            (ctx.shapes[name] as Shape).toBack();
          },

          expect: {
            constraints: { save: true, oracle: { browser: false } },
            testSubject: name,

            validators: {
              zIndex: {
                value: --zIndex,
                expectedStatus: "pass",

                validate(shape, { value }) {
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
