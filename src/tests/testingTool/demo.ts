// Import testing tool
import shantanuJSTest from './shantanuJSTest.js';

// Entry function (user-defined)
export function runTests() {
  // Create test environment (MANDATORY: pass import.meta.url)
  const testEnv = new shantanuJSTest(import.meta.url);

  // Start environment
  testEnv.env({
    // --------------------------------------------------
    // INITIALIZE PHASE
    // --------------------------------------------------
    initialize(api, ctx) {
      // Create canvas
      const canvas = new api.Canvas('testing', 250, 400, 'svg');

      // Apply base styles
      canvas.attrs({
        fill: 'green',
        stroke: 'red',
        'stroke-width': 0
      });

      // Store in context (shared across phases)
      ctx.canvas = canvas;
    },

    // --------------------------------------------------
    // RUN PHASE (Test Execution Entry)
    // --------------------------------------------------
    run(ctx) {
      testEnv.visualTest({
        // --------------------------------------------------
        // TEST METADATA (REQUIRED)
        // --------------------------------------------------
        testInfo: {
          description: 'Update stroke color of a line',
          module: 'shapes',
          testType: 'unit',
          element: 'line'
        },

        // --------------------------------------------------
        // SETUP PHASE (Arrange)
        // --------------------------------------------------
        setup(api, ctx) {
          const rectangle = new api.Shapes.Basic.Rect(20, 40, 50, 80);
          ctx.canvas.addTo(rectangle);

          rectangle.attrs({
            stroke: 'purple',
            'stroke-width': 2
          });

          const line = new api.Shapes.Basic.Line(20, 40, 50, 40);
          ctx.canvas.addTo(line);

          line.attrs({
            stroke: 'red',
            'stroke-width': 2
          });

          // Store shapes in context
          ctx.shapes = {};
          ctx.shapes.line = line;
        },

        // --------------------------------------------------
        // ACTIONS PHASE (Act)
        // --------------------------------------------------
        actions(api, ctx) {
          // Modify shape
          ctx.shapes.line.attrs({
            stroke: 'blue'
          });
        },

        // --------------------------------------------------
        // EXPECT PHASE (Assert)
        // --------------------------------------------------
        expect: {
          constraints: { save: false },
          // Target shapes (by key from ctx.shapes)
          shapes: ['line'],

          // -------- STYLE VALIDATION --------
          style: {
            strokeColor: 'blue'
          },

          // -------- GEOMETRY VALIDATION --------
          geometry: {
            equalTo: {
              x1: 23
            },
            greaterThan: {
              x2: 50
            }
          }

          // -------- ERROR VALIDATION (optional) --------
          // error: {
          //   expected: new Error('Expected error')
          // }
        }
      });
    }
  });
}
