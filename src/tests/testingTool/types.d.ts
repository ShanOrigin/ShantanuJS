// ============================================================================
// Common Types
// ============================================================================

/**
 * Supported comparison operators.
 */
export type CompareMode =
  "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "attr" | "custom";

/**
 * Primitive values supported by the testing framework.
 */
export type Primitive = string | number | boolean;

/**
 * Assertion execution status.
 */
export type AssertionStatus = "pass" | "fail";

export type DataState = {
  style?: Record<string, unknown>;
  geometry?: Record<string, unknown>;
  "user-defined"?: any;
};

export type StatesData = {
  before?: DataState;
  after?: DataState;
};
// ============================================================================
// Expected Input Types
// ============================================================================

/**
 * Expected value for a single style property.
 */
export type StylePropertyData = {
  value: Primitive;
  expectedStatus: AssertionStatus;
};

/**
 * Collection of style properties.
 */
export type StyleData = Record<string, StylePropertyData>;

/**
 * Expected value for a single geometry property.
 */
export type GeometryPropertyData = StylePropertyData & {
  tolerance?: number;
};

/**
 * Collection of geometry properties.
 */
export type GeometryData = Record<string, GeometryPropertyData>;

// ============================================================================
// Constraint Types
// ============================================================================

/**
 * Controls the behavior of the test execution pipeline.
 */
export type ConstraintsParams = {
  /**
   * Persists the test result to the output file.
   *
   * @default true
   */
  save?: boolean;

  /**
   * Enables one or more validation oracles.
   */
  oracle?: {
    /**
     * Cross-check results using the browser-computed values.
     *
     * @default true
     */
    browser?: boolean;

    /**
     * Cross-check results using the library's internal state.
     *
     * @default true
     */
    library?: boolean;
  };
};

/**
 * Represents a single custom validation rule.
 *
 * Use validators when the built-in `style`, `geometry`, or `error`
 * assertions are insufficient. A validator receives the test subject
 * and the expected value, and returns whether the validation passed
 * or failed.
 *
 * This allows testing any custom logic, such as:
 * - Bounding box validation with custom algorithms.
 * - Clone or deep-copy verification.
 * - Complex geometry calculations.
 * - Internal state validation.
 * - Multiple property checks.
 * - Any user-defined assertion.
 */
export type Validator = {
  /**
   * Expected value passed to the validation function.
   */
  value: unknown;

  /**
   * Expected outcome of the validation.
   */
  expectedStatus: AssertionStatus;
  tolerance?: number;
  /**
   * Performs custom validation.
   *
   * @param shape The test subject.
   * @param expected The expected value supplied above.
   *
   * @returns "pass" if the validation succeeds, otherwise "fail".
   */
  validate: (
    shape: GraphicsRenderNodeWithInternals,
    expected: { value: unknown; tolerance?: number },
    bboxes?: {
      getBrowserBBoxPoints?: (
        canvas: any,
        shape: GraphicsRenderNodeWithInternals,
      ) => [number, number][];
      getLibraryBBoxPoints?: (shape: GraphicsRenderNode) => [number, number][];
    },
  ) => AssertionStatus;
};

/**
 * Collection of custom validators.
 *
 * The key is an arbitrary validator name used only for reporting
 * and identification.
 */
export type Validators = Record<string, Validator>;

/**
 * Expected validation configuration.
 */
export type ExpectedBlock = {
  testSubject: string;

  constraints?: ConstraintsParams;

  style?: {
    attrs?: StyleData;
    notEqualTo?: StyleData;
  };

  geometry?: {
    equalTo?: GeometryData;
    notEqualTo?: GeometryData;
    greaterThan?: GeometryData;
    lessThan?: GeometryData;
    greaterThanOrEqual?: GeometryData;
    lessThanOrEqual?: GeometryData;
  };

  /**
   * Custom user-defined validation rules.
   */
  validators?: Validators;

  error?: {
    /** Error instance or constructor expected from the action phase. */
    expected: Error | (new (...args: any[]) => Error);
    expectedStatus: AssertionStatus;
  };
};

// ============================================================================
// Style Verification Types
// ============================================================================

/**
 * Result of a style comparison.
 */
export type OracleResult = {
  actualStatus: AssertionStatus;
  actual: Primitive;
  expected: Primitive;
};

// ============================================================================
// Geometry Verification Types
// ============================================================================

/**
 * Result of a geometry comparison.
 */
export type GeometryCheckResult = {
  actualStatus: AssertionStatus;
  actual: number | string | number[];
  expected: number | string | number[];
  delta?: number;
  tolerance?: number;
  reason?: string;
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Errors captured during different execution phases.
 */
export type TestErrors = {
  setupErrors: Error[];
  actionErrors: Error[];
  verifyErrors: Error[];
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * Test metadata.
 */
export type TestInfo = {
  module?: string;
  element?: string;
  testType?: string;
  description?: string;
};

/**
 * Overall assertion summary.
 */
export type TestStatus = {
  result: AssertionStatus;
  totalPassedAssertions: number;
  totalFailedAssertions: number;
};

/**
 * Single assertion result.
 */
export type AssertionResult = {
  crossCheck?: "library" | "browser" | "system";

  domain: "style" | "geometry" | "error" | "user-defined";
  checkType?: CompareMode;
  property: string;

  actualStatus: AssertionStatus;
  expectedStatus: AssertionStatus;

  actual?: unknown;
  expected?: unknown;

  delta?: number;
  tolerance?: number;
  reason?: string;
};

/**
 * Complete output of a single test case.
 */
export type OutputParam = {
  information: TestInfo & {
    id: string;
  };

  status?: TestStatus;

  states?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };

  assertions: AssertionResult[];
};
/**
 * Collection of executed tests.
 */
export type Tests = Record<string, OutputParam>;

/**
 * Serialized output file.
 */
export type SaveFileData = {
  save?: boolean;
  fileUrl: string;
  meta?: MetaData;
  tests: Tests;
};

// ============================================================================
// Environment Types
// ============================================================================

/**
 * Browser information.
 */
export interface BrowserInfo {
  name: string;
  version: string;
}

/**
 * Execution environment.
 */
export type Environment = {
  browser: BrowserInfo;
  platform: string;
};

/**
 * Metadata written into the output file.
 */
export type MetaData = {
  info: {
    module: string;
    testType: string;
    canvasId: string;
  };

  environment: Environment & {
    libraryVersion: string;
  };
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * RGBA color representation.
 */
export type RGBA = [number, number, number, number];

/**
 * Legacy browser detection result.
 */
export interface LegacyBrowserInfo {
  browser: BrowserInfo;
  platform: string;
}
