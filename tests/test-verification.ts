import type {
  AssertionResult,
  OutputParam,
  SaveFileData,
} from "./testingTool/types.js";

/**
 * Result returned after verifying the complete test suite.
 */
export type VerificationResult = {
  /** Number of test cases discovered. */
  totalTests: number;

  /** Number of test cases whose overall result is "pass". */
  passedTests: number;

  /** Number of test cases whose overall result is "fail". */
  failedTests: number;

  /** Percentage of test cases that passed. */
  passRate: number;

  /** Required minimum pass percentage. */
  threshold: number;

  /** Whether the test suite satisfies the configured threshold. */
  passed: boolean;

  /** Detailed information about failed test cases. */
  failures: FailedTestCase[];
};

/**
 * Information about a test case that did not pass.
 */
export type FailedTestCase = {
  /** Absolute or relative path of the source result file. */
  file: string;

  /** Test identifier. */
  id: string;

  /** Test metadata. */
  information: OutputParam["information"];

  /** Overall test status. */
  status?: OutputParam["status"];

  /** Assertions belonging to the failed test case. */
  failedAssertions: AssertionResult[];
};

/**
 * Internal representation of one discovered test result.
 *
 * Keeping the file path together with OutputParam allows the verifier
 * to produce useful diagnostics without modifying the serialized format.
 */
export type TestResultRecord = {
  file: string;
  test: OutputParam;
};

/**
 * Verifies the aggregate results produced by the ShantanuJS testing tool.
 *
 * The verifier operates on already-executed test results. It does not
 * execute the tests itself.
 *
 * Responsibilities:
 * - Collect test results from `.sh.vtest.json` files.
 * - Determine the overall result of each test case.
 * - Calculate the test-suite pass rate.
 * - Compare the pass rate against a configurable threshold.
 * - Expose detailed information about failed test cases.
 *
 * The class is intentionally independent of filesystem traversal so it
 * can also be used by other consumers such as CI scripts or custom
 * tooling.
 */
