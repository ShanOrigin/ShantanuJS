import { LineUnitTests } from '../tests/shapes/basicShapes/line/visualTest/visualUnitTest.js';

import { LineCombineTests } from '../tests/shapes/basicShapes/line/visualTest/visualCombineTest.js';

// Rect imports
import { RectUnitTests } from '../tests/shapes/basicShapes/rect/visualTest/visualUnitTest.js';

import { RectCombineTests } from '../tests/shapes/basicShapes/rect/visualTest/visualCombineTest.js';

import { RectAnimationTests } from '../tests/shapes/basicShapes/rect/visualTest/visualAnimations.js';

import { RectEventsTests } from '../tests/shapes/basicShapes/rect/visualTest/visualEvent.js';

import { RectFiltersTests } from '../tests/shapes/basicShapes/rect/visualTest/visualFilters.js';

import { QuadraticCurveUnitTests } from '../tests/shapes/customShapes/curves/visualTest/visualUnitTest.js';

import { TriangleUnitTests } from '../tests/shapes/customShapes/triangles/visualTest/visualUnitTest.js';

// Tester function

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
      await QuadraticCurveUnitTests();
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
      await TriangleUnitTests();
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

setTimeout(async () => {
  await Tester('line', 'combine');
}, 5000);
