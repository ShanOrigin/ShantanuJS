// Import testing tool demo

import { shapeGeometry } from "../../data/initializeCanvasAndShapes.js";
import ShantanuJSTestTool from "../../testingTool/shantanuJS-test.js";

// Entry function (user-defined)
export function containsCanvasMethod() {
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
        width: 420,
        height: 560,
        opacity: 0,
      });

      canvas.attrs({
        fill: "#b3faff",
        stroke: "red",
        "stroke-width": 1,
        opacity: 1,
        x: 50,
        y: 20,
      });

      // Store in context (shared across phases)
      ctx.canvas = canvas;

      // Store shapes in context
      ctx.shapes = {};
    },

    // --------------------------------------------------
    // RUN PHASE (Test Execution Entry)
    // --------------------------------------------------
    run(ctx) {
      let sh!: any;
      const shapesData = Object.entries(shapeGeometry);
      shapesData.forEach(([name, data]) => {
        testEnv.shTest({
          // --------------------------------------------------
          // TEST METADATA (REQUIRED)
          // --------------------------------------------------
          testInfo: {
            description: `Canvas .contains( ${name} ) method testing`,
            module: "system/canvas",
            testType: "unit",
            element: name,
          },

          capture: { after: false, before: false },
          setup(api, ctx) {
            const s = name[0].toUpperCase() + name.slice(1);

            if (s == "Text") {
              sh = new api.Media.Text({
                ...data,
                text: "Queen",
              });
            } else if (s == "Image") {
              sh = new api.Media.Image({
                ...data,
                href: "../../../../deps.png",
              });
            } else {
              sh = new (api.Shapes as any)[s]({
                ...data,
              });
            }

            ctx.shapes[name] = sh;
          },
          actions(api, ctx) {
            // Apply base styles
            ctx.canvas.add(sh);
          },

          // --------------------------------------------------
          // EXPECT PHASE (Assert)
          // --------------------------------------------------
          expect: {
            constraints: { save: true, oracle: { browser: false } },
            // Target shapes (by key from ctx.shapes)
            testSubject: name,
            validators: {
              id: {
                value: "",
                expectedStatus: "pass",

                validate(shape, expected) {
                  const index = ctx.canvas.contains(shape);
                  return index ? "pass" : "fail";
                },
              },
            },
          },
        });
      });
    },
  });
}
