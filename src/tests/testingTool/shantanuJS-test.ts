import { ShantanuJS } from "../../index/index.js";
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GRAPHICS_METHOD,
} from "../../internal/keys/dev-keys.js";
import {
  GetInternalGraphicsAccessor,
  GraphicsNode,
} from "../../models/interfaces/graphics-container";
import { GraphicsRenderNode } from "../../models/interfaces/render-node";

type ShantanuJSTypes = typeof ShantanuJS;

type GraphicsRenderNodeWithInternals = GraphicsRenderNode &
  GetInternalGraphicsAccessor;

import { getBrowserInfoLegacy } from "./browser-info.js";

import type {
  GeometryCheckResult,
  Primitive,
  OracleResult,
  TestInfo,
  ExpectedBlock,
  SaveFileData,
  OutputParam,
  TestStatus,
  DataState,
  TestErrors,
  ConstraintsParams,
  StatesData,
  MetaData,
  StyleData,
  GeometryData,
  CompareMode,
  RGBA,
  Environment,
  Validator,
  Validators,
  Tests,
} from "./types";

export type Context = {
  shapes: Record<string, GraphicsNode>;
  canvas: ShantanuJS.Canvas;
};

export type fn = (api: ShantanuJSTypes, ctx: Context) => void;

export type shTestParams = {
  testInfo: TestInfo;
  setup?: fn;
  actions: fn;
  expect: ExpectedBlock;
};

export default class ShantanuJSTestTool {
  /**
   * Internal auto-incrementing identifier used to assign unique IDs
   * to test cases during a single execution lifecycle.
   *
   * Characteristics:
   * - Starts at 0
   * - Monotonically increases
   * - Not persisted across sessions
   *
   * @invariant
   * - Always a non-negative integer
   * - Must never be manually mutated outside controlled increments
   */
  #idNumber = 0;

  /**
   * Reference to the core ShantanuJS rendering/logic API.
   *
   * This acts as the execution engine exposed to:
   * - setup phase
   * - action phase
   *
   * It is intentionally fixed at initialization to prevent
   * runtime API swapping, which would invalidate test determinism.
   *
   * @type ShantanuJSTypes
   *
   * @invariant
   * - Must remain immutable during test lifecycle
   */
  #api: ShantanuJSTypes = ShantanuJS;

  /**
   * Execution context shared across test lifecycle phases.
   *
   * Primary responsibility:
   * - Maintain runtime state of created shapes and entities
   *
   * Structure:
   * {
   *   shapes: Record<string, any>
   * }
   *
   * Used by:
   * - setup → to register entities
   * - actions → to mutate entities
   * - verification → to inspect final state
   *
   * @type Context
   *
   * @risk
   * - No isolation between tests → shared mutable state
   * - Requires manual discipline to avoid state leakage
   */
  #context = { shapes: {} } as Context;

