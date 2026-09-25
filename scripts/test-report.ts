import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type {
  AssertionResult,
  OutputParam,
} from "../tests/testingTool/types.js";

import type {
  FailedTestCase,
  VerificationResult,
} from "../tests/test-verification.js";

/**
 * Options used when generating the Markdown test report.
 */
export type MarkdownReportOptions = {
  /**
   * Absolute or relative path where the Markdown report
   * should be written.
   */
  outputPath: string;

  /**
   * Title displayed at the beginning of the report.
   *
   * @default "ShantanuJS Testing Report"
   */
  title?: string;
};

/**
 * Generates a human-readable Markdown report from a
 * completed test verification result.
 *
 * The function does not perform verification itself.
 * It only converts the already verified result into Markdown
 * and writes it to disk.
 *
 * @param result Completed test verification result.
 * @param options Markdown report configuration.
 *
 * @throws Error If the report cannot be written.
 */
export async function writeMarkdownTestReport(
  result: VerificationResult,
  options: MarkdownReportOptions,
): Promise<void> {
  const markdown = generateMarkdownTestReport(
    result,
    options.title ?? "ShantanuJS Testing Report",
  );

  await mkdir(dirname(options.outputPath), {
    recursive: true,
  });

  await writeFile(
    options.outputPath,
    markdown,
    "utf8",
  );
}

/**
 * Converts a verification result into a Markdown document.
 *
 * @param result Completed verification result.
 * @param title Report title.
 *
 * @returns Markdown document content.
 */
export function generateMarkdownTestReport(
  result: VerificationResult,
  title: string = "ShantanuJS Testing Report",
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");

  lines.push(
    `> Generated automatically by the ShantanuJS test verification system.`,
  );
  lines.push("");

  // -------------------------------------------------------------------------
  // Overview
  // -------------------------------------------------------------------------

  lines.push("## Test Summary");
  lines.push("");

  lines.push("| Metric | Result |");
  lines.push("| --- | ---: |");
  lines.push(`| Total test cases | ${result.totalTests} |`);
  lines.push(`| Passed test cases | ${result.passedTests} |`);
  lines.push(`| Failed test cases | ${result.failedTests} |`);
  lines.push(`| Pass percentage | ${result.passRate.toFixed(2)}% |`);
  lines.push(`| Required threshold | ${result.threshold}% |`);
  lines.push(
    `| Verification | ${result.passed ? "✅ PASSED" : "❌ FAILED"} |`,
  );

  lines.push("");

  // -------------------------------------------------------------------------
  // Failed tests
  // -------------------------------------------------------------------------

  if (result.failures.length === 0) {
    lines.push("## Failed Test Cases");
    lines.push("");
    lines.push("🎉 **No failed test cases.**");
    lines.push("");

    return lines.join("\n");
  }

  lines.push("## Failed Test Cases");
  lines.push("");

  lines.push(
    `**${result.failures.length} test case(s) failed.**`,
  );

  lines.push("");

  for (const [index, failure] of result.failures.entries()) {
    appendFailedTestCase(lines, failure, index + 1);
  }

  // -------------------------------------------------------------------------
  // Final summary
  // -------------------------------------------------------------------------

  lines.push("## Final Result");
  lines.push("");

  lines.push("| Metric | Result |");
  lines.push("| --- | ---: |");
  lines.push(`| Total tests | ${result.totalTests} |`);
  lines.push(`| Passed | ${result.passedTests} / ${result.totalTests} |`);
  lines.push(`| Failed | ${result.failedTests} / ${result.totalTests} |`);
  lines.push(`| Percentage | ${result.passRate.toFixed(2)}% |`);
  lines.push(`| Threshold | ${result.threshold}% |`);
  lines.push(
    `| Status | ${result.passed ? "✅ PASSED" : "❌ FAILED"} |`,
  );

  lines.push("");

  return lines.join("\n");
}

/**
 * Appends one failed test case to the Markdown report.
 *
 * @param lines Report lines being constructed.
 * @param failure Failed test case.
 * @param index One-based failure index.
 */
