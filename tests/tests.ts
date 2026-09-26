/**
 * ShantanuJS Test Runner
 * =======================
 *
 * Central entry point for executing the ShantanuJS test suite.
 *
 * Test execution can be controlled at two levels:
 *
 *   1. DOMAIN
 *   2. Test within that DOMAIN
 *
 * Examples:
 *
 *   All DOMAINs and all tests:
 *     npm run testing
 *
 *   Run one DOMAIN:
 *     npm run testing -- canvas
 *
 *   Run one test from a DOMAIN:
 *     npm run testing -- canvas create
 *
 *   Run all tests from one DOMAIN:
 *     npm run testing -- transformations all
 *
 * When no DOMAIN or test is supplied, the runner defaults to:
 *
 *     DOMAIN = all
 *     test    = all
 *
 * ---------------------------------------------------------------------------
 * Test isolation
 * ---------------------------------------------------------------------------
 *
 * Every individual test receives a fresh testing container.
 *
 * Before a test starts, the existing:
 *
 *     <div id="testing"></div>
 *
 * is removed and replaced with a new container.
 *
 * This prevents DOM state, SVG elements, styles, event handlers, and other
 * test-specific state from leaking from one test into another.
 *
 * ---------------------------------------------------------------------------
 * Adding a new test
 * ---------------------------------------------------------------------------
 *
 * Add the test function to the appropriate DOMAIN in TEST_DOMAINS below.
 * No additional switch statement is required.
 *
 * Example:
 *
 *     newTest: newTestFunction
 *
 * The test then becomes available through:
 *
 *     npm run testing -- DOMAIN newTest
 *
 * ---------------------------------------------------------------------------
 */

import ShantanuJSTestTool from "./testingTool/shantanuJS-test.js";
import { hideMethod } from "./tests/shape/basic/hideMethod.js";
import { showMethod } from "./tests/shape/basic/showMethod.js";
import { toBackMethod } from "./tests/shape/basic/toBackMethod.js";
import { toFrontMethod } from "./tests/shape/basic/toFrontMerhod.js";
import { cloneMethod } from "./tests/shape/basic/cloneMethod.js";
import { getBBoxMethod } from "./tests/shape/basic/getBBoxMethod.js";

import { createCanvas } from "./tests/canvas/create.js";
import { addCanvasMethod } from "./tests/canvas/add.js";
import { removeCanvasMethod } from "./tests/canvas/remove.js";
import { clearCanvasMethod } from "./tests/canvas/clear.js";
import { containsCanvasMethod } from "./tests/canvas/contains.js";
import { getAllElementsCanvasMethod } from "./tests/canvas/getAllElements.js";
import { attrsCanvasMethod } from "./tests/canvas/attrs.js";

import { translateTransformMethod } from "./tests/shape/transformations/translate.js";
import { scaleTransformMethod } from "./tests/shape/transformations/scale.js";
import { rotateTransformMethod } from "./tests/shape/transformations/rotate.js";
import { skewTransformMethod } from "./tests/shape/transformations/skew.js";
import { transformMethod } from "./tests/shape/transformations/transform.js";
import { beginTTransformMethod } from "./tests/shape/transformations/beginT.js";
import { endTTransformMethod } from "./tests/shape/transformations/endT.js";

import { restoreDimension } from "./tests/shape/media/text/restoreDimension.js";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ID of the DOM container used by the ShantanuJS test suite.
 *
 * Every test receives a newly created element with this ID.
 */
const TEST_CONTAINER_ID = "testing";

/**
 * Special selector used to execute every test in a DOMAIN.
 */
const ALL_TESTS = "all";
/**
 * Default DOMAIN executed when no DOMAIN is supplied.
 */
const DEFAULT_DOMAIN = "shape" ;

/**
 * Default test executed when no test is supplied.
 */
const DEFAULT_TEST = 'hide' ;

/**
 * Manual visult result of indiviual test case in browser 
 * if user want visual result in browser then set it true
 */
const REFRESH_CONTAINER = false ; 

/* -------------------------------------------------------------------------- */
/* Test types                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Function representing one executable test case.
 *
 * A test may return nothing or a Promise.
 */
type TestFunction = () => void | Promise<void>;

/**
 * Collection of tests belonging to one DOMAIN.
 */
type TestDOMAIN = Record<string, TestFunction>;

/**
 * Complete test suite definition.
 */
type TestDOMAINs = Record<string, TestDOMAIN>;

