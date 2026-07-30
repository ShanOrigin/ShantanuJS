// Import testing tool demo
import { hideMethod } from "../tests/tests/hideMethod.js";
import { showMethod } from "../tests/tests/showMethod.js";
import { toBackMethod } from "../tests/tests/toBackMethod.js";
import { toFrontMethod } from "../tests/tests/toFrontMerhod.js";

import { cloneMethod } from "../tests/tests/cloneMethod.js";

import { createCanvas } from "../tests/tests/canvas/create.js";
// Entry function (user-defined)
export function runTests(module: string, method: string) {
  switch (module) {
    case "canvas":
      canvasMethods(method);
      break;
    case "shape":
      shapeBasicMethod(method);
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
    default:
      break;
  }
}

function canvasMethods(method: string) {
  switch (method) {
    case "create":
      createCanvas();
      break;

    default:
      break;
  }
}

const module = "canvas";
const method = "create";
setTimeout(() => runTests(module, method), 5000);
