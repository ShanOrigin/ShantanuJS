// Import testing tool demo
import { hideMethod } from "./tests/shape/basic/hideMethod.js";

import { showMethod } from "./tests/shape/basic/showMethod.js";
import { toBackMethod } from "./tests/shape/basic/toBackMethod.js";
import { toFrontMethod } from "./tests/shape/basic/toFrontMerhod.js";

import { cloneMethod } from "./tests/shape/basic/cloneMethod.js";

import { createCanvas } from "./tests/canvas/create.js";
import { addCanvasMethod } from "./tests/canvas/add.js";
import { removeCanvasMethod } from "./tests/canvas/remove.js";
import { clearCanvasMethod } from "./tests/canvas/clear.js";
import { containsCanvasMethod } from "./tests/canvas/contains.js";
import { getAllElementsCanvasMethod } from "./tests/canvas/getAllElements.js";
import { attrsCanvasMethod } from "./tests/canvas/attrs.js";
import { getBBoxMethod } from "./tests/shape/basic/getBBoxMethod.js";

// Transformations module tests
import { translateTransformMethod } from "./tests/shape/transformations/translate.js";
import { scaleTransformMethod } from "./tests/shape/transformations/scale.js";
import { rotateTransformMethod } from "./tests/shape/transformations/rotate.js";
import { skewTransformMethod } from "./tests/shape/transformations/skew.js";
import { transformMethod } from "./tests/shape/transformations/transform.js";
import { beginTTransformMethod } from "./tests/shape/transformations/beginT.js";
import { endTTransformMethod } from "./tests/shape/transformations/endT.js";

// testing bugs : Shapes
import { restoreDimension } from "./tests/shape/media/text/restoreDimension.js";

// Entry function (user-defined)
export function runTests(module: string, method: string) {
  switch (module) {
    case "canvas":
      canvasMethods(method);
      break;
    case "shape":
      shapeBasicMethod(method);
      break;
    case "transformations":
      shapeTransformationsMethod(method);
      break;
    case "bug":
      testingBug();
    default:
      break;
  }
}

function testingBug() {
  // run bug testing code here
  restoreDimension();
}

function shapeTransformationsMethod(method: string) {
  switch (method) {
    case "translate":
      translateTransformMethod();
      break;
    case "scale":
      scaleTransformMethod();
      break;
    case "rotate":
      rotateTransformMethod();
      break;
    case "skew":
      skewTransformMethod();
      break;
    case "transform":
      transformMethod();
      break;
    case "beginT":
      beginTTransformMethod();
      break;
    case "endT":
      endTTransformMethod();
      break;
    case "all":
      translateTransformMethod();
      scaleTransformMethod();
      rotateTransformMethod();
      skewTransformMethod();
      transformMethod();
      beginTTransformMethod();
      endTTransformMethod();
      break;
    default:
      break;
  }
}

function shapeBasicMethod(method: string) {
  switch (method) {
    case "hide":
      hideMethod();
      break;
    case "show":
      showMethod();
      break;
    case "toFront":
      toFrontMethod();
      break;

    case "toBack":
      toBackMethod();
      break;

    case "clone":
      cloneMethod();
    case "getBBox":
      getBBoxMethod();
      break;
  }
}

function canvasMethods(method: string) {
  switch (method) {
    case "create":
      createCanvas();
      break;
    case "add":
      addCanvasMethod();
      break;
    case "remove":
      removeCanvasMethod();
      break;
    case "clear":
      clearCanvasMethod();
      break;

    case "contains":
      containsCanvasMethod();
      break;

    case "getAllElements":
      getAllElementsCanvasMethod();
      break;

    case "attrs":
      attrsCanvasMethod();
      break;

    default:
      break;
  }
}

const module = "bug";
const method = "";
setTimeout(() => runTests(module, method), 5000);
