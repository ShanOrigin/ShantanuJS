import http from 'http';
import fs from 'fs';
import path from 'path';

import type { metaData, saveFileData, tests } from './types';
const PORT = 4000;

/**
 * Resolves a corresponding test file path from a given dist file URL.
 *
 * This function enforces a strict mapping between compiled output (`/dist/...`)
 * and source test artifacts stored under `/src/...`.
 *
 * Transformation pipeline:
 * 1. Extract pathname from the URL
 * 2. Validate that the path originates from `/dist/`
 * 3. Strip `/dist` prefix to derive relative path
 * 4. Remove `.js` extension
 * 5. Remove optional hash suffix (e.g., `.abc123`)
 * 6. Map to `/src` directory
 * 7. Append `.sh.vtest.json` as test file extension
 *
 * Example:
 * Input:
 *   http://localhost:4000/dist/module/file.abc123.js
 *
 * Output:
 *   <cwd>/src/module/file.sh.vtest.json
 *
 * @param fileUrl - Absolute URL pointing to a dist JavaScript file
 * @returns Object containing resolved test file path
 *
 * @throws Error if the pathname does not start with `/dist/`
 */
function resolveFile(fileUrl: string) {
  const url = new URL(fileUrl);
  const pathname = url.pathname;

  // Enforce strict contract: only dist files are allowed
  if (!pathname.startsWith('/dist/')) {
    throw new Error('Invalid dist path');
  }

  // Remove `/dist` prefix
  const relative = pathname.replace(/^\/dist/, '');

  // Strip `.js` extension
  let withoutExt = relative.replace(/\.js$/, '');

  // Remove hash suffix (e.g., `.abc123`) if present
  withoutExt = withoutExt.replace(/\.[a-f0-9]+$/, '');

  // Map to source directory
  const srcBase = path.join(process.cwd(), 'src', withoutExt);

  const dirPath = path.dirname(srcBase);
  const fileName = path.basename(srcBase);

  // Final test file path
  const fullPath = path.join(dirPath, `${fileName}.sh.vtest.json`);

  return fullPath;
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
      { flag: 'wx' } // Write only if file does not exist (fail otherwise)
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
function checkConsistency(fileMeta: metaData, testMeta: metaData) {
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
 * HTTP server responsible for receiving, validating, and persisting test data.
 *
 * Core Responsibilities:
 * ----------------------
 * 1. Handle CORS for cross-origin test runners
 * 2. Accept POST requests at `/save`
 * 3. Validate incoming payload integrity and schema
 * 4. Resolve deterministic file path from `fileUrl`
 * 5. Ensure test file existence (atomic creation if missing)
 * 6. Load and validate existing file structure
 * 7. Enforce metadata consistency across writes
 * 8. Merge incoming tests into persistent storage
 * 9. Maintain deterministic ordering of test entries
 * 10. Persist updated state back to disk
 *
 *
 * Request Contract:
 * -----------------
 * POST /save
 *
 * Body (JSON):
 * {
 *   fileUrl: string,
 *   meta: {
 *     info: {
 *       canvasId: string,
 *       module: string,
 *       testType: string
 *     },
 *     environment: {
 *       platform: string,
 *       libraryVersion: string,
 *       browser: {
 *         name: string,
 *         version: string
 *       }
 *     }
 *   },
 *   tests: {
 *     [testId: string]: any
 *   }
 * }
 *
 *
 * Processing Pipeline:
 * --------------------
 * 1. Payload accumulation with size guard (≤ 1MB)
 * 2. JSON parsing with explicit failure handling
 * 3. Structural validation of required fields
 * 4. File path resolution via `resolveFile`
 * 5. File creation via `ensureFile` (idempotent)
 * 6. Existing file read + JSON parse
 * 7. Structure normalization (ensure `tests` exists)
 * 8. Metadata initialization (first write only)
 * 9. Metadata consistency enforcement (`checkConsistency`)
 * 10. Test merge (last-write-wins per ID)
 * 11. Stable sorting:
 *     - Numeric keys → ascending numeric order
 *     - Non-numeric → lexicographic order
 * 12. Atomic overwrite of file contents
 * 13. JSON response emission
 *
 *
 * Response Contract:
 * ------------------
 * Success:
 *   200 → { status: "saved" }
 *
 * Failure:
 *   500 → {
 *     status: "error",
 *     message: string
 *   }
 *
 *
 * Security / Integrity Considerations:
 * -----------------------------------
 * - Basic payload size limit (1MB) → prevents trivial memory abuse
 * - No authentication → fully open write surface (high risk)
 * - No schema validation beyond shallow checks → malformed nested data possible
 * - No concurrency control → race conditions can corrupt file
 * - No file locking → parallel writes are unsafe
 * - Path resolution depends on trusted `fileUrl` → potential attack vector if not tightly constrained
 *
 *
 * Design Constraints:
 * -------------------
 * - Synchronous file I/O → blocks event loop under load
 * - Assumes single-writer model
 * - Assumes stable metadata schema
 * - Uses overwrite strategy instead of append log → no history tracking
 *
 *
 * Failure Modes:
 * --------------
 * - Invalid JSON → immediate rejection
 * - Metadata mismatch → hard failure (write denied)
 * - File corruption → unrecoverable without manual intervention
 * - Partial writes (crash during write) → data loss risk
 *
 *
 * Strategic Weakness (Important):
 * -------------------------------
 * This system is not production-safe under concurrency.
 *
 * If two requests hit simultaneously:
 *   read → modify → write
 * you have a classic lost-update problem.
 *
 * If you scale this beyond a single process, it will break.
 */

const server = http.createServer((req, res) => {
  // ---- CORS ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ---- SAVE ----
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      // basic protection against large payloads
      if (body.length > 1e6) {
        console.error('Payload too large');
        req.socket.destroy();
      }
    });

    req.on('end', () => {
      try {
        // ---------------- PARSE ----------------
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON payload');
        }

        const { fileUrl, meta, tests, save } = parsed as saveFileData;

        console.log('\n\n================ INCOMING REQUEST ================\n');

        console.log('fileUrl:', fileUrl);
        console.log('meta:', meta);
        console.log('tests:', tests);
        console.log('\n==================================================\n\n');

        // ---------------- VALIDATION ----------------
        if (!fileUrl || typeof fileUrl !== 'string') {
          throw new Error('Invalid or missing fileUrl');
        }

        if (!meta || typeof meta !== 'object') {
          throw new Error('Invalid or missing meta');
        }

        if (!tests || typeof tests !== 'object') {
          throw new Error('Invalid or missing tests object');
        }

        let fullPath!: string, fileData;
        if (save) {
          // ---------------- RESOLVE FILE ----------------
          fullPath = resolveFile(fileUrl) as string;

          console.log('fullPath : ', fullPath);
          // ---------------- ENSURE FILE ----------------
          try {
            ensureFile(fullPath);
          } catch (e: unknown) {
            if (e instanceof Error)
              throw new Error(`File creation failed: ${e.message}`);
          }

          // ---------------- READ FILE ----------------

          try {
            const raw = fs.readFileSync(fullPath, 'utf-8');
            fileData = JSON.parse(raw);
          } catch (e) {
            throw new Error('Failed to read or parse existing file');
          }

          // ---------------- VALIDATE STRUCTURE ----------------
          if (!fileData || typeof fileData !== 'object') {
            throw new Error('Corrupted file structure');
          }

          if (!fileData.tests) {
            fileData.tests = {};
          }

          // ---------------- META INIT ----------------
          if (!fileData.meta || Object.keys(fileData.meta).length === 0) {
            console.log('Initializing metadata...');
            fileData.meta = meta;
          }

          // ---------------- META CONSISTENCY ----------------
          if (!checkConsistency(fileData.meta, meta)) {
            console.error('Existing meta:', fileData.meta);
            console.error('Incoming meta:', meta);
            throw new Error('File metadata mismatch');
          }

          // ---------------- SAVE TESTS ----------------

          for (const [id, t] of Object.entries(tests)) {
            if (!id) {
              console.warn('Skipping invalid test with empty id');
              continue;
            }

            fileData.tests[id] = t;
          }

          // ---------------- SORT ----------------
          const sorted = Object.entries(fileData.tests).sort(([a], [b]) => {
            const na = Number(a);
            const nb = Number(b);

            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
          });

          fileData.tests = Object.fromEntries(sorted);
        }
        // ---------------- WRITE ----------------
        try {
          displayAnalysis({ meta, tests });
          save &&
            fs.writeFileSync(
              fullPath as string,
              JSON.stringify(fileData, null, 2)
            );
        } catch (e) {
          if (e instanceof Error)
            throw new Error(`File write failed: ${e.message}`);
        }

        if (save) {
          console.log('\n\t================ SAVE FILE PATH ================\n');

          const relativePath = path.relative(process.cwd(), fullPath);

          console.log(`\t PATH : ${relativePath}`);

          console.log(
            '\n\t===============================================\n\n'
          );
          console.log('\t ✔ File Saved successfully\n');
        }

        // ---------------- RESPONSE ----------------
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'saved' }));
      } catch (err: unknown) {
        // ---------------- ERROR ----------------
        //
        if (err instanceof Error) {
          console.error('❌ SERVER ERROR:', err.message);
          console.error(err.stack);

          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'error',
              message: err.message
            })
          );
        }
      }
    });

    return;
  }

  res.writeHead(404);
  res.end();
});

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

