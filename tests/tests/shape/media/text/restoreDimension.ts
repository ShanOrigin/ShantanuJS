import ShantanuJSTestTool from "../../../../testingTool/shantanuJS-test.js";

export function restoreDimension(): void {
  const testEnv = new ShantanuJSTestTool(import.meta.url);

  testEnv.env({
    initialize(api, ctx) {
      const canvas = new api.Canvas({
        id: "testing",
        width: 500,
        height: 400,
      });

      ctx.canvas = canvas;
      ctx.shapes = {};

      const testCases = [
        {
          name: "start-hanging",
          x: 200,
          y: 150,
          textAnchor: "start",
          baseline: "hanging",
        },
        {
          name: "middle-middle",
          x: 200,
          y: 150,
          textAnchor: "middle",
          baseline: "middle",
        },
        {
          name: "end-bottom",
          x: 200,
          y: 150,
          textAnchor: "end",
          baseline: "bottom",
        },
        {
          name: "middle-baseline",
          x: 200,
          y: 150,
          textAnchor: "middle",
          baseline: "baseline",
        },
      ];

      testCases.forEach((testCase) => {
        const text = new api.Media.Text({
          x: testCase.x,
          y: testCase.y,
          text: "Queen",
          "font-size": 20,
          "text-anchor": testCase.textAnchor,
          "alignment-baseline": testCase.baseline,
        });

        canvas.add(text);
        ctx.shapes[testCase.name] = text;
      });
    },

    run(ctx) {
      Object.keys(ctx.shapes).forEach((name) => {
        const shape = ctx.shapes[name];

        testEnv.shTest({
          testInfo: {
            description: `Text restoreDimension preserves semantic coordinates: ${name}`,
            module: "shape/media/text",
            testType: "unit",
            element: "text",
          },

          actions() {},

          expect: {
            constraints: {
              save: true,
              oracle: {
                browser: false,
              },
            },

            testSubject: name,

            validators: {
              position: {
                value: {
                  x: 200,
                  y: 150,
                },
                tolerance: 0.05,
                expectedStatus: "pass",

                validate(shape, expected) {
                  const { x, y } = expected.value as { x: number; y: number };

                  const geometry = shape.geometry as {
                    x: number;
                    y: number;
                  };
                  const tolerance = expected.tolerance as number;
                  const xPass = Math.abs(geometry.x - x) <= tolerance;
                  const yPass = Math.abs(geometry.y - y) <= tolerance;

                  return xPass && yPass ? "pass" : "fail";
                },
              },
            },
          },
        });
      });
    },
  });
}
