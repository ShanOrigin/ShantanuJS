/**
 * ============================================================================
 * ShantanuJS Test Template
 * ============================================================================
 *
 * Copy this template and modify it according to the requirements of the test.
 *
 * IMPORTANT:
 * - Update the import path according to the location of this file.
 * - Pass `import.meta.url` when creating the test environment.
 * - Keep the test lifecycle in the following order:
 *     initialize → setup → actions → expect
 * - The `initialize` phase creates the shared test environment.
 * - The `setup` phase prepares the state required by the test.
 * - The `actions` phase performs the operation being tested.
 * - The `expect` phase defines how the result is validated.
 *
 * This template demonstrates the complete structure supported by the
 * ShantanuJS testing tool, including:
 * - Test metadata
 * - Before/after state capture
 * - Style validation
 * - Geometry validation
 * - Custom validators
 * - Error validation
 * - Library/browser validation oracles
 * - Persistent test-result storage
 */

// ============================================================================
// IMPORTS
// ============================================================================

// NOTE: Update this path according to the location of this test file.
import shantanuJSTest, { Shape } from "./shantanuJS-test.js";

// ============================================================================
// TEST ENTRY POINT
// ============================================================================

/**
 * Defines and runs the test.
 *
 * The test environment is created once for this test file and provides
 * the shared canvas, API, test context, and result-handling infrastructure.
 */
