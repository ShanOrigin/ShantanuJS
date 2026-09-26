import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import kill from "tree-kill";
import open from "open";

/**
 * Test selection.
 *
 * Usage:
 *   npm test -- <section> <test>
 *
 * Examples:
 *   npm test -- bug restoreDimension
 *   npm test -- bug all
 *   npm test -- canvas create
 *   npm test -- canvas all
 *   npm test -- all all
 */

const section = process.argv[2] ?? "all";
const test = process.argv[3] ?? "all";

console.log(`Running tests: ${section} / ${test}`);

/**
 * Start the complete test environment.
 *
 * The process tree is owned by this runner so that it can
 * be cleaned up after the test pipeline finishes.
 */
const testing = spawn(
  "npm",
  ["run", "testing"],
  {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  },
);

testing.stdout?.pipe(process.stdout);
testing.stderr?.pipe(process.stderr);

/**
 * Wait for the development server to become available.
 *
 * live-server runs on port 3000.
 */
async function waitForServer() {
  const url = "http://127.0.0.1:3000/index.html";

  for (;;) {
    if (testing.exitCode !== null) {
      throw new Error(
        `Test environment exited with code ${testing.exitCode}.`,
      );
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await delay(500);
  }
}

/**
 * Wait until the browser test runner reports that
 * the selected test execution has completed.
 */
async function waitForTestCompletion() {
  const url = "http://127.0.0.1:4000/test-status";

  for (;;) {
    if (testing.exitCode !== null) {
      throw new Error(
        `Test environment exited with code ${testing.exitCode}.`,
      );
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        const status = await response.json();

        if (status.completed === true) {
          return;
        }
      }
    } catch {
      // Test server is not ready yet.
    }

    await delay(250);
  }
}

/**
 * Opens the selected browser test.
 *
 * The `open` package handles browser launching across
 * Windows, Linux, and macOS.
 */
async function startTest() {
  await waitForServer();

  const url =
    `http://127.0.0.1:3000/index.html` +
    `?section=${encodeURIComponent(section)}` +
    `&test=${encodeURIComponent(test)}`;

  console.log(`Test URL: ${url}`);

  await open(url);

  console.log("Waiting for browser tests to complete...");

  await waitForTestCompletion();

  console.log("Browser tests completed.");
}

/**
 * Runs the test-result verification and generates
 * the Markdown test report.
 */
function runVerification() {
  return new Promise((resolve, reject) => {
    const verification = spawn(
      "npm",
      ["run", "test:report"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      },
    );

    verification.stdout?.pipe(process.stdout);
    verification.stderr?.pipe(process.stderr);

    verification.on("error", reject);

    verification.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Test verification failed with exit code ${code ?? 1}`,
        ),
      );
    });
  });
}

/**
 * Stops the complete test environment process tree.
 *
 * `tree-kill` handles process-tree termination across
 * supported operating systems.
 */
function stopTestEnvironment() {
  return new Promise((resolve) => {
    if (!testing.pid || testing.exitCode !== null) {
      resolve();
      return;
    }

    kill(
      testing.pid,
      "SIGTERM",
      () => {
        resolve();
      },
    );
  });
}

/**
 * Main test pipeline.
 */
async function main() {
  try {
    await startTest();

    console.log("");
    console.log("Test pipeline completed successfully.");
  } catch (error) {
    console.error("");
    console.error("Test pipeline failed.");

    console.error(
      error instanceof Error
        ? error.message
        : String(error),
    );

    process.exitCode = 1;
  } finally {
    console.log("");
    console.log("Stopping test environment...");

    await stopTestEnvironment();

    console.log("Test environment stopped.");
  }
}

void main();