function displayAnalysis(fileData: { meta: metaData; tests: tests }) {
  const { meta, tests } = fileData;

  const info = meta?.info || {};
  const env = meta?.environment || {};

  console.log('\n\t================ TEST ANALYSIS ================\n');

  console.log(`\tModule      : ${info.module}`);
  console.log(`\tTest Type   : ${info.testType}`);
  console.log(`\tCanvas ID   : ${info.canvasId}`);
  console.log(`\tLibrary Ver : ${env.libraryVersion}`);
  console.log('\n\t===============================================\n\n');

  let total = 0;
  let passed = 0;
  let failed = 0;

  console.log('\n\t================ ALL TEST CASES ===============\n');

  for (const [id, test] of Object.entries(tests)) {
    total++;

    const assertions = test.assertions || [];

    const failedIndices: number[] = [];

    assertions.forEach((a: any, index: number) => {
      if (a.status !== 'pass') {
        failedIndices.push(index);
      }
    });

    const isPass = failedIndices.length === 0;

    if (isPass) {
      passed++;
      console.log(`\t${total} - ${id}\t\t ✔`);
    } else {
      failed++;

      console.log(`\t${total} - ${id}\t\t ✖`);

      // ---- print failed assertion indices ----
      console.log(`\tFailed Assertions: [${failedIndices.join(', ')}]`);
    }
  }

  console.log('\n\t===============================================\n\n');

  console.log('\n\t------------------- SUMMARY -------------------');
  console.log(`\tTotal Tests : ${total}`);
  console.log(`\tPassed      : ${passed} ✔`);
  console.log(`\tFailed      : ${failed} ✖`);
  console.log('\n\t===============================================\n\n');
}
