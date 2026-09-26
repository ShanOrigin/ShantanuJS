import { readdir, unlink } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

/**
 * File extension used by ShantanuJS serialized test-result files.
 */
const TEST_RESULT_EXTENSION = ".sh.vtest.json";

/**
 * Root directory containing the ShantanuJS test infrastructure.
 *
 * The directory is intentionally limited to `tests/` so that the cleanup
 * operation cannot accidentally remove result files from unrelated areas
 * of the repository.
 */
const TESTS_DIRECTORY = resolve("tests");

/**
 * Recursively finds and deletes all ShantanuJS test-result files.
 *
 * Only files ending with `.sh.vtest.json` are deleted.
 *
 * @param directory Directory currently being traversed.
 * @returns Number of deleted test-result files.
 */
async function deleteTestResultFiles(
  directory: string,
): Promise<number> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  let deletedCount = 0;

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      deletedCount += await deleteTestResultFiles(entryPath);
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(TEST_RESULT_EXTENSION)
    ) {
      await unlink(entryPath);

      console.log(
        `Deleted: ${relative(process.cwd(), entryPath)}`,
      );

      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Main cleanup entry point.
 */
async function main(): Promise<void> {
  console.log("");
  console.log("Cleaning ShantanuJS test results...");
  console.log(
    `Test directory: ${relative(process.cwd(), TESTS_DIRECTORY)}`,
  );
  console.log("");

  const deletedCount =
    await deleteTestResultFiles(TESTS_DIRECTORY);

  console.log("");

  if (deletedCount === 0) {
    console.log(
      `No "${TEST_RESULT_EXTENSION}" files were found.`,
    );
  } else {
    console.log(
      `Deleted ${deletedCount} test-result file(s).`,
    );
  }

  console.log("");
}

/**
 * Execute the cleanup script.
 */
main().catch((error: unknown) => {
  console.error("");
  console.error("TEST RESULT CLEANUP ERROR");
  console.error("=========================");
  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );

  process.exitCode = 1;
});