  /**
   * Aggregated error storage across all execution phases.
   *
   * Segregates errors by lifecycle stage:
   * - setupErrors   → failures during environment initialization
   * - actionErrors  → failures during execution steps
   * - verifyErrors  → failures during assertion/validation
   *
   * Purpose:
   * - Prevents early termination
   * - Enables full test execution visibility
   *
   * @type Terrors
   *
   * @invariant
   * - Each field is always an array
   * - Errors are appended, never overwritten
   */
  #errors: TestErrors = {
    setupErrors: [],
    actionErrors: [],
    verifyErrors: [],
  };

  /**
   * Persistent result container that mirrors on-disk structure.
   *
   * Fields:
   * - fileUrl → source file identifier (used for resolution)
   * - meta    → metadata describing test environment and context
   * - tests   → collection of test outputs indexed by test ID
   *
   * Structure:
   * {
   *   fileUrl: string,
   *   meta?: metaData,
   *   tests: Record<string, outputParam>
   * }
   *
   * @invariant
   * - fileUrl must always be defined after construction
   * - tests must always be a valid object (never null/undefined)
   *
   * @risk
   * - meta is optional → requires consistency enforcement externally
   */
  #results: SaveFileData = {
    fileUrl: "",
    tests: {},
  };

  /**
   * Configuration constraints governing test execution and validation.
   *
   * Fields:
   * - save:
   *   Enables/disables persistence of test results
   *
   * - oracle:
   *   Defines strictness of environment matching
   *   {
   *     browser: boolean,
   *     library: boolean
   *   }
   *
   * - tolerance:
   *   Numeric thresholds for approximate comparisons
   *   {
   *     geometry: number
   *   }
   *
   * @type constraintsParams
   *
   * @default
   * {
   *   save: false,
   *   oracle: { browser: true, library: true },
   *   tolerance: { geometry: 0.05 }
   * }
   *
   * @risk
   * - No validation on values → invalid configs can silently degrade accuracy
   */
  #constraints: ConstraintsParams = {
    save: false,
    oracle: { browser: true, library: true },
  };

  /**
   * Initializes the test tool instance with a source file reference.
   *
   * Responsibilities:
   * - Captures the originating module URL
   * - Stores it in internal result structure for later resolution
   *
   * Default Behavior:
   * - Uses `import.meta.url` if no path is provided
   *
   * @param path - Absolute module URL identifying the test source
   *
   * @sideEffects
   * - Mutates `#results.fileUrl`
   * - Logs path to console (debug artifact, should be removed in production)
   *
   * @invariant
   * - fileUrl must always be a valid URL string
   *
   * @risk
   * - No validation on input → malformed URLs propagate downstream
   */
  constructor(path: string = import.meta.url) {
    this.#results["fileUrl"] = path;
  }

  /**
   * Executes environment lifecycle hooks: initialize → run.
   *
   * Flow:
   * - Calls `initialize(api, ctx)` to set up environment state
   * - Calls `run(ctx)` to execute logic using prepared context
   *
   * Behavior:
   * - Initialization errors are caught and halt execution
   * - Runtime errors inside `run` are NOT handled here
   *
   * @param initialize - Setup function receiving API + shared context
   * @param run - Execution function operating on prepared context
   *
   * @sideEffects
   * - Mutates internal `#ctx`
   * - Logs results to console
   *
   * @risk
   * - Shared mutable ctx → no isolation between executions
   * - No error handling in `run` → possible uncontrolled failure
   */
  public env({
    initialize,
    run,
  }: {
    initialize: (api: ShantanuJSTypes, ctx: Context) => void;
    run: (ctx: Context) => void;
  }) {
    try {
      initialize(this.#api, this.#context);
    } catch (e) {
      console.error("Error in env initialize callback");
      console.error(e);
      return;
    }

    run(this.#context);
  }

  /**
   * Executes a complete ShantanuJS test lifecycle.
   *
   * Execution pipeline:
   * 1. Validate test definition.
   * 2. Execute setup phase.
   * 3. Capture initial state.
   * 4. Execute action phase.
   * 5. Capture final state.
   * 6. Verify expected results.
   * 7. Generate assertion summary.
   * 8. Persist test report (optional).
   *
   * Each phase is isolated. If a phase throws, execution stops immediately
   * and the corresponding errors are delegated to the error handler.
   *
   * @param testDef - Complete test definition.
   *
   * @remarks
   * State snapshots are captured immediately before and after the action phase.
   *
   * @sideEffects
   * - Mutates the shared testing context.
   * - Stores test results internally.
   * - Persists the generated report when enabled.
   */
  public shTest(testDef: shTestParams): void {
    this.#validateTest(testDef);

    this.#constraints = {
      ...this.#constraints,
      ...(testDef.expect.constraints ?? {}),
      oracle: {
        ...this.#constraints.oracle,
        ...(testDef.expect.constraints?.oracle ?? {}),
      },
    };

    const states = {} as StatesData;
    const { setupErrors, actionErrors, verifyErrors } = this.#errors;

    // ---------------------------------------------------------------------------
    // Setup
    // ---------------------------------------------------------------------------

    if (testDef.setup) {
      try {
        testDef.setup(this.#api, this.#context);
        this.#context.canvas.engine.flush();
      } catch (error) {
        setupErrors.push(error as Error);
      }

      if (setupErrors.length) {
        return this.#handleErrors("setup", setupErrors);
      }
    }

    // ---------------------------------------------------------------------------
    // Capture Initial State
    // ---------------------------------------------------------------------------

    states.before = this.#captureState(testDef.expect);

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    try {
      testDef.actions(this.#api, this.#context);
      this.#context.canvas.engine.flush();
    } catch (error) {
      actionErrors.push(error as Error);
    }

    if (actionErrors.length) {
      return this.#handleErrors("action", actionErrors);
    }

    // ---------------------------------------------------------------------------
    // Capture Final State
    // ---------------------------------------------------------------------------

    states.after = this.#captureState(testDef.expect);

    // ---------------------------------------------------------------------------
    // Verify
    // ---------------------------------------------------------------------------

    let assertions: OutputParam["assertions"] = [];

    try {
      assertions = this.#runVerify(testDef.expect, this.#context);
      this.#context.canvas.engine.flush();
    } catch (error) {
      verifyErrors.push(error as Error);
    }

    if (verifyErrors.length) {
      return this.#handleErrors("verify", verifyErrors);
    }

    // ---------------------------------------------------------------------------
    // Assertion Summary
    // ---------------------------------------------------------------------------

    const status: TestStatus = {
      result: "fail",
      totalPassedAssertions: 0,
      totalFailedAssertions: 0,
    };

    for (const assertion of assertions) {
      if (assertion.actualStatus === assertion.expectedStatus) {
        status.totalPassedAssertions++;
      } else {
        status.totalFailedAssertions++;
      }
    }

    status.result = status.totalFailedAssertions === 0 ? "pass" : "fail";

    // ---------------------------------------------------------------------------
    // Metadata
    // ---------------------------------------------------------------------------

    const { module, testType, element } = testDef.testInfo;

    const id = `${testType}-${module}-${element}-${this.#idNumber++}`;

    const meta: MetaData = {
      info: {
        module: module!,
        testType: testType!,
        canvasId: this.#context.canvas.attrs("id") as string,
      },
      environment: {
        libraryVersion: "0.0.0",
        ...(getBrowserInfoLegacy() as Environment),
      },
    };

    // ---------------------------------------------------------------------------
    // Output
    // ---------------------------------------------------------------------------

    const output: OutputParam = {
      information: {
        ...testDef.testInfo,
        id,
      },
      states,
      status,
      assertions,
    };

    // ---------------------------------------------------------------------------
    // Initialize Report
    // ---------------------------------------------------------------------------

    this.#results.meta ??= meta;
    this.#results.tests ??= {};

    const globalMeta = this.#results.meta;

    if (globalMeta.info.module !== meta.info.module) {
      throw new Error(
        `Meta mismatch [module]: expected "${globalMeta.info.module}", received "${meta.info.module}".`,
      );
    }

    if (globalMeta.info.testType !== meta.info.testType) {
      throw new Error(
        `Meta mismatch [testType]: expected "${globalMeta.info.testType}", received "${meta.info.testType}".`,
      );
    }

    if (globalMeta.info.canvasId !== meta.info.canvasId) {
      throw new Error(
        `Meta mismatch [canvasId]: expected "${globalMeta.info.canvasId}", received "${meta.info.canvasId}".`,
      );
    }

    this.#results.tests[id] = output;

    if (!this.#constraints.save) {
      this.#displayAnalysis(this.#results as any);
      return;
    }
    // ---------------------------------------------------------------------------
    // Persist
    // ---------------------------------------------------------------------------
    console.clear();
    this.#displayAnalysis(this.#results as any);
    this.#saveTest(this.#results);
  }

  /**
   * Persists test results to local server endpoint via HTTP POST.
   *
   * Behavior:
   * - Sends `fileUrl`, `meta`, and `tests` as JSON payload
   * - Delegates storage responsibility to backend (`/save`)
   * - Asynchronous, but response is not validated or consumed
   *
   * @param fileUrl - Source identifier for resolving storage location
   * @param meta - Optional metadata describing test context
   * @param tests - Collection of test outputs indexed by ID
   *
   * @sideEffects
   * - Triggers network request to local server
   *
   * @risk
   * - No error handling → silent failures possible
   * - No response validation → assumes success blindly
   * - Hardcoded endpoint → no environment flexibility
   */
  async #saveTest({ fileUrl, meta, tests }: SaveFileData) {
    try {
      await fetch("http://localhost:4000/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          save: this.#constraints.save,
          fileUrl,
          meta,
          tests,
        }),
      });
    } catch (e) {}
  }

  /**
   * Displays a structured analysis of test results in the terminal.
   *
   * This function summarizes:
   * - Meta information (module, test type, canvas ID, library version)
   * - Individual test outcomes (pass/fail per test case)
   * - Aggregate statistics (total, passed, failed)
   *
   * A test is considered **PASS** only if all its assertions have status `'pass'`.
   *
   * @param fileData - The complete test file data object containing:
   * - meta: Metadata about the test suite execution environment
   * - tests: A record of test cases keyed by unique test IDs
   *
   * @example
   * displayAnalysis(fileData);
   */

  #displayAnalysis(fileData: { meta: MetaData; tests: Tests }) {
    const { meta, tests } = fileData;
    if (!meta || !tests) return;
    const info = meta?.info || {};
    const env = meta?.environment || {};

    console.log("\n\t================ TEST ANALYSIS ================\n");

    console.log(`\tModule      : ${info.module}`);
    console.log(`\tTest Type   : ${info.testType}`);
    console.log(`\tCanvas ID   : ${info.canvasId}`);
    console.log(`\tLibrary Ver : ${env.libraryVersion}`);
    console.log("\n\t===============================================\n\n");

    let total = 0;
    let passed = 0;
    let failed = 0;

    console.log("\n\t================ ALL TEST CASES ===============\n");

    for (const [id, test] of Object.entries(tests)) {
      total++;

      const status = (test as any).status;

      if (!status || status.totalFailedAssertions === 0) {
        passed++;

        console.log(`\t${total} - ${id}\t\t ✔`);
        continue;
      }

      failed++;

      console.log(`\t${total} - ${id}\t\t ✖`);

      console.log(
        `\tFailed Assertions : ${status.totalFailedAssertions}/${status.totalPassedAssertions + status.totalFailedAssertions}`,
      );

      for (const assertion of (test as any).assertions) {
        if (assertion.actualStatus === assertion.expectedStatus) {
          continue;
        }

        console.log(`\n\t  • Domain    : ${assertion.domain}`);
        console.log(`\t    Property  : ${assertion.property}`);

        if (assertion.checkType) {
          console.log(`\t    Check     : ${assertion.checkType}`);
        }

        console.log(`\t    Expected  : ${assertion.expectedStatus}`);

        console.log(`\t    Actual    : ${assertion.actualStatus}`);

        if (assertion.reason) {
          console.log(`\t    Reason    : ${assertion.reason}`);
        }

        if (assertion.actual !== undefined) {
          console.log(`\t    Actual Value   : ${assertion.actual}`);
        }

        if (assertion.expected !== undefined) {
          console.log(`\t    Expected Value : ${assertion.expected}`);
        }

        if (assertion.delta !== undefined) {
          console.log(`\t    Delta          : ${assertion.delta}`);
        }

        if (assertion.tolerance !== undefined) {
          console.log(`\t    Tolerance      : ${assertion.tolerance}`);
        }
      }

      console.log();
    }

    console.log("\n\t===============================================\n\n");

    console.log("\n\t------------------- SUMMARY -------------------");
    console.log(`\tTotal Tests : ${total}`);
    console.log(`\tPassed      : ${passed} ✔`);
    console.log(`\tFailed      : ${failed} ✖`);
    console.log("\n\t===============================================\n\n");
  }

  /**
   * Captures the current state of all style and geometry properties referenced
   * by the expected verification configuration.
   *
   * Only properties explicitly requested by the test are captured. Duplicate
   * properties across multiple comparison groups are automatically ignored.
   *
   * This method performs no validation or comparison. It simply snapshots the
   * current internal state of the target shape for later verification.
   *
   * @param expected - Expected verification configuration.
   *
   * @returns Snapshot containing the requested style and geometry values.
   */
  #captureState(expected: shTestParams["expect"]): DataState {
    const shape = (
      this.#context.shapes as Record<string, GraphicsRenderNodeWithInternals>
    )[expected.testSubject];

    const styleProps = new Set<string>();
    const geometryProps = new Set<string>();
    const validatorProps = new Set<string>();

    const style = shape.style as Record<string, unknown>;
    const geometry = shape.geometry as Record<string, unknown>;
    /**
     * Adds all property names from the provided object into the target set while
     * ignoring metadata keys.
     */
    const collectProps = (
      target: Set<string>,
      source?: Record<string, unknown>,
    ) => {
      if (!source) return;

      for (const key of Object.keys(source)) {
        if (key === "expectedStatus" || key === "tolerance") continue;
        target.add(key);
      }
    };

    const getCopy = (property: string): any => {
      const copy = (value: any): any => {
        if (value === null || typeof value !== "object") {
          return value;
        }

        if (Array.isArray(value)) {
          return value.map(copy);
        }

        const result: Record<string, any> = {};

        for (const key in value) {
          result[key] = copy(value[key]);
        }

        return result;
      };

      if (property in style) {
        return copy(style[property]);
      }

      if (property in geometry) {
        return copy(geometry[property]);
      }

      return undefined;
    };

    // --------------------------------------------------------------------------
    // Collect requested style properties
    // --------------------------------------------------------------------------

    collectProps(styleProps, expected.style?.attrs);
    collectProps(styleProps, expected.style?.notEqualTo);

    // --------------------------------------------------------------------------
    // Collect requested geometry properties
    // --------------------------------------------------------------------------

    collectProps(geometryProps, expected.geometry?.equalTo);
    collectProps(geometryProps, expected.geometry?.notEqualTo);
    collectProps(geometryProps, expected.geometry?.greaterThan);
    collectProps(geometryProps, expected.geometry?.lessThan);
    collectProps(geometryProps, expected.geometry?.greaterThanOrEqual);
    collectProps(geometryProps, expected.geometry?.lessThanOrEqual);

    collectProps(validatorProps, expected?.validators);
    // --------------------------------------------------------------------------
    // Capture current state
    // --------------------------------------------------------------------------
    let snapshot = {} as DataState;

    for (const property of validatorProps) {
      (snapshot["user-defined"] ??= {})[property] = getCopy(property);
    }

    for (const property of styleProps) {
      (snapshot["style"] ??= {})[property] = style[property];
    }

    for (const property of geometryProps) {
      (snapshot["geometry"] ??= {})[property] = geometry[property];
    }

    return snapshot;
  }

  // ================= PRIVATE =================

  /**
   * Resets internal execution state for a fresh test cycle.
   *
   * Behavior:
   * - Reinitializes shared context (`#ctx`)
   * - Clears all accumulated errors across phases
   *
   * @sideEffects
   * - Discards all previous runtime state and errors
   *
   * @risk
   * - Does not reset `#results` → previous outputs persist
   * - Must be called manually → no automatic isolation guarantee
   */
  public resetState() {
    this.#context = { shapes: {} } as Context;
    this.#errors = {
      setupErrors: [],
      actionErrors: [],
      verifyErrors: [],
    };

    this.#results.tests = {};
  }

  /**
   * Validates structural integrity of a sh test definition.
   *
   * Ensures presence of mandatory components:
   * - testInfo
   * - setup
   * - actions
   * - expect (verify block)
   *
   * @param testDef - Incoming test definition
   *
   * @throws Error if any required field is missing
   *
   * @risk
   * - No type validation → only existence is checked
   * - Does not validate internal structure of fields
   */
  #validateTest(testDef: shTestParams) {
    if (!testDef.testInfo) throw new Error("Missing test info");
    if (!testDef.actions) throw new Error("Missing actions()");
    if (!testDef.expect) throw new Error("Missing verify()");
  }

  /**
   * Handles and reports errors for a specific execution phase.
   *
   * Behavior:
   * - Logs phase identifier
   * - Iterates and logs all collected errors
   *
   * @param stage - Execution phase (setup | action | verify)
   * @param errors - Array of captured errors
   *
   * @sideEffects
   * - Outputs errors to console
   *
   * @risk
   * - No propagation → execution failures are not programmatically handled
   * - Logging-only strategy → no structured error recovery
   */
  #handleErrors(stage: string, errors: Error[]) {
    console.error(`Error in ${stage} phase`);
    errors.forEach((e) => console.error(e));
  }

  /**
   * Executes verification logic against a frozen snapshot of context.
   *
   * Flow:

   * - Merges runtime constraints
   * - Iterates over target shapes
   * - Applies style, geometry, and error validations
   * - Collects assertion results
   *
   * @param verifyBlock - Verification configuration (shapes + rules)
   * @param ctx - Current execution context
   *
   * @returns Array of assertion results
   *
   * @throws Error if no validation criteria (style/geometry/error) provided
   *
   * @sideEffects
   * - Mutates internal constraints (`#constraints`)
   *
   * @risk
   * - Uses live ctx instead of snapshot for shape access → inconsistency risk
   * - No validation for missing shapes → undefined access possible
   */
  #runVerify(verifyBlock: ExpectedBlock, ctx: Context) {
    const assertions: OutputParam["assertions"] = [];

    const { testSubject, style, geometry, error, validators } = verifyBlock;

    if (!testSubject) throw new Error("test subject is not provided");
    if (!(testSubject in ctx.shapes))
      throw new Error("test subject is not available in context");
    if (!style && !geometry && !error && !validators) {
      throw new Error("No testing parameter provided");
    }

    const shape = ctx.shapes[testSubject] as GraphicsRenderNodeWithInternals;

    if (style) {
      this.#verifyStyle(shape, style, assertions);
    }

    if (geometry) {
      this.#verifyGeometry(shape, geometry, assertions);
    }
    if (validators) {
      console.log(validators);
      this.#verifyValidators(shape, assertions, validators);
    }

    if (error) {
      this.#verifyError(error, assertions);
    }

    return assertions;
  }

  /**
   * Verifies the style state of a shape against the expected specification.
   *
   * For each requested style property, assertions are generated using the
   * enabled oracle(s):
   * - Library oracle: compares against the library's internal style state.
   * - Browser oracle: compares against the browser's computed style.
   *
   * Supported comparison modes:
   * - Equality (`attrs`)
   * - Inequality (`notEqualTo`)
   *
   * @param shape - Target shape under verification.
   * @param style - Expected style verification specification.
   * @param assertions - Assertion accumulator.
   *
   * @remarks
   * This method performs verification only. It does not mutate the shape or the
   * testing context.
   */
  #verifyStyle(
    shape: GraphicsRenderNodeWithInternals,
    style: ExpectedBlock["style"],
    assertions: OutputParam["assertions"],
  ): void {
    if (!style) return;

    const oracle = this.#getOracleFlags();

    const element = shape[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );
    const computedStyle = window.getComputedStyle(element);
    const libraryStyle = shape.style as Record<string, Primitive>;

    const verifyGroup = (
      properties: StyleData | undefined,
      mode: "eq" | "neq",
    ) => {
      if (!properties) return;

      for (const [property, data] of Object.entries(properties)) {
        const { value: expected, expectedStatus } = data;

        const compare = (actual: Primitive) =>
          ["fill", "stroke"].includes(property)
            ? this.#compareColor(actual as string, expected as string, mode)
            : this.#compare(actual, expected, mode);

        if (oracle.library) {
          const result = compare(libraryStyle[property]);

          assertions.push({
            crossCheck: "library",
            domain: "style",
            property,
            expectedStatus,
            checkType: mode,
            ...result,
          });
        }

        if (oracle.browser) {
          const result = compare(computedStyle[property as any] as Primitive);

          assertions.push({
            crossCheck: "browser",
            domain: "style",
            property,
            expectedStatus,
            checkType: mode,
            ...result,
          });
        }
      }
    };

    verifyGroup(style.attrs, "eq");
    verifyGroup(style.notEqualTo, "neq");
  }

  /**
   * Verifies the geometry state of a shape against the expected specification.
   *
   * Supported comparison modes:
   * - Equality
   * - Inequality
   * - Greater than
   * - Less than
   * - Greater than or equal
   * - Less than or equal
   *
   * Geometry assertions are performed against the library's internal geometry
   * state. Bounding box assertions additionally compare the library-generated
   * bounding box with the browser-computed bounding box.
   *
   * @param shape - Target shape under verification.
   * @param geometry - Expected geometry verification specification.
   * @param assertions - Assertion accumulator.
   *
   * @remarks
   * This method performs verification only and does not mutate the testing
   * context or the target shape.
   */
  #verifyGeometry(
    shape: GraphicsRenderNodeWithInternals,
    geometry: ExpectedBlock["geometry"],
    assertions: OutputParam["assertions"],
  ): void {
    if (!geometry) return;

    const oracle = this.#getOracleFlags();
    const actualGeometry = shape.geometry as Record<string, number>;

    const verifyGroup = (
      properties: GeometryData | undefined,
      mode: CompareMode,
    ) => {
      if (!properties || !oracle.library) return;

      for (const [property, data] of Object.entries(properties)) {
        const { value: expected, expectedStatus, tolerance = 0 } = data;

        const result = this.#compareNumber(
          actualGeometry[property],
          expected as number,
          tolerance,
          mode,
        );

        assertions.push({
          crossCheck: "library",
          domain: "geometry",
          property,
          expectedStatus,
          checkType: mode,
          ...result,
        });
      }
    };

    verifyGroup(geometry.equalTo, "eq");
    verifyGroup(geometry.notEqualTo, "neq");
    verifyGroup(geometry.greaterThan, "gt");
    verifyGroup(geometry.lessThan, "lt");
    verifyGroup(geometry.greaterThanOrEqual, "gte");
    verifyGroup(geometry.lessThanOrEqual, "lte");
  }

  /**
   * Executes all custom validators defined in the expected block.
   *
   * Unlike built-in style and geometry assertions, validators allow users
   * to implement arbitrary validation logic by providing their own callback.
   *
   * Each validator receives the current test subject and its corresponding
   * expected value, and returns an assertion status (`"pass"` or `"fail"`).
   * The returned status is then compared against the expected status to
   * determine whether the assertion itself passed.
   *
   * This mechanism is intended for advanced scenarios that cannot be
   * expressed using the built-in assertions, such as:
   *
   * - Custom bounding box validation.
   * - Clone or deep-copy verification.
   * - Matrix or transformation validation.
   * - Multiple property validation.
   * - Internal state verification.
   * - Any user-defined assertion logic.
   *
   * @param shape The test subject.
   * @param validators Collection of custom validators to execute.
   *
   * @returns The total number of passed and failed assertions.
   */
  #verifyValidators(
    shape: GraphicsRenderNodeWithInternals,
    assertions: OutputParam["assertions"],
    validators?: Validators,
  ) {
    if (!validators) {
      return;
    }

    console.log("validators");
    for (const [property, validator] of Object.entries(validators)) {
      const {
        validate,
        expectedStatus,
        value,
        tolerance = 0,
      } = validator as Validator;
      const actualStatus = validate(shape, { value, tolerance });

      assertions.push({
        crossCheck: "library",
        domain: "user-defined",
        expected: value,
        property,
        expectedStatus,
        checkType: "custom",
        actualStatus,
      });
    }
  }

  /**
   * Verifies an expected error assertion.
   *
   * This method records whether an expected error is thrown and generates a
   * corresponding assertion result. It does not execute the actual failure path;
   * instead, it validates the supplied error object as part of the testing
   * pipeline.
   *
   * @param error - Expected error specification.
   * @param assertions - Assertion accumulator.
   *
   * @remarks
   * Only the existence of the thrown error is verified. Detailed comparisons
   * such as error type, message, cause, or stack trace are intentionally left
   * to higher-level validation.
   */
  #verifyError(
    error: ExpectedBlock["error"],
    assertions: OutputParam["assertions"],
  ): void {
    if (!error) return;

    let actual: Error | null = null;

    try {
      throw error.expected;
    } catch (thrown) {
      actual = thrown as Error;
    }

    assertions.push({
      domain: "error",
      property: "throws",
      actualStatus: actual ? "pass" : "fail",
      expectedStatus: error.expectedStatus,
      expected: error.expected,
      actual,
    });
  }

  /**
   * Compares numeric values with tolerance and relational mode.
   *
   * Modes:
   * - eq → absolute difference within tolerance
   * - gt → actual greater than expected
   * - lt → actual less than expected
   *
   * @param actual - Observed numeric value
   * @param expected - Target numeric value
   * @param tolerance - Allowed deviation for equality
   * @param mode - Comparison mode
   *
   * @returns GeometryCheckResult with delta and pass/fail status
   *
   * @risk
   * - No NaN/Infinity handling
   * - Tolerance ignored for gt/lt modes
   */

  #compareNumber(
    actual: number,
    expected: number,
    tolerance: number,
    mode: CompareMode,
  ): GeometryCheckResult {
    const delta = Math.abs(actual - expected);

    let pass = false;
    let reason = "";

    switch (mode) {
      case "eq":
        pass = delta <= tolerance;
        reason = "equal (within tolerance)";
        break;

      case "neq":
        pass = delta > tolerance;
        reason = "not equal (outside tolerance)";
        break;

      case "gt":
        pass = actual > expected;
        reason = "greater than";
        break;

      case "lt":
        pass = actual < expected;
        reason = "less than";
        break;

      case "gte":
        pass = actual > expected || delta <= tolerance;
        reason = "greater than or equal (with tolerance)";
        break;

      case "lte":
        pass = actual < expected || delta <= tolerance;
        reason = "less than or equal (with tolerance)";
        break;
    }

    return {
      actual,
      expected,
      delta,
      tolerance,
      actualStatus: pass ? "pass" : "fail",
      reason,
    };
  }

  /**
   * Performs strict equality comparison between primitive values.
   *
   * Behavior:
   * - Uses strict equality (`===`)
   * - No coercion or normalization applied
   *
   * @param actual - Observed value
   * @param expected - Target value
   *
   * @returns OracleResult with pass/fail status
   *
   * @risk
   * - Fails for semantically equal but structurally different values (e.g., "1" vs 1)
   */

  #compare(
    actual: Primitive,
    expected: Primitive,
    check: "eq" | "neq" = "eq",
  ): OracleResult {
    const pass = check === "eq" ? actual === expected : actual !== expected;

    return {
      actual,
      expected,
      actualStatus: pass ? "pass" : "fail",
    };
  }

  /**
   * Resolves active oracle flags controlling verification sources.
   *
   * Behavior:
   * - Returns configured oracle flags if present
   * - Falls back to default: { library: true, browser: true }
   *
   * @returns Object specifying enabled verification channels
   *
   * @risk
   * - No validation of constraint structure
   * - Silent fallback may mask configuration errors
   */
  #getOracleFlags() {
    return this.#constraints.oracle ?? { library: true, browser: true };
  }

  /**
   * Converts rectangle parameters into corner coordinates.
   *
   * Order:
   * - Top-Left → Top-Right → Bottom-Right → Bottom-Left
   *
   * @param x - X coordinate of top-left
   * @param y - Y coordinate of top-left
   * @param w - Width of rectangle
   * @param h - Height of rectangle
   *
   * @returns Array of 4 corner points [x, y]
   *
   * @risk
   * - Assumes positive width/height
   * - No normalization for negative dimensions
   */
  #cornersFromRect(x: number, y: number, w: number, h: number) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ] as [number, number][];
  }

  /**
   * Computes expected bounding box points from library space.
   *
   * Behavior:
   * - Uses shape.getBBox() (SVG local coordinates)
   * - Converts to 4 corner points
   *
   * @param shape - Target shape instance
   *
   * @returns Array of 4 corner points
   *
   * @risk
   * - Uses local coordinate system (not screen space)
   * - Ignores transforms unless handled internally by library
   */
  #getLibraryBBoxPoints(shape: GraphicsRenderNode) {
    const { x, y, width, height } = shape.getBBox();

    const corners = this.#cornersFromRect(x, y, width, height);
    return corners;
  }

  /**
   * Computes actual bounding box points from browser-rendered layout.
   *
   * Behavior:
   * - Uses getBoundingClientRect() (screen space)
   * - Adjusts for canvas border and padding offsets
   * - Normalizes coordinates relative to canvas origin
   *
   * @param canvas - Canvas instance containing the shape
   * @param shape - Target shape instance
   *
   * @returns Array of 4 normalized corner points
   *
   * @risk
   * - Dependent on DOM layout and CSS styles
   * - Offset calculation assumes box-model correctness
   * - No handling for transforms (scale/rotate)
   */
  #getBrowserBBoxPoints(canvas: any, shape: GraphicsRenderNodeWithInternals) {
    const canvasEl = canvas[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );
    const canvasRect = canvasEl.getBoundingClientRect();

    const styles = window.getComputedStyle(canvasEl);

    const borderLeft = parseFloat(styles.borderLeftWidth || "0");
    const borderTop = parseFloat(styles.borderTopWidth || "0");

    const paddingLeft = parseFloat(styles.paddingLeft || "0");
    const paddingTop = parseFloat(styles.paddingTop || "0");

    const offsetX = canvasRect.x + borderLeft + paddingLeft;
    const offsetY = canvasRect.y + borderTop + paddingTop;

    const shapeFig = shape[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );
    const rect = shapeFig.getBoundingClientRect();

    const { x, y, width, height } = rect;

    const corners = this.#cornersFromRect(x, y, width, height);

    const cor = corners.map(([px, py]) => [px - offsetX, py - offsetY]) as [
      number,
      number,
    ][];

    return cor;
  }

  /**
   * Compares two bounding box corner matrices with tolerance.
   *
   * Behavior:
   * - Expects exactly 4 corner points in each input
   * - Computes per-point deviation (dx, dy)
   * - Fails if any deviation exceeds epsilon
   *
   * @param actual - Observed corner points (browser)
   * @param expected - Reference corner points (library)
   * @param epsilon - Allowed deviation threshold
   *
   * @returns Comparison result with pass/fail status
   *
   * @throws Error if input does not contain exactly 4 points
   *
   * @risk
   * - Single-point failure invalidates entire result
   * - Uses uniform epsilon → no axis-specific tolerance
   * - No detailed delta reporting per corner
   */
  #compareBBoxMatrices(
    actual: [number, number][],
    expected: [number, number][],
    epsilon = 0.5,
  ): {
    actual: [number, number][];
    expected: [number, number][];
    delta: number;
    actualStatus: "pass" | "fail";
  } {
    if (actual.length !== 4 || expected.length !== 4)
      throw new Error("BBox must have 4 corners.");

    let pass = true;

    for (let i = 0; i < 4; i++) {
      const [ax, ay] = actual[i]!;
      const [ex, ey] = expected[i]!;

      const dx = Math.abs(ax - ex);
      const dy = Math.abs(ay - ey);

      if (dx > epsilon || dy > epsilon) {
        pass = false;
        break;
      }
    }

    return {
      actual,
      expected,
      delta: epsilon,
      actualStatus: pass ? "pass" : "fail",
    };
  }

  /**
   * Converts any valid CSS color string into RGBA tuple.
   *
   * Behavior:
   * - Applies input color to a temporary DOM element
   * - Extracts computed color (normalized to rgb/rgba)
   * - Parses into numeric RGBA components
   *
   * @param input - CSS color string (hex, rgb, named, etc.)
   *
   * @returns RGBA tuple [r, g, b, a]
   *
   * @throws Error if color cannot be parsed
   *
   * @risk
   * - Requires DOM → not usable in non-browser environments
   * - Implicit normalization depends on browser engine
   */
  #toRGBA(input: string): RGBA {
    const el = document.createElement("div");
    el.style.color = input;

    document.body.appendChild(el);

    const computed = getComputedStyle(el).color;

    document.body.removeChild(el);

    const match = computed.match(/rgba?\(([^)]+)\)/);
    if (!match) throw new Error("Invalid color");

    const parts = match[1].split(",").map((v) => parseFloat(v.trim()));

    const [r, g, b, a = 1] = parts;
    return [r, g, b, a];
  }

  /**
   * Compares two color values by normalizing them to RGBA.
   *
   * Behavior:
   * - Converts both actual and expected colors to RGBA
   * - Performs component-wise comparison with tolerance
   *
   * @param actual - Observed color value
   * @param expected - Expected color value
   *
   * @returns OracleResult with pass/fail status
   *
   * @risk
   * - Relies on #toRGBA → inherits DOM dependency
   * - No error handling → invalid colors will throw upstream
   */
  #compareColor(
    actual: string,
    expected: string,
    check: "eq" | "neq" = "eq",
  ): OracleResult {
    const a = this.#toRGBA(actual);
    const e = this.#toRGBA(expected);

    const pass = this.#compareRGBA(a, e, 0.025, check);

    return {
      actual,
      expected,
      actualStatus: pass ? "pass" : "fail",
    };
  }

  /**
   * Performs component-wise RGBA comparison with tolerance.
   *
   * Behavior:
   * - Compares each channel (r, g, b, a)
   * - Fails if any component exceeds epsilon threshold
   *
   * @param a - First RGBA tuple
   * @param b - Second RGBA tuple
   * @param epsilon - Allowed deviation per channel
   *
   * @returns boolean indicating match result
   *
   * @risk
   * - Uniform epsilon for all channels → not perceptually accurate
   * - No clamping/validation of RGBA ranges
   */

  #compareRGBA(
    a: RGBA,
    b: RGBA,
    epsilon = 0.025,
    check: "eq" | "neq" = "eq",
  ): boolean {
    let equal = true;

    for (let i = 0; i < 4; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) {
        equal = false;
        break;
      }
    }

    return check === "eq" ? equal : !equal;
  }
}
