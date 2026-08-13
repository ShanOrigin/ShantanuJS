import { InvalidArgumentError } from "../../errors/index.js";

/**
 * Controls the high-level rendering lifecycle of the engine.
 *
 * - `PREPARE`: Perform all computations and state preparation required
 *   before rendering.
 * - `RENDER`: Execute the actual rendering process using the prepared state.
 */
export enum RenderPhase {
  PREPARE = "PREPARE",
  RENDER = "RENDER",
}

/**
 * Defines which part of a renderable object is being updated.
 *
 * - `GEOMETRY`: Updates both geometric and style properties and triggers
 *   derived computations such as bounding box and canonical matrix updates.
 * - `STYLE`: Applies visual style changes only, without geometry
 *   or transform recalculations.
 * - `TRANSFORM`: Applies transform changes only using the existing world matrix
 */
export enum RenderUpdateType {
  GEOMETRY = "GEOMETRY",
  STYLE = "STYLE",
  TRANSFORM = "TRANSFORM",
}

/**
 * Generates a unique identifier for engine objects.
 *
 * If a non-empty `userId` is provided, it is returned unchanged.
 * Otherwise, a 16-character identifier is generated using
 * `crypto.randomUUID()` when available, with a random string fallback.
 *
 * @param userId - Optional user-supplied identifier.
 * @returns A unique identifier string.
 * @throws Rethrows any unexpected runtime error encountered during generation.
 */
