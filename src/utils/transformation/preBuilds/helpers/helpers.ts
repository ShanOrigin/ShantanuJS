import { InvalidArgumentError } from '../../../errors/provider/shantanuJSErrors.js';

/**
 * Canonical default property map for transformation and animation parameters.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This object defines the canonical default values for all common
 * transformation-related properties used throughout the animation
 * and transformation pipeline.
 *
 * It acts as a normalization baseline when user input is partial,
 * missing, or intentionally omitted.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - This object is pure data with no behavior
 * - Values represent safe, neutral defaults
 * - All keys correspond to known transformation parameters
 * - Defaults are intentionally permissive, not restrictive
 *
 * -------------------------------------------------------------------------
 * USAGE CONTRACT
 * -------------------------------------------------------------------------
 * This object is used for:
 * - initializing transformation parameter objects
 * - filling missing values during parsing or normalization
 * - ensuring predictable engine behavior without defensive checks
 *
 * This object is NOT:
 * - a validation schema
 * - a runtime configuration object
 * - user-facing API surface
 *
 * -------------------------------------------------------------------------
 * DEPENDENCIES
 * -------------------------------------------------------------------------
 * None.
 * This is a standalone, engine-internal constant.
 *
 * -------------------------------------------------------------------------
 * PROPERTY SEMANTICS
 * -------------------------------------------------------------------------
 * - x, y        : Translation offsets
 * - sx, sy      : Scale factors
 * - angle       : Rotation angle (degrees)
 * - flipX, flipY: Flip flags
 * - dirX, dirY  : Flip direction hints
 * - tType       : Transformation mode identifier
 * - px, py      : Pivot coordinates
 * - callbacks   : No-op default callback
 */
export const propTypes = {
  x: 0,
  y: 0,
  sx: 0,
  sy: 0,
  angle: 0,
  flipX: true,
  flipY: true,
  dirX: 'x+',
  dirY: 'y+',
  tType: 'a',
  px: 0,
  py: 0,
  callbacks: () => {}
};

/**
 * Resets a DOMMatrix instance to the identity transformation.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function mutates the provided DOMMatrix instance by explicitly
 * restoring it to an identity matrix.
 *
 * After execution, the matrix represents a neutral transformation:
 * - no translation
 * - no rotation
 * - no scaling
 * - no skew
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - The provided DOMMatrix is treated as mutable state
 * - All matrix components are explicitly assigned
 * - No new matrix is allocated
 * - No conditional logic is involved
 *
 * This explicit assignment strategy avoids relying on browser defaults
 * and ensures deterministic behavior across environments.
 *
 * -------------------------------------------------------------------------
 * USAGE CONTRACT
 * -------------------------------------------------------------------------
 * This function is intended for:
 * - clearing accumulated transformation state
 * - reusing DOMMatrix instances safely
 * - performance-critical paths where allocation must be avoided
 *
 * This function does NOT:
 * - validate the matrix instance
 * - return a new matrix
 * - perform partial resets
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param m - DOMMatrix instance to be reset to identity.
 */
export function resetMatrix(m: DOMMatrix): void {
  // -----------------------------------------------------------
  // STEP 1: Reset first row
  // -----------------------------------------------------------

  m.m11 = 1;
  m.m12 = 0;
  m.m13 = 0;
  m.m14 = 0;

  // -----------------------------------------------------------
  // STEP 2: Reset second row
  // -----------------------------------------------------------

  m.m21 = 0;
  m.m22 = 1;
  m.m23 = 0;
  m.m24 = 0;

  // -----------------------------------------------------------
  // STEP 3: Reset third row
  // -----------------------------------------------------------

  m.m31 = 0;
  m.m32 = 0;
  m.m33 = 1;
  m.m34 = 0;

  // -----------------------------------------------------------
  // STEP 4: Reset fourth row
  // -----------------------------------------------------------

  m.m41 = 0;
  m.m42 = 0;
  m.m43 = 0;
  m.m44 = 1;
}

/**
 * Computes the geometric center of a quadrilateral from homogeneous coordinates.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function calculates the geometric center (centroid) of a shape
 * defined by four corner points.
 *
 * The center is computed as the arithmetic mean of the four X coordinates
 * and the four Y coordinates.
 *
 * -------------------------------------------------------------------------
 * INPUT CONTRACT
 * -------------------------------------------------------------------------
 * - The input buffer is expected to contain four points
 * - Each point is represented in homogeneous form
 * - Only X and Y components are considered
 *
 * Expected layout (length ≥ 12):
 *   [x1, y1, _, x2, y2, _, x3, y3, _, x4, y4, _]
 *
 * Z / homogeneous components are ignored.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - No validation of buffer length is performed
 * - Missing values default to 0
 * - The function is pure and side-effect free
 *
 * -------------------------------------------------------------------------
 * USAGE CONTEXT
 * -------------------------------------------------------------------------
 * This helper is typically used for:
 * - pivot resolution
 * - center-based transformations
 * - alignment and normalization logic
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param m - Float32Array containing corner coordinates in homogeneous layout.
 *
 * -------------------------------------------------------------------------
 * RETURNS
 * -------------------------------------------------------------------------
 * A tuple [cx, cy] representing the geometric center of the shape.
 */
export function getCentre(m: Float32Array): number[] {
  // -----------------------------------------------------------
  // STEP 1: Destructure corner coordinates with safe defaults
  // -----------------------------------------------------------

  const [x1 = 0, y1 = 0, , x2 = 0, y2 = 0, , x3 = 0, y3 = 0, , x4 = 0, y4 = 0] =
    m;

  // -----------------------------------------------------------
  // STEP 2: Compute centroid coordinates
  // -----------------------------------------------------------

  const cx = (x1 + x2 + x3 + x4) / 4;
  const cy = (y1 + y2 + y3 + y4) / 4;

  return [cx, cy];
}

/**
 * Validates and normalizes a transformation mode identifier.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * This function verifies that a provided transformation type identifier
 * corresponds to a supported transformation mode.
 *
 * Supported modes include:
 * - absolute ('absolute' | 'a')
 * - relative ('relative' | 'r')
 * - pivot    ('pivot'    | 'p')
 *
 * The check is case-insensitive.
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - Only known transformation mode identifiers are accepted
 * - No defaulting or coercion is performed on invalid input
 * - Validation is purely string-based
 *
 * -------------------------------------------------------------------------
 * ERROR BEHAVIOR
 * -------------------------------------------------------------------------
 * Throws InvalidArgumentError if the provided type does not match
 * any supported transformation mode.
 *
 * This indicates a caller-side contract violation.
 *
 * -------------------------------------------------------------------------
 * PARAMETERS
 * -------------------------------------------------------------------------
 * @param type - Transformation mode identifier.
 *
 * -------------------------------------------------------------------------
 * RETURNS
 * -------------------------------------------------------------------------
 * The original transformation type string if valid.
 */
export function typeCheck(tType: string): string {
  // -----------------------------------------------------------
  // STEP 1: Normalize input for comparison
  // -----------------------------------------------------------

  const lowerType = tType.toLowerCase();

  // -----------------------------------------------------------
  // STEP 2: Validate against supported modes
  // -----------------------------------------------------------

  if (!['absolute', 'a', 'relative', 'r', 'pivot', 'p'].includes(lowerType)) {
    throw new InvalidArgumentError(
      'tType',
      tType,
      `Invalid transformation type: "${tType}". Expected one of 'absolute' | 'a', 'relative' | 'r', or 'pivot' | 'p'.`,
      'transformation'
    );
  }

  return tType;
}
