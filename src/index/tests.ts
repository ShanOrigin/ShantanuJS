// Import testing tool demo
import { hideMethod } from "../tests/tests/shape/basic/hideMethod.js";
import { showMethod } from "../tests/tests/shape/basic/showMethod.js";
import { toBackMethod } from "../tests/tests/shape/basic/toBackMethod.js";
import { toFrontMethod } from "../tests/tests/shape/basic/toFrontMerhod.js";

import { cloneMethod } from "../tests/tests/shape/basic/cloneMethod.js";

import { createCanvas } from "../tests/tests/canvas/create.js";
import { addCanvasMethod } from "../tests/tests/canvas/add.js";
import { removeCanvasMethod } from "../tests/tests/canvas/remove.js";
import { clearCanvasMethod } from "../tests/tests/canvas/clear.js";
import { containsCanvasMethod } from "../tests/tests/canvas/contains.js";
import { getAllElementsCanvasMethod } from "../tests/tests/canvas/getAllElements.js";
import { attrsCanvasMethod } from "../tests/tests/canvas/attrs.js";
import { getBBoxMethod } from "../tests/tests/shape/basic/getBBoxMethod.js";

// Transformations module tests
import { translateTransformMethod } from "../tests/tests/shape/transformations/translate.js";
import { scaleTransformMethod } from "../tests/tests/shape/transformations/scale.js";
import { rotateTransformMethod } from "../tests/tests/shape/transformations/rotate.js";
import { skewTransformMethod } from "../tests/tests/shape/transformations/skew.js";
import { transformMethod } from "../tests/tests/shape/transformations/transform.js";
import { beginTTransformMethod } from "../tests/tests/shape/transformations/beginT.js";
import { endTTransformMethod } from "../tests/tests/shape/transformations/endT.js";

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
    default:
      break;
  }
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

const module = "transformations";
const method = "translate";
setTimeout(() => runTests(module, method), 5000);