/* -------------------------------------------------------------------------- */
/* Test DOMAINs                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Central test-suite registry.
 *
 * The DOMAIN names defined here are the DOMAINs supported by the test
 * runner. Empty DOMAINs are intentionally kept for future test coverage.
 *
 * Add new test functions directly to the appropriate DOMAIN.
 */
const TEST_DOMAINS: TestDOMAINs = {
  /* ------------------------------------------------------------------------ */
  /* Canvas                                                                   */
  /* ------------------------------------------------------------------------ */

  canvas: {
    create: createCanvas,
    add: addCanvasMethod,
    remove: removeCanvasMethod,
    clear: clearCanvasMethod,
    contains: containsCanvasMethod,
    getAllElements: getAllElementsCanvasMethod,
    attrs: attrsCanvasMethod,
  },

  /* ------------------------------------------------------------------------ */
  /* Shapes                                                                   */
  /* ------------------------------------------------------------------------ */

  shape: {
    hide: hideMethod,
    show: showMethod,
    toFront: toFrontMethod,
    toBack: toBackMethod,
    clone: cloneMethod,
    getBBox: getBBoxMethod,
  },

  /* ------------------------------------------------------------------------ */
  /* Transformations                                                          */
  /* ------------------------------------------------------------------------ */

  transformations: {
    // translate: translateTransformMethod,
    // scale: scaleTransformMethod,
    // rotate: rotateTransformMethod,
    // skew: skewTransformMethod,
    // transform: transformMethod,
    // beginT: beginTTransformMethod,
    // endT: endTTransformMethod,
  },

  /* ------------------------------------------------------------------------ */
  /* Animation                                                                */
  /* ------------------------------------------------------------------------ */

  animation: {},

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  filter: {},

  /* ------------------------------------------------------------------------ */
  /* Scene                                                                    */
  /* ------------------------------------------------------------------------ */

  scene: {},

  /* ------------------------------------------------------------------------ */
  /* Events                                                                   */
  /* ------------------------------------------------------------------------ */

  events: {},

  /* ------------------------------------------------------------------------ */
  /* Media                                                                    */
  /* ------------------------------------------------------------------------ */

  media: {},

  /* ------------------------------------------------------------------------ */
  /* Groups                                                                   */
  /* ------------------------------------------------------------------------ */

  group: {},

  /* ------------------------------------------------------------------------ */
  /* Bug regression tests                                                     */
  /* ------------------------------------------------------------------------ */

  bug: {
    restoreDimension,
  },
};

/* -------------------------------------------------------------------------- */
/* Container management                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Removes the existing test container and creates a fresh one.
 *
 * This function is called immediately before every individual test.
 *
 * A fresh container ensures that a previous test cannot leave DOM elements
 * or other container-specific state that affects the next test.
 *
 * @returns The newly created testing container.
 */
function createFreshTestContainer(): HTMLDivElement {
  const existingContainer = document.getElementById(TEST_CONTAINER_ID);

  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement("div");

  container.id = TEST_CONTAINER_ID;

  document.body.appendChild(container);

  return container;
}

/**
 * Removes the current testing container.
 *
 * The next test creates its own fresh container, keeping every test isolated.
 */
function removeTestContainer(): void {
  const container = document.getElementById(TEST_CONTAINER_ID);

  if (container) {
    container.remove();
  }
}

/* -------------------------------------------------------------------------- */
/* Test execution                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Executes one individual test.
 *
 * A fresh testing container is created before the test starts and removed
 * after the test finishes.
 *
 * Tests are executed sequentially so that two tests never operate on the
 * same testing container at the same time.
 *
 * @param DOMAINName DOMAIN containing the test.
 * @param testName Name of the test.
 * @param test Test function to execute.
 */
async function executeTest(
  DOMAINName: string,
  testName: string,
  test: TestFunction,
): Promise<void> {
 if( REFRESH_CONTAINER ) createFreshTestContainer();

  console.log(`[TEST] Starting: ${DOMAINName}/${testName}`);

  try {
    await test();
  } finally {
    /*
     * Use a warning instead of a normal log so completed test boundaries
     * remain easy to identify in the browser console.
     */
    console.warn(`[TEST] Finished: ${DOMAINName}/${testName}`);

   if(REFRESH_CONTAINER) removeTestContainer();
  }
}

/**
 * Executes tests from one DOMAIN.
 *
 * When `testName` is `all`, every test in the DOMAIN is executed
 * sequentially. Otherwise, only the requested test is executed.
 *
 * @param DOMAINName Name of the DOMAIN to execute.
 * @param DOMAIN Tests belonging to the DOMAIN.
 * @param testName Test name, or "all".
 */
