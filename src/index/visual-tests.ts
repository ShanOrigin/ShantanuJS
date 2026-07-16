// Import testing tool demo
import shantanuJSTest from "../tests/testingTool/shantanuJS-test.js";

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
      const canvas = new api.Canvas({ id: "testing", width: 200, height: 400 });

      // Apply base styles
      canvas.attrs({
        fill: "green",
        stroke: "red",
        "stroke-width": 0,
      });

      // Store in context (shared across phases)
      ctx.canvas = canvas;
    },

    // --------------------------------------------------
    // RUN PHASE (Test Execution Entry)
    // --------------------------------------------------
    run(ctx) {
      testEnv.shTest({
        // --------------------------------------------------
        // TEST METADATA (REQUIRED)
        // --------------------------------------------------
        testInfo: {
          description: "Update stroke color of a line",
          module: "shapes",
          testType: "unit",
          element: "line",
        },

        // --------------------------------------------------
        // SETUP PHASE (Arrange)
        // --------------------------------------------------
        setup(api, ctx) {
          const rectangle = new api.Shapes.Rect({
            x: 20,
            y: 40,
            width: 50,
            height: 40,
          });
          ctx.canvas.add(rectangle);

          rectangle.attrs({
            stroke: "purple",
            "stroke-width": 2,
          });

          const line = new api.Shapes.Line({ x1: 20, y1: 40, x2: 50, y2: 40 });
          ctx.canvas.add(line);

          line.attrs({
            stroke: "red",
            "stroke-width": 2,
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
            stroke: "blue",
          });

          console.log(ctx.shapes.line);
        },

        // --------------------------------------------------
        // EXPECT PHASE (Assert)
        // --------------------------------------------------
        expect: {
          constraints: { save: true, oracle: { browser: false } },
          // Target shapes (by key from ctx.shapes)
          testSubject: "line",

          // -------- STYLE VALIDATION --------
          style: {
            attrs: {
              stroke: {
                value: "blue",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 3,
                expectedStatus: "pass",
              },
            },
            notEqualTo: {
              stroke: {
                value: "red",
                expectedStatus: "pass",
              },
              "stroke-width": {
                value: 2,
                expectedStatus: "fail",
              },
            },
          },

          // -------- GEOMETRY VALIDATION --------
          // geometry: {
          //   equalTo: {},
          //   greaterThan: {},
          // },

          // -------- ERROR VALIDATION (optional) --------
          // error: {
          //   expected: new Error('Expected error')
          // }
        },
      });
    },
  });
}

setTimeout(runTests, 5000);

/*

import { LineUnitTests } from '../tests/shapes/basicShapes/line/visualTest/visualUnitTest.js';

import { LineCombineTests } from '../tests/shapes/basicShapes/line/visualTest/visualCombineTest.js';
import { LineEventsTests } from '../tests/shapes/basicShapes/line/visualTest/visualEvent.js';
import { LineFiltersTests } from '../tests/shapes/basicShapes/line/visualTest/visualFilters.js';
import { LineAnimationTests } from '../tests/shapes/basicShapes/line/visualTest/visualAnimations.js';

// Rect imports
import { RectUnitTests } from '../tests/shapes/basicShapes/rect/visualTest/visualUnitTest.js';

import { RectCombineTests } from '../tests/shapes/basicShapes/rect/visualTest/visualCombineTest.js';

import { RectAnimationTests } from '../tests/shapes/basicShapes/rect/visualTest/visualAnimations.js';

import { RectEventsTests } from '../tests/shapes/basicShapes/rect/visualTest/visualEvent.js';

import { RectFiltersTests } from '../tests/shapes/basicShapes/rect/visualTest/visualFilters.js';

*/

/*
import { QuadraticCurveUnitTests } from '../tests/shapes/customShapes/curves/visualTest/visualUnitTest.js';

import { TriangleUnitTests } from '../tests/shapes/customShapes/triangles/visualTest/visualUnitTest.js';
*/
// Tester function

/*
// Rect testing
async function LineClassTester(testType: string) {
  switch (testType) {
    case 'unit':
      await LineUnitTests();
      break;

    case 'combine':
      await LineCombineTests();
      break;
    case 'animation':
      await LineAnimationTests();
      break;

    case 'events':
      await LineEventsTests();
      break;

    case 'filters':
      await LineFiltersTests();
      break;
  }
}

// Rect testing
async function RectClassTester(testType: string) {
  switch (testType) {
    case 'unit':
      await RectUnitTests();
      break;

    case 'combine':
      await RectCombineTests();
      break;
    case 'animation':
      await RectAnimationTests();
      break;

    case 'events':
      await RectEventsTests();
      break;

    case 'filters':
      await RectFiltersTests();
      break;
  }
}

// quadratic curve testing

async function QuadraticCurveClassTester(testType: string) {
  switch (testType) {
    case 'unit':
      // await QuadraticCurveUnitTests();
      break;

    case 'combine':
      await RectCombineTests();
      break;
    case 'animation':
      await RectAnimationTests();
      break;

    case 'events':
      await RectEventsTests();
      break;

    case 'filters':
      await RectFiltersTests();
      break;
  }
}

// triangle testing

async function TriangleClassTester(testType: string) {
  switch (testType) {
    case 'unit':
      // await TriangleUnitTests();
      break;

    case 'combine':
      await RectCombineTests();
      break;
    case 'animation':
      await RectAnimationTests();
      break;

    case 'events':
      await RectEventsTests();
      break;

    case 'filters':
      await RectFiltersTests();
      break;
  }
}

async function Tester(classes: string, types: string) {
  switch (classes) {
    case 'line':
      await LineClassTester(types);

      break;

    case 'rect':
      await RectClassTester(types);

      break;
    case 'qcurve':
      await QuadraticCurveClassTester(types);

      break;

    case 'triangle':
      await TriangleClassTester(types);

      break;

    default:
      break;
  }
}

*/

/*
setTimeout(async () => {
  console.log('line unit test');
  await Tester('line', 'unit');
}, 5000);

*/
