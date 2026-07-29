import shantanuJSTest, { Shape } from "../testingTool/shantanuJS-test.js";
import { initializeCanvasAndShapes } from "../data/initializeCanvasAndShapes.js";

export function cloneMethod() {
  const testEnv = new shantanuJSTest(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      initializeCanvasAndShapes(api, ctx);
    },

    run(ctx) {
      Object.keys(ctx.shapes).forEach((name) => {
        testEnv.shTest({
          testInfo: {
            description: "Testing .clone() method",
            module: "core",
            testType: "unit",
            element: name,
          },

          actions() {},

          expect: {
            constraints: { save: false },

            testSubject: name,

            validators: {
              id: {
                value: (ctx.shapes[name] as Shape).style.id,
                expectedStatus: "pass",
                validate(shape, { value }) {
                  const clone = shape.clone();

                  ctx.canvas.add(clone);

                  const cloneIdData = (clone.style.id as string).split("-");
                  return cloneIdData[0] === value ? "pass" : "fail";
                },
              },
            },
          },
        });
      });
    },
  });
}