function appendFailedTestCase(
  lines: string[],
  failure: FailedTestCase,
  index: number,
): void {
  const status = failure.status;

  lines.push(`### ${index}. \`${escapeMarkdown(failure.id)}\``);
  lines.push("");

  lines.push("#### Test Information");
  lines.push("");

  lines.push("| Property | Value |");
  lines.push("| --- | --- |");
  lines.push(
    `| **Test ID** | \`${escapeMarkdown(failure.id)}\` |`,
  );
  lines.push(
    `| **File** | \`${escapeMarkdown(failure.file)}\` |`,
  );
  lines.push(
    `| **Module** | ${escapeMarkdown(
      failure.information.module ?? "N/A",
    )} |`,
  );
  lines.push(
    `| **Element** | ${escapeMarkdown(
      failure.information.element ?? "N/A",
    )} |`,
  );
  lines.push(
    `| **Test type** | ${escapeMarkdown(
      failure.information.testType ?? "N/A",
    )} |`,
  );
  lines.push(
    `| **Description** | ${escapeMarkdown(
      failure.information.description ?? "N/A",
    )} |`,
  );

  lines.push("");

  lines.push("#### Recorded Status");
  lines.push("");

  lines.push("| Property | Value |");
  lines.push("| --- | ---: |");
  lines.push(
    `| Recorded result | \`${status?.result ?? "missing"}\` |`,
  );
  lines.push(
    `| Passed assertions | ${status?.totalPassedAssertions ?? 0} |`,
  );
  lines.push(
    `| Failed assertions | ${status?.totalFailedAssertions ?? 0} |`,
  );

  lines.push("");

  lines.push("#### Failed Assertions");
  lines.push("");

  if (failure.failedAssertions.length === 0) {
    lines.push(
      "> The test case is marked as failed, but no assertion with a mismatching `expectedStatus` and `actualStatus` was recorded.",
    );
    lines.push("");

    return;
  }

  for (const [assertionIndex, assertion] of failure.failedAssertions.entries()) {
    appendAssertion(
      lines,
      assertion,
      assertionIndex + 1,
    );
  }

  lines.push("---");
  lines.push("");
}

/**
 * Appends one failed assertion to the Markdown report.
 *
 * @param lines Report lines being constructed.
 * @param assertion Failed assertion.
 * @param index One-based assertion index.
 */
function appendAssertion(
  lines: string[],
  assertion: AssertionResult,
  index: number,
): void {
  lines.push(`##### Assertion ${index}`);
  lines.push("");

  lines.push("| Property | Value |");
  lines.push("| --- | --- |");

  lines.push(
    `| Domain | \`${escapeMarkdown(assertion.domain)}\` |`,
  );

  lines.push(
    `| Property | \`${escapeMarkdown(assertion.property)}\` |`,
  );

  lines.push(
    `| Check type | \`${escapeMarkdown(
      assertion.checkType ?? "N/A",
    )}\` |`,
  );

  lines.push(
    `| Cross-check | \`${escapeMarkdown(
      assertion.crossCheck ?? "N/A",
    )}\` |`,
  );

  lines.push(
    `| Expected status | \`${escapeMarkdown(
      assertion.expectedStatus,
    )}\` |`,
  );

  lines.push(
    `| Actual status | \`${escapeMarkdown(
      assertion.actualStatus,
    )}\` |`,
  );

  if (assertion.reason !== undefined) {
    lines.push(
      `| Reason | ${escapeMarkdown(assertion.reason)} |`,
    );
  }

  if (assertion.expected !== undefined) {
    lines.push(
      `| Expected value | \`${escapeMarkdown(
        stringifyValue(assertion.expected),
      )}\` |`,
    );
  }

  if (assertion.actual !== undefined) {
    lines.push(
      `| Actual value | \`${escapeMarkdown(
        stringifyValue(assertion.actual),
      )}\` |`,
    );
  }

  if (assertion.delta !== undefined) {
    lines.push(
      `| Delta | \`${escapeMarkdown(
        String(assertion.delta),
      )}\` |`,
    );
  }

  if (assertion.tolerance !== undefined) {
    lines.push(
      `| Tolerance | \`${escapeMarkdown(
        String(assertion.tolerance),
      )}\` |`,
    );
  }

  lines.push("");
}

/**
 * Escapes characters that have special meaning in Markdown tables.
 *
 * @param value Value to escape.
 *
 * @returns Markdown-safe string.
 */
function escapeMarkdown(value: unknown): string {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

/**
 * Converts an arbitrary value into readable text.
 *
 * @param value Value to stringify.
 *
 * @returns Readable string representation.
 */
function stringifyValue(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (
    typeof value === "string" ||
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