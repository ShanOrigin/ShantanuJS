import http from "http";
import fs from "fs";
import path from "path";
import type { MetaData, SaveFileData, Tests } from "./types";

const PORT = 4000;

/**
 * Resolves the persistent test-result file from a compiled test file URL.
 *
 * Compiled tests are emitted into:
 *
 *   test-dist/tests/...
 *
 * Their corresponding test-result files are stored alongside the
 * test source files under:
 *
 *   tests/...
 *
 * Example:
 *
 * Input:
 *   http://127.0.0.1:3000/test-dist/tests/tests/shape/media/text/restoreDimension.js
 *
 * Output:
 *   <cwd>/tests/tests/shape/media/text/restoreDimension.sh.vtest.json
 *
 * @param fileUrl - Absolute URL pointing to a compiled test file.
 * @returns Absolute path to the corresponding `.sh.vtest.json` file.
 *
 * @throws Error if the URL does not originate from `/test-dist/`.
 */
function resolveFile(fileUrl: string) {
  const url = new URL(fileUrl);
  const pathname = url.pathname;

  // Test artifacts must originate from test-dist.
  if (!pathname.startsWith("/test-dist/")) {
    throw new Error("Invalid test-dist path");
  }

  // Remove `/test-dist` prefix.
  const relative = pathname.replace(/^\/test-dist/, "");

  // Strip `.js` extension.
  let withoutExt = relative.replace(/\.js$/, "");

  // Remove optional hash suffix.
  withoutExt = withoutExt.replace(/\.[a-f0-9]+$/, "");

  // Remove leading slash before converting to a filesystem path.
  const relativePath = withoutExt.replace(/^[/\\]+/, "");

  // Map compiled test output back to the repository path.
  const testsBase = path.join(process.cwd(), relativePath);

  const dirPath = path.dirname(testsBase);
  const fileName = path.basename(testsBase);

  return path.join(dirPath, `${fileName}.sh.vtest.json`);
}

/**
 * Ensures that a test file exists at the specified path.
 *
 * Behavior:
 * - If the file does not exist → creates a new file
 * - If the file already exists → no action taken
 *
 * File initialization structure:
 * {
 *   meta: {},
 *   tests: {}
 * }
 *
 * Uses `wx` flag to guarantee atomic creation:
 * - Prevents overwriting existing files
 * - Throws if race condition occurs (file created between check and write)
 *
 * @param fullPath - Absolute path to the test file
 *
 * @throws Error if file creation fails due to race conditions or permission issues
 */
function ensureFile(fullPath: string) {
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(
      fullPath,
      JSON.stringify({ meta: {}, tests: {} }, null, 2),
      { flag: "wx" }, // Write only if file does not exist (fail otherwise)
    );
  }
}

/**
 * Performs a strict structural consistency check between two metadata objects.
 *
 * This function enforces invariants across two domains:
 *
 * 1. Info-level identity:
 *    - canvasId
 *    - module
 *    - testType
 *
 * 2. Environment-level identity:
 *    - platform
 *    - libraryVersion
 *    - browser.name
 *    - browser.version
 *
 * The comparison is shallow and deterministic:
 * - No type coercion (strict equality only)
 * - No fallback handling for missing properties
 * - Assumes both objects follow the expected schema
 *
 * This is effectively a **guard condition** ensuring that tests being appended
 * belong to the same logical execution context as the existing file.
 *
 * @param fileMeta - Metadata already persisted in the file (source of truth)
 * @param testMeta - Incoming metadata from current request
 *
 * @returns boolean
 *   - true  → metadata is consistent and safe to merge
 *   - false → mismatch detected (must reject write operation)
 *
 * @risk
 * - No null/undefined guards → will throw if structure is malformed
 * - No deep comparison → nested objects beyond defined fields are ignored
 * - Assumes schema stability → any schema evolution will silently break logic
 */
function checkConsistency(fileMeta: MetaData, testMeta: MetaData) {
  const { info: fi, environment: fe } = fileMeta;
  const { info: ti, environment: te } = testMeta;

  return (
    // ---- Info-level invariants ----
    fi.canvasId === ti.canvasId && // same rendering surface identity
    fi.module === ti.module && // same logical module
    fi.testType === ti.testType && // same test classification
    // ---- Environment-level invariants ----
    fe.platform === te.platform && // OS / runtime platform match
    fe.libraryVersion === te.libraryVersion && // framework version lock
    fe.browser.name === te.browser.name && // browser identity
    fe.browser.version === te.browser.version // browser version exact match
  );
}