export class TestResultVerifier {
  /**
   * Creates a new test result verifier.
   *
   * @param threshold Minimum percentage of test cases that must pass.
   *
   * @throws RangeError If threshold is outside the range 0–100.
   */
  public constructor(private readonly threshold: number = 100) {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      throw new RangeError(
        `Verification threshold must be a number between 0 and 100. Received: ${threshold}`,
      );
    }
  }

  /**
   * Returns the configured verification threshold.
   */
  public getThreshold(): number {
    return this.threshold;
  }

  /**
   * Verifies a collection of test result records.
   *
   * A test case is considered passed only when:
   *
   *     test.status?.result === "pass"
   *
   * A missing status is therefore treated as a failed test case.
   *
   * @param records Test results collected from all result files.
   * @returns Aggregate verification result.
   */
  public verifyAll(records: TestResultRecord[]): VerificationResult {
    const totalTests = records.length;

    const passedTests = records.filter(
      ({ test }) => test.status?.result === "pass",
    ).length;

    const failedRecords = records.filter(
      ({ test }) => test.status?.result !== "pass",
    );

    const failedTests = failedRecords.length;

    const passRate =
      totalTests === 0 ? 0 : (passedTests / totalTests) * 100;

    const passed = passRate >= this.threshold;

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      threshold: this.threshold,
      passed,
      failures: failedRecords.map(({ file, test }) =>
        this.createFailureRecord(file, test),
      ),
    };
  }

  /**
   * Creates a detailed failure representation for a test case.
   *
   * Only assertions that actually failed are included. This keeps the
   * command-line output focused on actionable information.
   */
  private createFailureRecord(
    file: string,
    test: OutputParam,
  ): FailedTestCase {
    return {
      file,
      id: test.information.id,
      information: test.information,
      status: test.status,
      failedAssertions: test.assertions.filter(
        (assertion) => assertion.actualStatus === "fail",
      ),
    };
  }

  /**
   * Formats a verification result into a human-readable report.
   *
   * The method does not write to stdout directly, which keeps the verifier
   * reusable in tests, scripts, CI systems, and other environments.
   */
  public formatReport(result: VerificationResult): string {
    const lines: string[] = [];

    lines.push("");
    lines.push("============================================================");
    lines.push("                 ShantanuJS Test Verification");
    lines.push("============================================================");
    lines.push("");

    lines.push(`Total test cases : ${result.totalTests}`);
    lines.push(`Passed test cases: ${result.passedTests}`);
    lines.push(`Failed test cases: ${result.failedTests}`);
    lines.push(`Pass rate        : ${result.passRate.toFixed(2)}%`);
    lines.push(`Required         : ${result.threshold.toFixed(2)}%`);
    lines.push("");

    if (result.passed) {
      lines.push("RESULT: PASS");
      lines.push(
        `The test suite satisfies the ${result.threshold}% threshold.`,
      );
      lines.push("");

      return lines.join("\n");
    }

    lines.push("RESULT: FAIL");
    lines.push(
      `The test suite does not satisfy the ${result.threshold}% threshold.`,
    );
    lines.push("");

    if (result.failures.length > 0) {
      lines.push("Failed test cases");
      lines.push("-----------------");
      lines.push("");

      for (const failure of result.failures) {
        this.appendFailure(lines, failure);
      }
    }

    return lines.join("\n");
  }

  /**
   * Appends one failed test case to the formatted report.
   */
  private appendFailure(
    lines: string[],
    failure: FailedTestCase,
  ): void {
    lines.push(`Test ID     : ${failure.id}`);
    lines.push(`File        : ${failure.file}`);
    lines.push(
      `Module      : ${failure.information.module ?? "N/A"}`,
    );
    lines.push(
      `Element     : ${failure.information.element ?? "N/A"}`,
    );
    lines.push(
      `Test type   : ${failure.information.testType ?? "N/A"}`,
    );
    lines.push(
      `Description : ${failure.information.description ?? "N/A"}`,
    );

    lines.push(
      `Result      : ${failure.status?.result ?? "missing"}`,
    );
    lines.push(
      `Passed assertions: ${
        failure.status?.totalPassedAssertions ?? 0
      }`,
    );
    lines.push(
      `Failed assertions: ${
        failure.status?.totalFailedAssertions ?? 0
      }`,
    );

    if (failure.failedAssertions.length === 0) {
      lines.push(
        "Failure reason: No failed assertion details were recorded.",
      );
    } else {
      lines.push("");
      lines.push("Failed assertions:");

      for (const assertion of failure.failedAssertions) {
        this.appendAssertion(lines, assertion);
      }
    }

    lines.push("");
    lines.push("------------------------------------------------------------");
    lines.push("");
  }

  /**
   * Appends one failed assertion to the formatted report.
   */
  private appendAssertion(
    lines: string[],
    assertion: AssertionResult,
  ): void {
    lines.push(`  Domain       : ${assertion.domain}`);
    lines.push(`  Property     : ${assertion.property}`);
    lines.push(
      `  Check type   : ${assertion.checkType ?? "N/A"}`,
    );
    lines.push(
      `  Cross-check  : ${assertion.crossCheck ?? "N/A"}`,
    );
    lines.push(
      `  Actual status: ${assertion.actualStatus}`,
    );
    lines.push(
      `  Expected     : ${this.stringifyValue(assertion.expected)}`,
    );
    lines.push(
      `  Actual       : ${this.stringifyValue(assertion.actual)}`,
    );

    if (assertion.delta !== undefined) {
      lines.push(`  Delta        : ${assertion.delta}`);
    }

    if (assertion.tolerance !== undefined) {
      lines.push(`  Tolerance    : ${assertion.tolerance}`);
    }

    if (assertion.reason !== undefined) {
      lines.push(`  Reason       : ${assertion.reason}`);
    }

    lines.push("");
  }

  /**
   * Converts assertion values into readable command-line text.
   */
  private stringifyValue(value: unknown): string {
    if (value === undefined) {
      return "undefined";
    }

    if (value === null) {
      return "null";
    }

    if (typeof value === "string") {
      return value;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

/**
 * Extracts all OutputParam test cases from a serialized test result file.
 *
 * A `.sh.vtest.json` file contains:
 *
 *     {
 *       "tests": {
 *         "test-id": { ...OutputParam }
 *       }
 *     }
 *
 * This helper converts that object into the flat representation consumed
 * by TestResultVerifier.
 *
 * @param file Path of the source result file.
 * @param data Parsed serialized test data.
 */
export function extractTestResults(
  file: string,
  data: SaveFileData,
): TestResultRecord[] {
  return Object.values(data.tests ?? {}).map((test) => ({
    file,
    test,
  }));
}