import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import {
  extractTestResults,
  TestResultVerifier,
  type TestResultRecord,
} from "../tests/test-verification.js";

import type { SaveFileData } from "../tests/testingTool/types.js";
import { writeMarkdownTestReport } from "./test-report.js";
import { exec } from "node:child_process";

/**
 * File extension used by the ShantanuJS visual test result files.
 */
const TEST_RESULT_EXTENSION = ".sh.vtest.json";

/**
 * Default directory containing test result files.
 */
const DEFAULT_TEST_DIRECTORY = resolve("tests");

/**
 * Recursively finds all ShantanuJS test result files.
 */
async function findTestResultFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findTestResultFiles(entryPath)));

      continue;
    }

    if (entry.isFile() && entry.name.endsWith(TEST_RESULT_EXTENSION)) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Reads and parses one serialized test-result file.
 */
async function readTestResultFile(file: string): Promise<SaveFileData> {
  const content = await readFile(file, "utf8");

  try {
    return JSON.parse(content) as SaveFileData;
  } catch (error) {
    throw new Error(`Invalid JSON in test result file:\n${file}`, {
      cause: error,
    });
  }
}

/**
 * Collects every test case from every result file.
 */
async function collectTestResults(
  directory: string,
): Promise<TestResultRecord[]> {
  const files = await findTestResultFiles(directory);

  const records: TestResultRecord[] = [];

  for (const file of files) {
    const data = await readTestResultFile(file);

    records.push(...extractTestResults(relative(process.cwd(), file), data));
  }

  return records;
}

/**
 * Parses the threshold supplied through the command line.
 *
 * Examples:
 *
 *     npm run test-report
 *     npm run test-report -- 90
 *
 * Default threshold: 100%.
 */
function parseThreshold(argument?: string): number {
  if (argument === undefined) {
    return 100;
  }

  const threshold = Number(argument);

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    throw new Error(
      `Invalid threshold "${argument}". ` +
        "Threshold must be a number between 0 and 100.",
    );
  }

  return threshold;
}

/**
 * Stops the ShantanuJS test environment.
 *
 * The test environment is started by:
 *
 *   npm-run-all --parallel dev test-server test:watch
 *
 * Killing its process tree also stops:
 *   - tsc --watch
 *   - test tsc --watch
 *   - live-server
 *   - file-server
 *   - npm-run-all child processes
 *
 * The test runner itself is not part of this tree.
 */
function stopTestEnvironment(): Promise<void> {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -Command "` +
        `$root = Get-CimInstance Win32_Process | ` +
        `Where-Object { ` +
        `$_.CommandLine -match 'npm-run-all.*--parallel.*dev.*test-server.*test:watch' ` +
        `} | ` +
        `Select-Object -First 1; ` +
        `if ($root) { ` +
        `taskkill /PID $root.ProcessId /T /F | Out-Null ` +
        `}"`,
      () => {
        resolve();
      },
    );
  });
}

/**
 * Main command-line entry point.
 */
async function main(): Promise<void> {
  const threshold = parseThreshold(process.argv[2]);

  console.log("");
  console.log("Collecting ShantanuJS test results...");

  console.log(
    `Test directory: ${relative(process.cwd(), DEFAULT_TEST_DIRECTORY)}`,
  );

  console.log(`Threshold     : ${threshold}%`);

  console.log("");

  try {
    const records = await collectTestResults(DEFAULT_TEST_DIRECTORY);

    if (records.length === 0) {
      throw new Error(
        `No "${TEST_RESULT_EXTENSION}" files were found in ` +
          `"${DEFAULT_TEST_DIRECTORY}".`,
      );
    }

    console.log(`Collected ${records.length} test case(s).`);

    const verifier = new TestResultVerifier(threshold);

    const result = verifier.verifyAll(records);

    // -----------------------------------------------------------------------
    // Terminal report
    // -----------------------------------------------------------------------

    console.log(verifier.formatReport(result));

    // -----------------------------------------------------------------------
    // Markdown report
    // -----------------------------------------------------------------------

    await writeMarkdownTestReport(result, {
      outputPath: "tests/test-report.md",
    });

    /*
     * Machine-readable result:
     *
     * 0 = threshold satisfied
     * 1 = threshold not satisfied
     */
    process.exitCode = result.passed ? 0 : 1;
  } finally {
    console.log("");
    console.log("Stopping ShantanuJS test environment...");

    await stopTestEnvironment();

    console.log("ShantanuJS test environment stopped.");
  }
}

/**
 * Execute the CLI.
 */
main().catch((error: unknown) => {
  console.error("");
  console.error("TEST VERIFICATION ERROR");
  console.error("=======================");

  console.error(error instanceof Error ? error.message : String(error));

  process.exitCode = 1;
});
