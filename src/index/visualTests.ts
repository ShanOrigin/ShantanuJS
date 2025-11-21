import { RectUnitTests } from '../tests/shapes/basicShapes/rect/visualTest/visualUnitTest.js';

import { RectCombineTests } from '../tests/shapes/basicShapes/rect/visualTest/visualCombineTest.js';

import { RectAnimationTests } from '../tests/shapes/basicShapes/rect/visualTest/visualAnimations.js';

import { RectEventsTests } from '../tests/shapes/basicShapes/rect/visualTest/visualEvent.js';

import { RectFiltersTests } from '../tests/shapes/basicShapes/rect/visualTest/visualFilters.js';

import { access } from '../utils/internals/accessKeys.js';

import { QuadraticCurveUnitTests } from '../tests/shapes/customShapes/curves/visualTest/visualUnitTest.js';

// Tester function
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

async function Tester(classes: string, types: string) {
  switch (classes) {
    case 'rect':
      await RectClassTester(types);

      break;
    case 'qcurve':
      await QuadraticCurveClassTester(types);

      break;
    default:
      break;
  }
}

setTimeout(async () => {
  access();
  await Tester('qcurve', 'unit');
}, 5000);
