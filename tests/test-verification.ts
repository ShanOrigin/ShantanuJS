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

  /** Number of test cases with zero failed assertions. */
  passedTests: number;

  /** Number of test cases with one or more failed assertions. */
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
 * Information about one failed test case.
 *
 * One test ID represents one test case, regardless of how many
 * assertions belong to that test case.
 */
export type FailedTestCase = {
  /** Path of the source result file. */
  file: string;

  /** Unique test-case identifier. */
  id: string;

  /** Test metadata. */
  information: OutputParam["information"];

  /**
   * Recorded test status.
   *
   * status.result is retained as confirmation/diagnostic information.
   */
  status?: OutputParam["status"];

  /**
   * Only assertions where expectedStatus !== actualStatus.
   */
  failedAssertions: AssertionResult[];
};

/**
 * Internal representation of one discovered test case.
 */
export type TestResultRecord = {
  /** Path of the source result file. */
  file: string;

  /** One test case identified by its ID. */
  test: OutputParam;
};

/**
 * Verifies the aggregate results produced by the ShantanuJS testing tool.
 *
 * Verification rules:
 *
 * 1. Every entry under `tests` is one independent test case.
 *
 * 2. `status.result` is read and retained as confirmation/diagnostic
 *    information, but it does not determine the final verification result.
 *
 * 3. `status.totalPassedAssertions` and
 *    `status.totalFailedAssertions` are read.
 *
 * 4. If totalFailedAssertions === 0:
 *      - the test case passes
 *      - no failure details are collected
 *
 * 5. If totalFailedAssertions > 0:
 *      - the test case fails
 *      - all assertions are inspected
 *
 * 6. An assertion is reported as failed only when:
 *
 *      assertion.expectedStatus !== assertion.actualStatus
 *
 * 7. Only those mismatching assertions are included in the failure report.
 *
 * 8. The final percentage is calculated from test cases, not assertions.
 */