export function generateId(userId?: string): string {
  try {
    if (userId && userId.trim() !== "") return userId;

    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    }

    // Fallback
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const fallback = Array.from(
      { length: 16 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");

    return fallback;
  } catch (e) {
    throw e;
  }
}

/**
 * Logs a warning message to the console.
 *
 * @param args - Values to be logged as a warning.
 */
export function Warn(...args: unknown[]): void {
  console.warn(...args);
}

/**
 * Logs a message to the console.
 *
 * @param args - Values to be logged.
 */
export function Log(...args: unknown[]): void {
  console.log(...args);
}

/**
 * Purpose:
 * This functions Takes messages from user and simply print that messages as warning in console so user may get context.
 *
 * @param msg - string based message from user
 *
 * @returns
 */

export function cwarn(msg: string) {
  console.warn("Below Operation may break entire Pipeline be careful...!");
  console.warn(msg);
}

/**
 * Prepares and validates the properties of a graphical shape by separating them into
 * **read-only** and **modifiable** categories.
 *
 * Purpose:
 * - Helps organize and safeguard shape properties so that critical fields are not modified accidentally.
 * - Groups properties into `geometry` and `style` sections, each further split into `readOnly` and `modifiable`.
 * - Warns developers about potential issues when trying to edit read-only properties.
 *
 * Dependency:
 * - This function does not depend on any specific graphics API (like WebGL or Canvas2D).
 * - It only works with plain JavaScript objects containing shape property definitions.
 *
 * @param AllGShapeStyleProperties - An object containing all style properties for different shapes.
 *                                   Each shape (e.g., "Rect", "Circle") maps to a set of properties.
 * @param CommonGeometricProperties - An object defining geometric properties that apply across shapes (e.g., position, size).
 * @param GraphicalElementProperties - An object defining additional properties specific to graphical elements.
 * @param shape - The name of the shape (string) whose properties should be validated and organized.
 *
 * @returns An object with two main sections:
 * - **geometry** → contains `readOnly` and `modifiable` geometric properties.
 * - **style** → contains `readOnly` and `modifiable` style properties.
 *
 * @warning Some properties (like `id`, `roleOfSVG`, `name`, `d`) are marked as **read-only**
 * and must not be modified, as doing so may cause unexpected behavior.
 */

export function validProps(
  AllGShapeStyleProperties: object,
  CommonGeometricProperties: object,
  GraphicalElementProperties: object,
  shape: string,
) {
  const { id, roleOfSVG, name, d, ...rest } = (AllGShapeStyleProperties as any)[
    shape
  ];
  console.warn(
    ' Note: The default properties of Rect elements are meant for viewing only. Do not try to modify the read-only properties — doing so may cause unexpected behavior or even break the program.\n\nYou can safely modify all properties listed under the "modifiable" section using the `.attrs()` method or by passing them in the props when creating the element.',
  );

  const props = {
    geometry: {
      readOnly: {
        ...(CommonGeometricProperties as any).geometry,
      },
      modifiable: {
        ...(GraphicalElementProperties as any)[shape],
      },
    },
    style: {
      readOnly: {
        id,
        roleOfSVG,
        name,
        d,
      },
      modifiable: {
        ...rest,
      },
    },
  };

  return props;
}

/**
 * Automatically corrects invalid geometry values by converting negative numbers into positive ones.
 *
 * Purpose:
 * - Ensures that shape geometry properties (like width, height, or radius) are not negative.
 * - Improves stability by preventing rendering issues caused by invalid geometry values.
 * - Provides a helpful warning message whenever a property is corrected.
 *
 * Dependency:
 * - This function does not depend on any specific graphics API (like WebGL or Canvas2D).
 * - It works only with plain JavaScript objects representing properties.
 *
 * @param props - An object containing shape properties (key-value pairs).
 *                The function will check values based on the provided keys.
 * @param geometryKeys - A list of property names that should be validated (e.g., `["width", "height"]`).
 *
 * @returns Nothing (`void`).
 *
 * @warning If any property is found negative, it will be automatically corrected to its absolute value,
 * and a warning will be logged in the console.
 */

export function autoFixGeometry(
  props: Record<string, any>,
  geometryKeys: string[],
): void {
  for (const key of geometryKeys) {
    const value = props[key];

    if (key in props && typeof value == "number" && value < 0) {
      console.warn(
        `⚠️  Property '${key}' was negative (${value}). Automatically converted to positive (${Math.abs(
          value,
        )}).`,
      );
      props[key] = Math.abs(value);
    }
  }
}

/**
 * Validates the types of parameters provided for a shape or graphical element.
 *
 * Purpose:
 * - Ensures that each property passed to a shape has the correct type (number, string, boolean, or function).
 * - Prevents runtime errors caused by assigning incorrect types to geometry, style, or class-specific properties.
 * - Throws a clear error if a value is missing or does not match the expected type.
 *
 * Dependency:
 * - This function does not depend on any graphics API (like WebGL or Canvas2D).
 * - It operates purely on JavaScript objects and type checks.
 *
 * @param parms - An object containing the parameters to validate.
 *                Keys are property names, values are the actual values provided.
 * @param geometry - An object defining expected geometric properties for shapes.
 * @param style - An object defining expected style properties for shapes.
 * @param classOriented - An object containing class-specific properties that may also require validation.
 * @param shape - The name of the shape whose properties are being validated.
 *
 * @throws TypeError if:
 * - A parameter is missing (`null` or `undefined`).
 * - A parameter has a type that does not match the expected type from geometry, style, or class definitions.
 */

export function parameterTypeValidator(
  parms: Record<string, string | number | boolean | undefined | Function>,
  geometry: object,
  style: object,
  classOriented: object,
  shape: string,
) {
  try {
    const geomShape =
      shape == "" ? (geometry as any) : ((geometry as any)[shape] ?? {});
    const styleShape = (style as any)[shape] ?? {};
    const classO = (classOriented as any) ?? {};

    // Validate number parameters
    for (const k in parms) {
      const actual = parms[k];
      const expected = geomShape[k] ?? styleShape[k] ?? classO[k];
      const isP = k in geomShape || k in styleShape || k in classO;

      if (isP) {
        if (actual == null) {
          throw new TypeError(
            `Invalid value for '${shape}' parameter '${k}': expected '${typeof expected}', got '${actual}'`,
          );
        }

        if (
          typeof expected !== "undefined" &&
          typeof actual !== typeof expected
        ) {
          throw new TypeError(
            `Invalid type for '${shape}' parameter '${k}': expected '${typeof expected}', got '${typeof actual}' (value: ${actual})`,
          );
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Validates parameters for an animation function to ensure correct types and values.
 *
 * Purpose:
 * - Ensures that animation attributes, duration, easing, and completion callbacks are correctly specified.
 * - Prevents runtime errors caused by invalid animation parameters.
 * - Tests `ease` functions to make sure they accept a number and return a valid number.
 *
 * Dependency:
 * - This function does not rely on any graphics API (like Canvas or WebGL).
 * - It only performs runtime checks on JavaScript objects, numbers, functions, and strings.
 *
 * @param attrs - An object containing the properties to animate. Must have at least one property.
 * @param avdProp - Optional object containing additional animation-specific properties, or `null`.
 * @param duration - Duration of the animation in milliseconds. Must be a positive number.
 * @param ease - Easing function or string specifying easing type, or `null`.
 *               If a function, it must accept a number and return a number.
 * @param onComplete - Optional callback function to execute when the animation completes, or `null`.
 *
 * @throws Error if any parameter is missing, invalid, or of the wrong type.
 */
export function animationChecks(
  attrs: object,
  avdProp: object | null,
  duration: number,
  ease: ((t: number) => number) | string | null,
  onComplete: Function | null,
) {
  // ==== Parameter Validation ====
  if (
    typeof attrs !== "object" ||
    attrs === null ||
    Object.keys(attrs).length < 1
  ) {
    throw new Error(
      "animate(): 'attrs' must be a valid object with at least one property.",
    );
  }

  if (avdProp !== null && typeof avdProp !== "object") {
    throw new Error("animate(): 'avdProp' must be an object or null.");
  }

  if (typeof duration !== "number" || duration <= 0) {
    throw new Error("animate(): 'duration' must be a positive number.");
  }

  if (
    ease !== null &&
    ease !== undefined &&
    typeof ease !== "function" &&
    typeof ease !== "string"
  ) {
    throw new Error(
      "animate(): 'ease' must be a function, string, null, or undefined.",
    );
  }

  if (typeof ease === "function") {
    try {
      const testResult = ease(0.5);
      if (typeof testResult !== "number" || isNaN(testResult)) {
        throw new Error();
      }
    } catch {
      throw new Error(
        "animate(): 'ease' function must accept a number and return a valid number.",
      );
    }
  }

  if (
    onComplete !== null &&
    onComplete !== undefined &&
    typeof onComplete !== "function"
  ) {
    throw new Error(
      "animate(): 'onComplete' must be a function, null, or undefined.",
    );
  }
}

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
  dirX: "x+",
  dirY: "y+",
  tType: "a",
  px: 0,
  py: 0,
  callbacks: () => {},
};

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

  if (!["absolute", "a", "relative", "r", "pivot", "p"].includes(lowerType)) {
    throw new InvalidArgumentError(
      "tType",
      tType,
      `Invalid transformation type: "${tType}". Expected one of 'absolute' | 'a', 'relative' | 'r', or 'pivot' | 'p'.`,
      "transformation",
    );
  }

  return tType;
}
