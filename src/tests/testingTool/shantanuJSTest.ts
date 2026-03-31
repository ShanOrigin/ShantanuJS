import { type ShantanuTypes, Shantanu } from '../../index/index.js';
import { iShape } from '../../shapes/provider/shapesTypes';

import { DEV_INTERNAL_ACCESS } from '../../utils/internals/accessKeys.js';
import { getBrowserInfoLegacy } from './browserInfo.js';

import type {
  verifyParams,
  testInfo,
  constraintsParams,
  Terrors,
  env,
  metaData,
  GeometryCheckResult,
  Primitive,
  OracleResult,
  outputParam,
  RGBA,
  saveFileData,
  geoAttrMap,
  CompareMode
} from './types';

export type ctxParam = {
  shapes: Record<string, iShape>;
  canvas: Shantanu.Canvas;
};

export type fn = (api: ShantanuTypes, ctx: ctxParam) => void;

export type visualTestParams = {
  testInfo: testInfo;
  setup: fn;
  actions: fn;
  expect: verifyParams;
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
   * Reference to the core Shantanu rendering/logic API.
   *
   * This acts as the execution engine exposed to:
   * - setup phase
   * - action phase
   *
   * It is intentionally fixed at initialization to prevent
   * runtime API swapping, which would invalidate test determinism.
   *
   * @type ShantanuTypes
   *
   * @invariant
   * - Must remain immutable during test lifecycle
   */
  #api: ShantanuTypes = Shantanu;

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
   * @type ctxParam
   *
   * @risk
   * - No isolation between tests → shared mutable state
   * - Requires manual discipline to avoid state leakage
   */
  #ctx = { shapes: {} } as ctxParam;

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
  #errors: Terrors = {
    setupErrors: [],
    actionErrors: [],
    verifyErrors: []
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
  #results: saveFileData = {
    fileUrl: '',
    tests: {}
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
  #constraints: constraintsParams = {
    save: false,
    oracle: { browser: true, library: true }
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
    this.#results['fileUrl'] = path;
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
    run
  }: {
    initialize: (api: ShantanuTypes, ctx: ctxParam) => void;
    run: (ctx: ctxParam) => void;
  }) {
    try {
      initialize(this.#api, this.#ctx);
    } catch (e) {
      console.error('Error in env initialize callback');
      console.error(e);
      return;
    }

    run(this.#ctx);
  }

  /**
   * Executes a complete visual test lifecycle: setup → actions → verify → persist.
   *
   * Flow:
   * - Validates test definition
   * - Runs setup and actions with canvas flush between phases
   * - Executes verification to produce assertions
   * - Generates unique test ID and metadata
   * - Enforces meta consistency across executions
   * - Stores result and triggers persistence
   *
   * Error Handling:
   * - Each phase (setup/action/verify) is isolated
   * - Errors are collected and short-circuit execution per phase
   *
   * @param testDef - Visual test definition (setup, actions, expect, metadata)
   *
   * @sideEffects
   * - Mutates shared ctx and internal results
   * - Writes test output via #saveTest
   *
   * @risk
   * - Shared ctx → state leakage between tests
   * - Hard meta enforcement → breaks cross-context reuse
   * - No rollback → partial state persists on failure
   */
  public visualTest(testDef: visualTestParams) {
    this.#validateTest(testDef);

    const { setupErrors, actionErrors, verifyErrors } = this.#errors;

    // ---------------- SETUP ----------------
    try {
      testDef.setup(this.#api, this.#ctx);
      this.#ctx.canvas.flush();
    } catch (e) {
      setupErrors.push(e as Error);
    }

    if (setupErrors.length) return this.#handleErrors('setup', setupErrors);

    // ---------------- ACTION ----------------
    try {
      testDef.actions(this.#api, this.#ctx);
      this.#ctx.canvas.flush();
    } catch (e) {
      actionErrors.push(e as Error);
    }

    if (actionErrors.length) return this.#handleErrors('action', actionErrors);

    // ---------------- VERIFY ----------------
    let assertions: outputParam['assertions'] = [];

    try {
      assertions = this.#runVerify(testDef.expect, this.#ctx);
    } catch (e) {
      verifyErrors.push(e as Error);
    }

    if (verifyErrors.length) return this.#handleErrors('verify', verifyErrors);

    // ---------------- OUTPUT ----------------
    const { testType, element, module } = testDef.testInfo;
    const id = `${testType}-${module}-${element}-${this.#idNumber++}`;

    const canvasId = this.#ctx.canvas.attrs('id') as string;
    const browserInfo = getBrowserInfoLegacy() as env;

    const meta: metaData = {
      info: {
        module: module!,
        testType: testType!,
        canvasId
      },
      environment: {
        libraryVersion: '0.0.0',
        ...browserInfo
      }
    };

    const output: outputParam = {
      information: { ...testDef.testInfo, id },
      assertions
    };

    if ('meta' in this.#results) {
      const gMeta = this.#results.meta;

      if (gMeta) {
        if (gMeta.info.module !== meta.info.module) {
          throw new Error(
            `Meta mismatch [module]: expected "${gMeta.info.module}", received "${meta.info.module}"`
          );
        }

        if (gMeta.info.testType !== meta.info.testType) {
          throw new Error(
            `Meta mismatch [testType]: expected "${gMeta.info.testType}", received "${meta.info.testType}"`
          );
        }

        if (gMeta.info.canvasId !== meta.info.canvasId) {
          throw new Error(
            `Meta mismatch [canvasId]: expected "${gMeta.info.canvasId}", received "${meta.info.canvasId}"`
          );
        }
      } else {
        this.#results.meta = meta;
      }
    } else {
      this.#results['meta'] = meta;
      this.#results['tests'] = {};
    }

    this.#results['tests'][id] = output;

    console.log(this.#results);
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
  async #saveTest({ fileUrl, meta, tests }: saveFileData) {
    await fetch('http://localhost:4000/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        save: this.#constraints.save,
        fileUrl,
        meta,
        tests
      })
    });
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
    this.#ctx = { shapes: {} } as ctxParam;
    this.#errors = {
      setupErrors: [],
      actionErrors: [],
      verifyErrors: []
    };
  }

  /**
   * Validates structural integrity of a visual test definition.
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
  #validateTest(testDef: visualTestParams) {
    if (!testDef.testInfo) throw new Error('Missing test info');
    if (!testDef.setup) throw new Error('Missing setup()');
    if (!testDef.actions) throw new Error('Missing actions()');
    if (!testDef.expect) throw new Error('Missing verify()');
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
  #runVerify(verifyBlock: verifyParams, ctx: ctxParam) {
    const assertions: outputParam['assertions'] = [];

    const { shapes, constraints, style, geometry, error } = verifyBlock;

    this.#constraints = { ...this.#constraints, ...constraints };

    if (!style && !geometry && !error) {
      throw new Error('No testing parameter provided');
    }

    for (const i of shapes) {
      const shape = ctx.shapes[i];

      if (style) {
        this.#verifyStyle(shape, style, assertions);
      }

      if (geometry) {
        this.#verifyGeometry(shape, geometry, assertions);
      }

      if (error) {
        this.#verifyError(error, assertions);
      }
    }

    return assertions;
  }

  /**
   * Verifies style properties of a shape against expected values.
   *
   * Flow:
   * - Resolves both library-level and browser-computed styles
   * - Normalizes property aliases (e.g., strokeColor → stroke)
   * - Compares actual vs expected using appropriate comparator
   * - Records assertions for each enabled oracle (library/browser)
   *
   * @param shape - Target shape instance
   * @param style - Expected style properties (key-value pairs)
   * @param assertions - Accumulator for assertion results
   *
   * @sideEffects
   * - Pushes assertion objects into provided array
   *
   * @risk
   * - Skips nested style objects silently
   * - Relies on DOM + computed styles → environment dependent
   * - No guard if shape or element is invalid
   */
  #verifyStyle(
    shape: iShape,
    style: verifyParams['style'],
    assertions: outputParam['assertions']
  ) {
    const oracle = this.#getOracleFlags();
    const el = shape.getIFig(DEV_INTERNAL_ACCESS);
    const computed = window.getComputedStyle(el);

    if (!style) return;

    for (let [prop, expected] of Object.entries(style)) {
      prop == 'strokeColor' && (prop = 'stroke');
      prop == 'strokeWidth' && (prop = 'stroke-width');

      // Ignore complex/nested style definitions
      if (typeof expected === 'object') continue;

      if (oracle.library) {
        const actual = shape.attrs(prop) as Primitive;

        const result = ['stroke', 'fill'].includes(prop)
          ? this.#compareColor(actual as string, expected as string)
          : this.#compare(actual, expected as Primitive);

        assertions.push({
          crossCheck: 'library',
          domain: 'style',
          property: prop,
          ...result
        });
      }

      if (oracle.browser) {
        const actual = (computed as any)[prop] as Primitive;

        const result = ['stroke', 'fill'].includes(prop)
          ? this.#compareColor(actual as string, expected as string)
          : this.#compare(actual, expected as Primitive);

        assertions.push({
          crossCheck: 'browser',
          domain: 'style',
          property: prop,
          ...result
        });
      }
    }
  }

  /**
   * Verifies geometric properties of a shape using tolerance-based comparison.
   *
   * Flow:
   * - Resolves tolerance from constraints (default fallback applied)
   * - Processes geometry rules (attr/equalTo/greaterThan/lessThan)
   * - Compares values via library attributes and/or browser BBox matrices
   * - Pushes assertion results per oracle (library/browser)
   *
   * @param shape - Target shape instance
   * @param geometry - Geometry rules with comparison modes
   * @param assertions - Accumulator for assertion results
   *
   * @sideEffects
   * - Appends geometry assertions into provided array
   *
   * @risk
   * - Browser check ignores per-property mapping (BBox-level only)
   * - No guard for missing attributes → undefined comparisons
   * - Recomputes BBox inside loop → inefficient for large inputs
   */
  #verifyGeometry(
    shape: iShape,
    geometry: verifyParams['geometry'],
    assertions: outputParam['assertions']
  ) {
    const tolerance = 0;

    const process = (attrs: geoAttrMap, mode: CompareMode) => {
      const localTolerance =
        'tolerance' in attrs ? attrs.tolerance ?? 0 : tolerance;

      for (const [k, expected] of Object.entries(attrs)) {
        if (k === 'tolerance') continue;
        const oracle = this.#getOracleFlags();

        if (oracle.library) {
          const actualLib = shape.attrs(k) as number;
          const resultLib = this.#compareNumber(
            actualLib,
            expected as number,
            localTolerance,
            mode
          );

          assertions.push({
            crossCheck: 'library',
            domain: 'geometry',
            property: k,
            ...resultLib
          });
        }
      }
    };

    if (!geometry) return;

    geometry.attr && process(geometry.attr, 'eq');
    geometry.equalTo && process(geometry.equalTo, 'eq');
    geometry.greaterThan && process(geometry.greaterThan, 'gt');
    geometry.lessThan && process(geometry.lessThan, 'lt');

    // NEW (recommended)
    geometry.greaterThanOrEqual && process(geometry.greaterThanOrEqual, 'gte');
    geometry.lessThanOrEqual && process(geometry.lessThanOrEqual, 'lte');

    if (geometry.bbox) {
      const oracle = this.#getOracleFlags();

      if (oracle.browser && geometry && geometry.bbox.check) {
        const libBBox = this.#getLibraryBBoxPoints(shape);
        const browserBBox = this.#getBrowserBBoxPoints(
          this.#ctx['canvas'],
          shape
        );

        const resultBrowser = this.#compareBBoxMatrices(
          libBBox,
          browserBBox,
          geometry?.bbox?.tolerance ?? 0.25
        );

        assertions.push({
          crossCheck: 'browser',
          domain: 'geometry',
          property: 'bbox',
          ...resultBrowser
        });
      }
    }
  }

  /**
   * Verifies that an expected error condition is triggered.
   *
   * Behavior:
   * - Simulates throwing the expected error
   * - Captures the thrown instance
   * - Records assertion comparing expected vs actual error
   *
   * @param errorBlock - Object containing expected Error instance
   * @param assertions - Accumulator for assertion results
   *
   * @sideEffects
   * - Appends error assertion into provided array
   *
   * @risk
   * - Does not execute real failure path → only validates presence of error object
   * - No deep comparison (message/type/stack not validated)
   */
  #verifyError(
    errorBlock: { expected: Error },
    assertions: outputParam['assertions']
  ) {
    const expected = errorBlock.expected;

    let thrown: Error | null = null;

    try {
      throw expected;
    } catch (e) {
      thrown = e as Error;
    }

    assertions.push({
      domain: 'error',
      property: 'throws',
      status: thrown ? 'pass' : 'fail',
      expected,
      actual: thrown
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
    mode: CompareMode
  ): GeometryCheckResult {
    const delta = Math.abs(actual - expected);

    let pass = false;
    let reason = '';

    switch (mode) {
      case 'eq':
        pass = delta <= tolerance;
        reason = 'equal (within tolerance)';
        break;

      case 'gt':
        pass = actual > expected;
        reason = 'greater than';
        break;

      case 'lt':
        pass = actual < expected;
        reason = 'less than';
        break;

      case 'gte':
        pass = actual > expected || delta <= tolerance;
        reason = 'greater than or equal (with tolerance)';
        break;

      case 'lte':
        pass = actual < expected || delta <= tolerance;
        reason = 'less than or equal (with tolerance)';
        break;
    }

    return {
      actual,
      expected,
      delta,
      tolerance,
      status: pass ? 'pass' : 'fail',
      reason
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
  #compare(actual: Primitive, expected: Primitive): OracleResult {
    return {
      actual,
      expected,
      status: actual === expected ? 'pass' : 'fail'
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
      [x, y + h]
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
  #getLibraryBBoxPoints(shape: iShape) {
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
  #getBrowserBBoxPoints(canvas: any, shape: iShape) {
    const canvasEl = canvas.getIFig(DEV_INTERNAL_ACCESS);
    const canvasRect = canvasEl.getBoundingClientRect();

    const styles = window.getComputedStyle(canvasEl);

    const borderLeft = parseFloat(styles.borderLeftWidth || '0');
    const borderTop = parseFloat(styles.borderTopWidth || '0');

    const paddingLeft = parseFloat(styles.paddingLeft || '0');
    const paddingTop = parseFloat(styles.paddingTop || '0');

    const offsetX = canvasRect.x + borderLeft + paddingLeft;
    const offsetY = canvasRect.y + borderTop + paddingTop;

    const shapeFig = shape.getIFig(DEV_INTERNAL_ACCESS);
    const rect = shapeFig.getBoundingClientRect();

    const { x, y, width, height } = rect;

    const corners = this.#cornersFromRect(x, y, width, height);

    const cor = corners.map(([px, py]) => [px - offsetX, py - offsetY]) as [
      number,
      number
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
    epsilon = 0.5
  ): {
    actual: [number, number][];
    expected: [number, number][];
    delta: number;
    status: 'pass' | 'fail';
  } {
    if (actual.length !== 4 || expected.length !== 4)
      throw new Error('BBox must have 4 corners.');

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
      status: pass ? 'pass' : 'fail'
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
    const el = document.createElement('div');
    el.style.color = input;

    document.body.appendChild(el);

    const computed = getComputedStyle(el).color;

    document.body.removeChild(el);

    const match = computed.match(/rgba?\(([^)]+)\)/);
    if (!match) throw new Error('Invalid color');

    const parts = match[1].split(',').map((v) => parseFloat(v.trim()));

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
  #compareColor(actual: string, expected: string): OracleResult {
    const a = this.#toRGBA(actual);
    const e = this.#toRGBA(expected);

    const pass = this.#compareRGBA(a, e);

    return {
      actual,
      expected,
      status: pass ? 'pass' : 'fail'
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
  #compareRGBA(a: RGBA, b: RGBA, epsilon = 0.025) {
    for (let i = 0; i < 4; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }
}