async function executeDOMAIN(
  DOMAINName: string,
  DOMAIN: TestDOMAIN,
  testName: string = DEFAULT_TEST,
): Promise<void> {
  const tests = Object.entries(DOMAIN);

  /*
   * Empty DOMAINs are valid. They are intentionally present for future
   * test coverage and should simply be skipped when no tests are registered.
   */
  if (tests.length === 0) {
    console.warn(`[TEST] No tests registered in DOMAIN: ${DOMAINName}`);
    return;
  }

  if (testName === ALL_TESTS) {
    for (const [name, test] of tests) {
      await executeTest(DOMAINName, name, test);
    }

    return;
  }

  const selectedTest = DOMAIN[testName];

  if (!selectedTest) {
    throw new Error(`Unknown test "${testName}" in DOMAIN "${DOMAINName}".`);
  }

  await executeTest(DOMAINName, testName, selectedTest);
}

/**
 * Executes the requested part of the test suite.
 *
 * Supported modes:
 *
 *     runTests()
 *     runTests("all")
 *     runTests("canvas")
 *     runTests("canvas", "create")
 *     runTests("transformations", "rotate")
 *
 * @param DOMAINName DOMAIN to execute. Defaults to "all".
 * @param testName Test within the DOMAIN. Defaults to "all".
 */
export async function runTests(
  DOMAINName: string = DEFAULT_DOMAIN,
  testName: string = DEFAULT_TEST,
): Promise<void> {
  const normalizedDOMAIN = DOMAINName || DEFAULT_DOMAIN;
  const normalizedTest = testName || DEFAULT_TEST;

  /*
   * Execute every registered DOMAIN sequentially.
   *
   * This is intentionally sequential because all tests share the browser
   * document and the same testing container ID.
   */
  if (normalizedDOMAIN === ALL_TESTS) {
    for (const [name, DOMAIN] of Object.entries(TEST_DOMAINS)) {
      await executeDOMAIN(name, DOMAIN, normalizedTest);
    }

    return;
  }

  const DOMAIN = TEST_DOMAINS[normalizedDOMAIN];

  if (!DOMAIN) {
    throw new Error(`Unknown test DOMAIN "${normalizedDOMAIN}".`);
  }

  await executeDOMAIN(normalizedDOMAIN, DOMAIN, normalizedTest);
}

/**
 * Reads test arguments from the browser URL.
 *
 * Examples:
 *
 *   ?DOMAIN=canvas&test=create
 *   ?DOMAIN=canvas&test=all
 *   ?DOMAIN=all&test=all
 *
 * When no parameters are supplied, the complete test suite is executed.
 */
function getTestArguments(): {
  DOMAIN: string;
  test: string;
} {
  const params = new URLSearchParams(window.location.search);

  const rawDomain =
    params.get("DOMAIN") ||
    params.get("domain") ||
    params.get("section") ||
    DEFAULT_DOMAIN;

  const rawTest =
    params.get("test") ||
    params.get("TEST") ||
    DEFAULT_TEST;

  return {
    DOMAIN: rawDomain.trim(),
    test: rawTest.trim(),
  };
}

/* -------------------------------------------------------------------------- */
/* Test runner entry point                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Starts the configured test run.
 *
 * No artificial startup delay is used. The test environment must be ready
 * before this entry point is invoked.
 */
async function startTestRunner(): Promise<void> {
  const { DOMAIN, test } = getTestArguments();

  console.warn(
    `[TEST] Test runner starting: DOMAIN="${DOMAIN}", test="${test}"`,
  );

  try {
    await runTests(DOMAIN, test);

    // Ensure all asynchronous test result saves are completed before signaling done
    await ShantanuJSTestTool.waitForPendingSaves();

    console.warn(
      `[TEST] Test runner completed: DOMAIN="${DOMAIN}", test="${test}"`,
    );

    await fetch("http://127.0.0.1:4000/test-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        DOMAIN,
        test,
      }),
    });
  } catch (error: unknown) {
    console.error("[TEST] Test runner failed.");

    console.error(error instanceof Error ? error : String(error));

    await fetch("http://127.0.0.1:4000/test-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        DOMAIN,
        test,
        error: error instanceof Error ? error.message : String(error),
      }),
    }).catch(() => {
      // Do not hide the original test-runner error.
    });
  }
}

void startTestRunner();