export class TestResultVerifier {
  /**
   * Creates a new test result verifier.
   *
   * @param threshold Minimum percentage of test cases that must pass.
   *
   * @throws RangeError If threshold is outside the range 0–100.
   */
  public constructor(
    private readonly threshold: number = 100,
  ) {
    if (
      !Number.isFinite(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
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
   * Verifies all discovered test cases.
   *
   * The recorded status.result is retained for reporting, but the
   * test-case pass/fail decision is based on totalFailedAssertions.
   */
  public verifyAll(
    records: TestResultRecord[],
  ): VerificationResult {
    const totalTests = records.length;

    const failures: FailedTestCase[] = [];

    let passedTests = 0;
    let failedTests = 0;

    for (const record of records) {
      const { file, test } = record;

      const status = test.status;

      /*
       * A missing status cannot provide the required assertion counts.
       *
       * Treat it as a failed test case and report any available
       * assertion mismatches.
       */
      if (!status) {
        failedTests++;

        failures.push(
          this.createFailureRecord(
            file,
            test,
            this.findFailedAssertions(test),
          ),
        );

        continue;
      }

      /*
       * Primary test-case decision.
       *
       * Zero failed assertions means the complete test case passed.
       */
      if (status.totalFailedAssertions === 0) {
        passedTests++;
        continue;
      }

      /*
       * One or more failed assertions means the test case failed.
       */
      failedTests++;

      failures.push(
        this.createFailureRecord(
          file,
          test,
          this.findFailedAssertions(test),
        ),
      );
    }

    const passRate =
      totalTests === 0
        ? 0
        : (passedTests / totalTests) * 100;

    const passed = passRate >= this.threshold;

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      threshold: this.threshold,
      passed,
      failures,
    };
  }

  /**
   * Finds only the assertions whose expected and actual statuses differ.
   *
   * IMPORTANT:
   *
   * The comparison is between:
   *
   *     expectedStatus
   *
   * and:
   *
   *     actualStatus
   *
   * The actual/expected property values are not used to decide whether
   * an assertion failed.
   */
  private findFailedAssertions(
    test: OutputParam,
  ): AssertionResult[] {
    return test.assertions.filter(
      (assertion) =>
        assertion.expectedStatus !== assertion.actualStatus,
    );
  }

  /**
   * Creates the failure representation for one test case.
   */
  private createFailureRecord(
    file: string,
    test: OutputParam,
    failedAssertions: AssertionResult[],
  ): FailedTestCase {
    return {
      file,
      id: test.information.id,
      information: test.information,
      status: test.status,
      failedAssertions,
    };
  }

  /**
   * Formats a verification result into a human-readable report.
   */
  public formatReport(
    result: VerificationResult,
  ): string {
    const lines: string[] = [];

    lines.push("");
    lines.push(
      "============================================================",
    );
    lines.push(
      "                     Testing Report",
    );
    lines.push(
      "============================================================",
    );
    lines.push("");

    lines.push(`Total tests : ${result.totalTests}`);
    lines.push("");

    lines.push(
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    lines.push(
      `              Failed Test Case Assertion : ${result.failures.length}`,
    );
    lines.push(
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    lines.push("");

    /*
     * Display details only for failed test cases.
     */
    for (const failure of result.failures) {
      this.appendFailure(lines, failure);
    }

    lines.push(
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    lines.push(
      "                         Summary",
    );
    lines.push(
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
    );
    lines.push("");

    lines.push(`Total tests : ${result.totalTests}`);
    lines.push(`Threshold   : ${result.threshold}%`);
    lines.push(
      `Passed      : ${result.passedTests} / ${result.totalTests}`,
    );
    lines.push(
      `Failed      : ${result.failedTests} / ${result.totalTests}`,
    );
    lines.push(
      `Percentage  : ${result.passRate.toFixed(2)}%`,
    );

    lines.push("");
    lines.push(
      "============================================================",
    );

    return lines.join("\n");
  }

  /**
   * Appends one failed test case to the report.
   */
  private appendFailure(
    lines: string[],
    failure: FailedTestCase,
  ): void {
    const status = failure.status;

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

    /*
     * status.result is displayed as confirmation/diagnostic information.
     */
    lines.push(
      `Recorded result   : ${status?.result ?? "missing"}`,
    );

    lines.push(
      `Passed assertions : ${
        status?.totalPassedAssertions ?? 0
      }`,
    );

    lines.push(
      `Failed assertions : ${
        status?.totalFailedAssertions ?? 0
      }`,
    );

    lines.push("");
    lines.push("Failed assertions:");
    lines.push("");

    /*
     * Only expectedStatus !== actualStatus assertions
     * are present in this collection.
     */
    for (const assertion of failure.failedAssertions) {
      this.appendAssertion(lines, assertion);
    }

    lines.push(
      "------------------------------------------------------------",
    );
    lines.push("");
  }

  /**
   * Appends one failed assertion to the report.
   */
  private appendAssertion(
    lines: string[],
    assertion: AssertionResult,
  ): void {
    lines.push(
      `  Domain       : ${assertion.domain}`,
    );

    lines.push(
      `  Property     : ${assertion.property}`,
    );

    lines.push(
      `  Check type   : ${assertion.checkType ?? "N/A"}`,
    );

    lines.push(
      `  Cross-check  : ${assertion.crossCheck ?? "N/A"}`,
    );

    lines.push(
      `  Expected     : ${assertion.expectedStatus}`,
    );

    lines.push(
      `  Actual       : ${assertion.actualStatus}`,
    );

    if (assertion.reason !== undefined) {
      lines.push(
        `  Reason       : ${assertion.reason}`,
      );
    }

    if (assertion.expected !== undefined) {
      lines.push(
        `  Expected Value : ${this.stringifyValue(
          assertion.expected,
        )}`,
      );
    }

    if (assertion.actual !== undefined) {
      lines.push(
        `  Actual Value   : ${this.stringifyValue(
          assertion.actual,
        )}`,
      );
    }

    if (assertion.delta !== undefined) {
      lines.push(
        `  Delta        : ${assertion.delta}`,
      );
    }

    if (assertion.tolerance !== undefined) {
      lines.push(
        `  Tolerance    : ${assertion.tolerance}`,
      );
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
 * Extracts all test cases from a serialized test-result file.
 *
 * Each key under `data.tests` represents ONE test case.
 */
export function extractTestResults(
  file: string,
  data: SaveFileData,
): TestResultRecord[] {
  return Object.values(data.tests ?? {}).map(
    (test) => ({
      file,
      test,
    }),
  );
}