/**
 * HTTP server for ShantanuJS browser-test communication and result storage.
 *
 * Responsibilities:
 * - Handle CORS and preflight requests.
 * - Receive and persist test results through POST /save.
 * - Track browser test completion through POST /test-complete.
 * - Expose test execution status through GET /test-status.
 * - Validate request data and enforce metadata consistency.
 * - Merge and deterministically sort saved test results.
 *
 * Test results are persisted as JSON files resolved from the
 * request's fileUrl. Incoming test entries replace existing
 * entries with the same test ID.
 *
 * The server uses synchronous file I/O and assumes a single-writer
 * test environment. It is intended for local/CI test execution,
 * not concurrent production workloads.
 */


let testCompleted = false;
let testSucceeded = false;
let testError: string | undefined;

const server = http.createServer((req, res) => {
  /* ------------------------------------------------------------------------ */
  /* CORS                                                                     */
  /* ------------------------------------------------------------------------ */

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  /* ------------------------------------------------------------------------ */
  /* OPTIONS                                                                  */
  /* ------------------------------------------------------------------------ */

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  /* ------------------------------------------------------------------------ */
  /* TEST COMPLETE                                                            */
  /* ------------------------------------------------------------------------ */

  if (req.method === "POST" && req.url === "/test-complete") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1e6) {
        console.error("[TEST] Completion payload too large.");
        req.socket.destroy();
      }
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);

        testCompleted = true;
        testSucceeded = parsed.success === true;

        testError = typeof parsed.error === "string" ? parsed.error : undefined;

        console.log("");
        console.log("================ TEST COMPLETE ================");

        console.log(`Success : ${testSucceeded}`);

        if (testError) {
          console.log(`Error   : ${testError}`);
        }

        console.log("================================================");
        console.log("");

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            status: "completed",
          }),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);

        console.error("[TEST] Invalid completion payload:", message);

        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            status: "error",
            message,
          }),
        );
      }
    });

    return;
  }

  /* ------------------------------------------------------------------------ */
  /* TEST STATUS                                                              */
  /* ------------------------------------------------------------------------ */

  if (req.method === "GET" && req.url === "/test-status") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        completed: testCompleted,
        success: testSucceeded,
        error: testError ?? null,
      }),
    );

    return;
  }

  /* ------------------------------------------------------------------------ */
  /* SAVE TEST RESULTS                                                        */
  /* ------------------------------------------------------------------------ */

  if (req.method === "POST" && req.url === "/save") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      // Basic protection against large payloads.
      if (body.length > 1e6) {
        console.error("Payload too large");
        req.socket.destroy();
      }
    });

    req.on("end", () => {
      try {
        /* ------------------------------------------------------------------ */
        /* PARSE                                                               */
        /* ------------------------------------------------------------------ */

        let parsed: SaveFileData;

        try {
          parsed = JSON.parse(body) as SaveFileData;
        } catch {
          throw new Error("Invalid JSON payload");
        }

        const { fileUrl, meta, tests, save } = parsed;

        console.log("\n\n================ INCOMING REQUEST ================\n");

        console.log("fileUrl:", fileUrl);
        console.log("meta:", meta);
        console.log("tests:", tests);

        console.log("\n==================================================\n\n");

        /* ------------------------------------------------------------------ */
        /* VALIDATION                                                          */
        /* ------------------------------------------------------------------ */

        if (!fileUrl || typeof fileUrl !== "string") {
          throw new Error("Invalid or missing fileUrl");
        }

        if (!meta || typeof meta !== "object") {
          throw new Error("Invalid or missing meta");
        }

        if (!tests || typeof tests !== "object") {
          throw new Error("Invalid or missing tests object");
        }

        let fullPath!: string;
        let fileData: any;

        /* ------------------------------------------------------------------ */
        /* FILE PROCESSING                                                     */
        /* ------------------------------------------------------------------ */

        if (save) {
          /* ---------------------------------------------------------------- */
          /* RESOLVE FILE                                                      */
          /* ---------------------------------------------------------------- */

          fullPath = resolveFile(fileUrl) as string;

          console.log("fullPath : ", fullPath);

          /* ---------------------------------------------------------------- */
          /* ENSURE FILE                                                       */
          /* ---------------------------------------------------------------- */

          try {
            ensureFile(fullPath);
          } catch (error: unknown) {
            if (error instanceof Error) {
              throw new Error(`File creation failed: ${error.message}`);
            }

            throw error;
          }

          /* ---------------------------------------------------------------- */
          /* READ FILE                                                         */
          /* ---------------------------------------------------------------- */

          try {
            const raw = fs.readFileSync(fullPath, "utf-8");

            fileData = JSON.parse(raw);
          } catch {
            throw new Error("Failed to read or parse existing file");
          }

          /* ---------------------------------------------------------------- */
          /* VALIDATE FILE STRUCTURE                                           */
          /* ---------------------------------------------------------------- */

          if (!fileData || typeof fileData !== "object") {
            throw new Error("Corrupted file structure");
          }

          if (!fileData.tests) {
            fileData.tests = {};
          }

          /* ---------------------------------------------------------------- */
          /* INITIALIZE METADATA                                               */
          /* ---------------------------------------------------------------- */

          if (!fileData.meta || Object.keys(fileData.meta).length === 0) {
            console.log("Initializing metadata...");

            fileData.meta = meta;
          }

          /* ---------------------------------------------------------------- */
          /* CHECK METADATA CONSISTENCY                                        */
          /* ---------------------------------------------------------------- */

          if (!checkConsistency(fileData.meta, meta)) {
            console.error("Existing meta:", fileData.meta);

            console.error("Incoming meta:", meta);

            throw new Error("File metadata mismatch");
          }

          /* ---------------------------------------------------------------- */
          /* SAVE TESTS                                                        */
          /* ---------------------------------------------------------------- */

          for (const [id, testData] of Object.entries(tests)) {
            if (!id) {
              console.warn("Skipping invalid test with empty id");

              continue;
            }

            fileData.tests[id] = testData;
          }

          /* ---------------------------------------------------------------- */
          /* SORT TESTS                                                        */
          /* ---------------------------------------------------------------- */

          const sorted = Object.entries(fileData.tests).sort(([a], [b]) => {
            const na = Number(a);
            const nb = Number(b);

            if (!Number.isNaN(na) && !Number.isNaN(nb)) {
              return na - nb;
            }

            return a.localeCompare(b);
          });

          fileData.tests = Object.fromEntries(sorted);
        }

        /* ------------------------------------------------------------------ */
        /* ANALYSIS + WRITE                                                    */
        /* ------------------------------------------------------------------ */

        try {
          displayAnalysis({
            meta,
            tests,
          });

          if (save) {
            fs.writeFileSync(fullPath, JSON.stringify(fileData, null, 2));
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            throw new Error(`File write failed: ${error.message}`);
          }

          throw error;
        }

        /* ------------------------------------------------------------------ */
        /* SAVE INFORMATION                                                    */
        /* ------------------------------------------------------------------ */

        if (save) {
          console.log("\n\t================ SAVE FILE PATH ================\n");

          const relativePath = path.relative(process.cwd(), fullPath);

          console.log(`\t PATH : ${relativePath}`);

          console.log(
            "\n\t===============================================\n\n",
          );

          console.log("\t ✔ File Saved successfully\n");
        }

        /* ------------------------------------------------------------------ */
        /* RESPONSE                                                            */
        /* ------------------------------------------------------------------ */

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            status: "saved",
          }),
        );
      } catch (error: unknown) {
        /* ------------------------------------------------------------------ */
        /* ERROR                                                               */
        /* ------------------------------------------------------------------ */

        if (error instanceof Error) {
          console.error("❌ SERVER ERROR:", error.message);

          console.error(error.stack);

          res.writeHead(500, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              status: "error",
              message: error.message,
            }),
          );

          return;
        }

        res.writeHead(500, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            status: "error",
            message: String(error),
          }),
        );
      }
    });

    return;
  }

  /* ------------------------------------------------------------------------ */
  /* UNKNOWN ROUTE                                                            */
  /* ------------------------------------------------------------------------ */

  res.writeHead(404);
  res.end();
});

/* -------------------------------------------------------------------------- */
/* START SERVER                                                               */
/* -------------------------------------------------------------------------- */

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

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

function displayAnalysis(fileData: { meta: MetaData; tests: Tests }) {
  const { meta, tests } = fileData;

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

    const status = test.status;

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

    for (const assertion of test.assertions) {
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
