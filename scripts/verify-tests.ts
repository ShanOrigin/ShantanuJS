import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import {
  extractTestResults,
  TestResultVerifier,
  type TestResultRecord,
} from "../tests/test-verification.js";

import type { SaveFileData } from "../tests/testingTool/types.js";

/**
 * File extension used by the ShantanuJS visual test result files.
 */
const TEST_RESULT_EXTENSION = ".sh.vtest.json";

/**
 * Default location containing all test result files.
 */
const DEFAULT_TEST_DIRECTORY = resolve("tests");

/**
 * Recursively finds all ShantanuJS test result files.
 *
 * @param directory Directory to search.
 * @returns Absolute paths of all `.sh.vtest.json` files.
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
 * Reads and parses a single serialized test result file.
 *
 * @param file Path of the test result file.
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
 * Collects all test results from the configured test-result directory.
 *
 * @param directory Root directory containing test result files.
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
 * Supported usage:
 *
 *     npm run alltest
 *     npm run alltest -- 90
 *
 * If no value is provided, 100 is used.
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

  console.log(verifier.formatReport(result));

  /*
   * Exit code is the machine-readable result.
   *
   * 0 = verification succeeded
   * 1 = verification failed
   *
   * This allows CI/CD systems and other scripts to use the result.
   */
  process.exitCode = result.passed ? 0 : 1;
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
