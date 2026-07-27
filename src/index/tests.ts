// Import testing tool demo
import { hideMethod } from "../tests/tests/hideMethod.js";
import { showMethod } from "../tests/tests/showMethod.js";
import { toBackMethod } from "../tests/tests/toBackMethod.js";
import { toFrontMethod } from "../tests/tests/toFrontMerhod.js";

import { cloneMethod } from "../tests/tests/cloneMethod.js";
// Entry function (user-defined)
export function runTests(method: string) {
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

const method = "clone";
setTimeout(() => runTests(method), 5000);