export function runTests(): void {
  // --------------------------------------------------------------------------
  // CREATE TEST ENVIRONMENT
  // --------------------------------------------------------------------------
  // `import.meta.url` is mandatory because the testing tool uses the test
  // file location to determine where test results should be stored.
  const testEnv = new shantanuJSTest(import.meta.url);

  // --------------------------------------------------------------------------
  // INITIALIZE TEST ENVIRONMENT
  // --------------------------------------------------------------------------
  // The initialize phase runs before the individual test definition.
  //
  // Use this phase for resources that are shared across tests in this file,
  // such as:
  // - Creating the canvas
  // - Applying base canvas styles
  // - Preparing shared test infrastructure
  // - Storing shared objects in the test context
  testEnv.env({
    initialize(api, ctx) {
      // Create the canvas used by the test.
      const canvas = new api.Canvas({
        id: "testing",
        width: 200,
        height: 400,
      });

      // Apply base styles to the canvas.
      canvas.attrs({
        fill: "green",
        stroke: "red",
        "stroke-width": 0,
      });

      // Store the canvas in the shared test context.
      // The context is available during setup, actions, and validation.
      ctx.canvas = canvas;

      // Optional:
      // Shared shapes or other objects may also be created here.
      // However, test-specific objects are generally better created
      // inside the `setup` phase.
    },

    // ========================================================================
    // RUN PHASE
    // ========================================================================
    // The run phase is the entry point for defining individual test cases.
    run(ctx) {
      testEnv.shTest({
        // ====================================================================
        // TEST METADATA
        // ====================================================================
        // REQUIRED
        //
        // Metadata identifies the purpose and classification of the test.
        // It is also stored with the test result for reporting and analysis.
        testInfo: {
          description: "Update stroke color of a line",
          module: "shapes",
          testType: "unit",
          element: "line",
        },

        // ====================================================================
        // STATE CAPTURE
        // ====================================================================
        // Controls whether the testing tool captures the state of the test
        // subject before and/or after the action phase.
        //
        // These snapshots can be used by the verification system to compare
        // the state of the object before and after the operation.
        capture: {
          before: true,
          after: true,
        },

        // ====================================================================
        // SETUP PHASE — ARRANGE
        // ====================================================================
        // OPTIONAL
        //
        // Prepare everything required for the test here:
        // - Create test objects
        // - Add objects to the canvas
        // - Store objects in `ctx.shapes`
        // - Configure the initial state
        //
        // Keep test-specific preparation here rather than in `initialize`.
        setup(api, ctx) {
          const line = new api.Shapes.Line({
            x1: 20,
            y1: 40,
            x2: 50,
            y2: 40,
          });

          ctx.canvas.add(line);

          // Store the test subject in the context so it can be accessed
          // by the actions and expectation phases.
          ctx.shapes = {};
          ctx.shapes.line = line;
        },

        // ====================================================================
        // ACTIONS PHASE — ACT
        // ====================================================================
        // REQUIRED
        //
        // Perform the operation being tested here.
        //
        // Keep this phase focused on the actual behavior under test.
        // Avoid placing assertions or validation logic in this phase.
        actions(api, ctx) {
          // Change the line's stroke color.
          ctx.shapes.line.attrs({
            stroke: "blue",
          });

          console.log(ctx.shapes.line);
        },

        // ====================================================================
        // EXPECT PHASE — ASSERT
        // ====================================================================
        // REQUIRED
        //
        // Defines how the result of the test should be validated.
        //
        // Validation can use:
        // - Style assertions
        // - Geometry assertions
        // - Custom validators
        // - Error assertions
        //
        // Every assertion uses the following general structure:
        //
        // {
        //   value: Primitive,
        //   expectedStatus: "pass" | "fail",
        //   tolerance?: number
        // }
        //
        // `expectedStatus` represents the status that the test author expects
        // the assertion to produce.
        expect: {
          // ------------------------------------------------------------------
          // EXPECTATION CONSTRAINTS
          // ------------------------------------------------------------------
          constraints: {
            /**
             * Persist the test result to the generated test-result file.
             */
            save: true,

            /**
             * Configure the validation oracles used by the test.
             */
            oracle: {
              /**
               * Cross-check the result against values computed by the browser.
               *
               * Set to `true` when browser-computed DOM/SVG values should be
               * used as an additional validation source.
               */
              browser: false,

              /**
               * Cross-check the result against ShantanuJS internal state.
               *
               * Set to `true` when the library's internal representation
               * should be used as a validation source.
               */
              library: true,
            },
          },

          // ------------------------------------------------------------------
          // TEST SUBJECT
          // ------------------------------------------------------------------
          // Identifies the shape to which the assertions apply.
          //
          // The value must correspond to a key stored in `ctx.shapes`.
          testSubject: "line",

          // ==================================================================
          // STYLE VALIDATION
          // ==================================================================
          //
          // Use style validation for visual/style-related properties such as:
          // - fill
          // - stroke
          // - stroke-width
          // - opacity
          // - other supported style attributes
          //
          // `attrs` checks expected equality.
          // `notEqualTo` checks expected inequality.
          style: {
            // Equality checks.
            attrs: {
              stroke: {
                value: "blue",
                expectedStatus: "pass",
              },
            },

            // Inequality checks.
            notEqualTo: {
              // Example:
              // stroke: {
              //   value: "red",
              //   expectedStatus: "pass",
              // },
            },
          },

          // ==================================================================
          // GEOMETRY VALIDATION
          // ==================================================================
          //
          // Use geometry validation for shape dimensions, coordinates, and
          // other supported geometric properties.
          //
          // Available comparison operators:
          // - equalTo
          // - greaterThan
          // - greaterThanOrEqual
          // - lessThan
          // - lessThanOrEqual
          // - notEqualTo
          geometry: {
            // Exact/equality comparison.
            equalTo: {
              // Example:
              // x1: {
              //   value: 20,
              //   expectedStatus: "pass",
              // },
            },

            // Greater-than comparison.
            greaterThan: {},

            // Greater-than-or-equal comparison.
            greaterThanOrEqual: {},

            // Less-than comparison.
            lessThan: {},

            // Less-than-or-equal comparison.
            lessThanOrEqual: {},

            // Inequality comparison.
            notEqualTo: {},
          },

          // ==================================================================
          // CUSTOM VALIDATORS
          // ==================================================================
          //
          // Use custom validators when the built-in style/geometry assertions
          // cannot express the required validation logic.
          //
          // A custom validator receives:
          //   validate(shape, expected)
          //
          // and must return either:
          //   "pass"
          //   "fail"
          validators: {
            // Example custom validation for the shape's geometry buffer.
            buffer: {
              /**
               * Allowed numerical deviation when comparing values.
               */
              tolerance: 0.5,

              /**
               * Expected values used by the custom validation function.
               */
              value: [20, 40, 50, 40],

              /**
               * Status expected from the validator.
               */
              expectedStatus: "pass",

              /**
               * Custom validation logic.
               *
               * @param shape - Test subject being validated.
               * @param expected - User-defined expected value and tolerance.
               * @returns "pass" when the validation succeeds; otherwise "fail".
               */
              validate(shape, expected) {
                // Extract the relevant geometry values from the shape.
                const [x1, y1, , x2, y2] = (shape?.geometry?.buffer ??
                  []) as number[];

                const actual = [x1, y1, x2, y2];

                const {
                  value,
                  tolerance = 0,
                } = expected as {
                  value: number[];
                  tolerance: number;
                };

                // Determine whether any expected value differs from the
                // corresponding actual value beyond the allowed tolerance.
                const hasMismatch = value.some(
                  (element: number, index: number) =>
                    Math.abs(element - actual[index]) > tolerance,
                );

                // A validator must return only "pass" or "fail".
                return hasMismatch ? "fail" : "pass";
              },
            },
          },

          // ==================================================================
          // ERROR VALIDATION
          // ==================================================================
          // OPTIONAL
          //
          // Use this section when the test is expected to throw an error.
          //
          // The `expected` value should use a library-provided error type when
          // one exists. A generic Error may be used when no specific error type
          // is available.
          error: {
            expected: new Error("Expected error"),

            /**
             * Expected status of the error assertion.
             *
             * Use:
             * - "pass" when the expected error should occur.
             * - "fail" when the expected error should not occur.
             */
            expectedStatus: "pass",
          },
        },
      });
    },
  });
}