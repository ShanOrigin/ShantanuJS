export function generateId(userId?: string): string {
  try {
    if (userId && userId.trim() !== '') return userId;

    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
    // Fallback
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const fallback = Array.from(
      { length: 16 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

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
  console.warn('Below Operation may break entire Pipeline be careful...!');
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
  shape: string
) {
  const { id, roleOfSVG, name, d, ...rest } = (AllGShapeStyleProperties as any)[
    shape
  ];
  console.warn(
    ' Note: The default properties of Rect elements are meant for viewing only. Do not try to modify the read-only properties — doing so may cause unexpected behavior or even break the program.\n\nYou can safely modify all properties listed under the "modifiable" section using the `.attrs()` method or by passing them in the props when creating the element.'
  );

  const props = {
    geometry: {
      readOnly: {
        ...(CommonGeometricProperties as any).geometry
      },
      modifiable: {
        ...(GraphicalElementProperties as any)[shape]
      }
    },
    style: {
      readOnly: {
        id,
        roleOfSVG,
        name,
        d
      },
      modifiable: {
        ...rest
      }
    }
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
  geometryKeys: string[]
): void {
  for (const key of geometryKeys) {
    const value = props[key];

    if (key in props && typeof value == 'number' && value < 0) {
      console.warn(
        `⚠️  Property '${key}' was negative (${value}). Automatically converted to positive (${Math.abs(
          value
        )}).`
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
  shape: string
) {
  try {
    const geomShape =
      shape == '' ? (geometry as any) : (geometry as any)[shape] ?? {};
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
            `Invalid value for '${shape}' parameter '${k}': expected '${typeof expected}', got '${actual}'`
          );
        }

        if (
          typeof expected !== 'undefined' &&
          typeof actual !== typeof expected
        ) {
          throw new TypeError(
            `Invalid type for '${shape}' parameter '${k}': expected '${typeof expected}', got '${typeof actual}' (value: ${actual})`
          );
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Checks whether a given matrix is valid by verifying its structure and contents.
 *
 * Purpose:
 * - Ensures that the matrix is an array of `Float32Array` rows.
 * - Confirms that the matrix has the expected number of rows (`matlen`) and each row has the expected length (`rowlen`).
 * - Validates that every element in the matrix is a number, preventing runtime errors in computations.
 *
 * Dependency:
 * - This function does not depend on any graphics API (like WebGL or Canvas2D).
 * - It works purely with JavaScript arrays and typed arrays (`Float32Array`).
 *
 * @param mat - The matrix to validate, as an array of `Float32Array` rows.
 * @param matlen - The expected number of rows in the matrix.
 * @param rowlen - The expected number of elements in each row.
 *
 * @returns `true` if the matrix is valid and matches the expected structure; otherwise, throws an error.
 *
 * @throws Error if:
 * - The matrix is not an array of the expected length.
 * - Any row is not a `Float32Array` or does not have the expected number of elements.
 * - Any element in the matrix is not a number.
 */

export function isValidMatrix(
  mat: Float32Array[], // Correctly type the matrix as an array of Float32Arrays
  matlen: number,
  rowlen: number
): mat is Float32Array[] {
  // Proper return type to indicate it's a valid matrix of Float32Arrays
  try {
    // Check if mat is an array and has the expected number of rows
    let valid = Array.isArray(mat) && mat.length === matlen;

    // Validate each row in the matrix
    for (let i = 0; i < mat.length; i++) {
      const row = mat[i] as Float32Array;

      // Ensure each row is a Float32Array and has the correct length
      valid &&= row instanceof Float32Array && row.length === rowlen;

      // Check that every element in the row is a number
      for (let j = 0; valid && j < row.length; j++) {
        valid &&= typeof row[j] === 'number';
      }

      // If any row fails the validation, break early
      if (!valid) break;
    }
    // console.log(valid);
    // If the matrix is valid, return true; otherwise, throw an error
    if (valid) {
      return valid;
    } else {
      throw new Error(
        'Given matrix is not valid! Please check your parameters and ensure all elements are numbers.'
      );
    }
  } catch (e) {
    // Rethrow the error for further handling
    throw e;
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
  onComplete: Function | null
) {
  // ==== Parameter Validation ====
  if (
    typeof attrs !== 'object' ||
    attrs === null ||
    Object.keys(attrs).length < 1
  ) {
    throw new Error(
      "animate(): 'attrs' must be a valid object with at least one property."
    );
  }

  if (avdProp !== null && typeof avdProp !== 'object') {
    throw new Error("animate(): 'avdProp' must be an object or null.");
  }

  if (typeof duration !== 'number' || duration <= 0) {
    throw new Error("animate(): 'duration' must be a positive number.");
  }

  if (
    ease !== null &&
    ease !== undefined &&
    typeof ease !== 'function' &&
    typeof ease !== 'string'
  ) {
    throw new Error(
      "animate(): 'ease' must be a function, string, null, or undefined."
    );
  }

  if (typeof ease === 'function') {
    try {
      const testResult = ease(0.5);
      if (typeof testResult !== 'number' || isNaN(testResult)) {
        throw new Error();
      }
    } catch {
      throw new Error(
        "animate(): 'ease' function must accept a number and return a valid number."
      );
    }
  }

  if (
    onComplete !== null &&
    onComplete !== undefined &&
    typeof onComplete !== 'function'
  ) {
    throw new Error(
      "animate(): 'onComplete' must be a function, null, or undefined."
    );
  }
}

/**
 * Retrieves a specific transformation matrix from a list of transformations.
 *
 * Purpose:
 * - Provides a 3x3 matrix representing the transformation at a given index in a transformation history list.
 * - Supports both row-major and column-major formats for matrix representation.
 * - Returns the identity matrix if the requested transformation is missing or invalid.
 *
 * Dependency:
 * - This function does not rely on any graphics API (like WebGL or Canvas2D).
 * - Works purely with JavaScript arrays and `Float32Array` for storing matrix data.
 *
 * @param tList - An array containing transformation entries, each with a `TMatrix` property (as a `Float32Array`).
 * @param which - Index or identifier of the transformation to retrieve. Defaults to `0`.
 *                If `-1`, the function returns the last transformation in the list.
 * @param major - Determines whether the returned matrix is row-major (`'r'`) or column-major (`'c'`). Defaults to `'r'`.
 *
 * @returns A 3x3 matrix as a nested array of numbers. Returns the identity matrix if no valid transformation is found.
 *
 * @warning Console warnings are issued if the requested transformation is missing, invalid, or improperly formatted.
 */

export function getTransformationMatrix(
  tList: any[] | undefined,
  which: string | number = 0,
  major: 'r' | 'c' = 'r'
): number[][] {
  const TMat = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  try {
    if ((!tList && !Array.isArray(tList)) || tList.length === 0) {
      console.warn('No transformations applied yet.');
      return TMat;
    }

    let index = typeof which === 'number' ? which : 0;
    if (index === -1) index = tList.length - 1;
    if (index < 0 || index >= tList.length) {
      console.warn(`Invalid transformation index: ${index}`);
      return TMat;
    }
    if (!('TMatrix' in tList[index])) {
      console.warn('Invalid Parameter');
      return TMat;
    }

    const tmat = tList[index]?.TMatrix;
    if (!(tmat instanceof Float32Array) || tmat.length < 9) {
      console.warn('Invalid transformation matrix.');
      return TMat;
    }

    const [a = 1, b = 0, g = 0, c = 0, d = 1, h = 0, e = 0, f = 0, i = 1] =
      tmat;

    if (major === 'r') {
      // Row-major: [ [a c e], [b d f], [g h i] ]
      TMat[0] = [a, c, e];
      TMat[1] = [b, d, f];
      TMat[2] = [g, h, i];
    } else {
      // Column-major: [ [a b g], [c d h], [e f i] ]
      TMat[0] = [a, b, g];
      TMat[1] = [c, d, h];
      TMat[2] = [e, f, i];
    }

    return TMat;
  } catch (e) {
    console.error('getTMatrix() failed:', e);
    return TMat;
  }
}
// +++++++++++++++++ Transformation helpers +++++++++++++++++++++

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
// +++++++++++++++++ animation helpers +++++++++++++++++++++

import type {
  IcommonGeometryAnimatableProperties,
  modes,
  anchors,
  opt,
  TransformGeometryWithPivot,
  EasingType,
  CurveType,
  EasingFunction,
  IadvanceProps,
  curveParams,
  physicsParams,
  pivotParams,
  controlsParams
} from '../../../../types/animation';

import {
  InvalidArgumentError,
  InvalidOptionError,
  InvalidReturnTypeError,
  NegativeValueError,
  TypeMismatchError,
  MissingRequiredAnimationParameterError,
  OutOfRangeError,
  InvalidFormatError
} from '../../../errors/provider/shantanuJSErrors.js';
//+++++++++++++++++++++++++++++++++++++++++++++++
// --------------- DATA SECTION -----------------
//+++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Defines common style properties that can be animated for all shapes.
 *
 * Purpose:
 * - Provides default values for visual properties such as color, stroke, opacity, clipping, and font attributes.
 * - Ensures consistent and animatable style attributes across different shapes.
 * - Used when separating style properties from geometry properties for animations or rendering updates.
 *
 * Dependency:
 * - Plain JavaScript object; does not rely on any graphics API, DOM API, or external library.
 *
 * @example
 * CommonStyleAnimatableProperties.fill → ''
 * CommonStyleAnimatableProperties.stroke → ''
 * CommonStyleAnimatableProperties['stroke-width'] → 0
 * CommonStyleAnimatableProperties.opacity → 0
 */

export const CommonStyleAnimatableProperties = {
  // common
  fill: '',
  stroke: '',
  'stroke-width': 0,
  opacity: 0,
  // specific
  'clip-path': 0,
  'font-size': 0,
  'font-weight': 0
};

/**
 * Defines common geometric properties that can be animated for all shapes.
 *
 * Purpose:
 * - Provides default values for common transformations such as translation, scaling, rotation, and skewing.
 * - Ensures a consistent baseline for animating geometric changes across different shapes.
 * - Helps simplify animation logic by providing a unified structure for common properties.
 *
 * Dependency:
 * - Plain JavaScript object; does not rely on any graphics API, DOM API, or external library.
 *
 * @example
 * commonGeometryAnimatableProperties.translate → { x: 0, y: 0 }
 * commonGeometryAnimatableProperties.scale → { sx: 1, sy: 1 }
 * commonGeometryAnimatableProperties.rotate → { angle: 0 }
 * commonGeometryAnimatableProperties.skew → { sx: 0, sy: 0 }
 */

const commonGeometryAnimatableProperties: IcommonGeometryAnimatableProperties =
  {
    translate: { x: 0, y: 0 },
    scale: { sx: 1, sy: 1 },
    rotate: { angle: 0 },
    skew: { sx: 0, sy: 0 }
  };

/**
 * Defines shape-specific properties that can be animated.
 *
 * Purpose:
 * - Lists the animatable properties for each supported shape type.
 * - Helps determine which properties can be safely modified or animated without affecting read-only or non-animatable attributes.
 * - Ensures animations and transformations apply only to meaningful, shape-specific attributes.
 *
 * Dependency:
 * - Plain JavaScript object; does not depend on any graphics API, DOM API, or external library.
 *
 * @example
 * ShapeSpecificAnimatableProperties.circle → ['cx', 'cy', 'r']
 * ShapeSpecificAnimatableProperties.rect → ['x', 'y', 'width', 'height', 'rx', 'ry']
 */

const ShapeSpecificAnimatableProperties = {
  dot: ['cx', 'cy', 'r'],
  circle: ['cx', 'cy', 'r'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  polyline: ['points'],
  polygon: ['points'],
  path: ['d'],
  text: ['x', 'y'],
  image: ['x', 'y', 'width', 'height']
};

/**
 * Arrays mapping shape properties to their corresponding matrix transformation functions.
 *
 * Purpose:
 * - `tx` → Properties affecting horizontal translation, mapped to translation matrix operations.
 * - `ty` → Properties affecting vertical translation, mapped to translation matrix operations.
 * - `sx` → Properties affecting horizontal scaling, mapped to scaling matrix operations.
 * - `sy` → Properties affecting vertical scaling, mapped to scaling matrix operations.
 * - These arrays are used to determine which matrix function should be applied to a given property during transformations or animations.
 *
 * Dependency:
 * - Plain JavaScript arrays; does not rely on any graphics API, DOM API, or external library.
 */
export const tx = ['translateX', 'cx', 'x', 'x1'];
export const ty = ['translateY', 'cy', 'y', 'y1'];

export const sx = ['scaleX', 'r', 'rx', 'width'];
export const sy = ['scaleY', 'r', 'ry', 'height'];

/**
 * Maps shape property names to their corresponding geometric transformation categories.
 *
 * Purpose:
 * - Categorizes common and shape-specific properties for transformations.
 * - Translation properties (`x`, `y`, `cx`, `cy`, etc.) are mapped to `'Translate'`.
 * - Scaling properties (`width`, `height`, `rx`, `ry`, `r`, etc.) are mapped to `'Scale'`.
 * - Properties not associated with a transformation are set to `null`.
 * - Helps streamline property handling for animations or geometric computations.
 *
 * Dependency:
 * - This is a plain JavaScript object and does not depend on any graphics API, DOM API, or external library.
 */

export const map = {
  // Translate map
  cx: 'Translate',
  cy: 'Translate',
  x: 'Translate',
  y: 'Translate',
  x1: 'Translate',
  y1: 'Translate',

  // Scale map
  r: 'Scale',
  rx: 'Scale',
  ry: 'Scale',
  width: 'Scale',
  height: 'Scale',
  x2: 'Scale', // line
  y2: 'Scale', // line

  not: null
};

/**
 * List of supported easing function identifiers.
 *
 * These values define the timing functions used to interpolate animation
 * progress over time. Each easing represents a distinct acceleration and
 * deceleration curve applied during animation playback.
 *
 * This list is used for validation and lookup of easing behaviors.
 */
const easingMap: string[] = [
  'linear',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'easeOutBounce',
  'easeInBounce',
  'easeInOutBounce'
];

/**
 * List of supported path interpolation types.
 *
 * These values describe the geometric path along which an animation
 * or transformation progresses, independent of easing behavior.
 *
 * This list is used to validate path-related configuration.
 */
const pathsMap: string[] = ['linear', 'quadratic', 'cubic', 'earc', 'arc'];

/**
 * List of supported anchor point identifiers.
 *
 * Anchors define reference points used for alignment, transformation,
 * or positioning operations. Each value represents a specific relative
 * location within a bounding region.
 *
 * The identifiers follow a concise directional naming convention.
 */
const anchorsMap = ['TL', 'TM', 'TR', 'RM', 'BR', 'BM', 'BL', 'LM', 'C'];

/**
 * List of supported transformation mode identifiers.
 *
 * These values control how transformations are interpreted or applied,
 * such as relative positioning, pivot-based transformations, or
 * center-based alignment.
 *
 * Both shorthand and descriptive aliases are supported.
 */
const modesMap = ['r', 'c', 'p', 'relative', 'pivot', 'center'];

/**
 * List of supported animation direction modes.
 *
 * Direction modes define how an animation sequence progresses over time,
 * including forward playback, reversed playback, or alternating behavior.
 */
const directionsMap = ['normal', 'reverse', 'alternate'];

/**
 * List of supported optional feature flags.
 *
 * These options enable or modify advanced behaviors such as precomputation
 * or polynomial fitting strategies. They are intended for fine-tuning
 * performance or numerical behavior rather than core functionality.
 */
const optMap = ['fitPolynomialCofficient', 'preComputeFrames'];

//+++++++++++++++++++++++++++++++++++++++++++++++
// ------------- FUNCTION SECTION ---------------
//+++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Validates user-provided animation properties against
 * shape-specific, style, and geometry animatable definitions.
 *
 * Purpose:
 * - Performs strict runtime validation of animation properties.
 * - Ensures only supported keys are accepted for a given shape.
 * - Validates value types since JavaScript provides no static guarantees.
 *
 * Notes:
 * - This function only validates input; it does not transform data.
 * - All validation rules are derived from predefined default maps.
 *
 * @param props - User-defined animation properties
 * @param shape - Shape identifier (e.g., 'vgpircle', 'rect', 'line')
 */

export type ShapeType = keyof typeof ShapeSpecificAnimatableProperties;
export function handleProps(props: unknown, shape: ShapeType): void {
  // Ensure props is a plain object
  if (props === null || typeof props !== 'object' || Array.isArray(props)) {
    throw new TypeMismatchError(
      'attrs',
      typeof props,
      'object',
      'Animation.animate()'
    );
  }

  const shapeAttrs = ShapeSpecificAnimatableProperties[shape];

  if (!Array.isArray(shapeAttrs)) {
    throw new InvalidOptionError(
      'shape',
      shape,
      Object.keys(ShapeSpecificAnimatableProperties),
      'Animation.animate()'
    );
  }

  const styleKeys = Object.keys(CommonStyleAnimatableProperties);
  const geometryKeys = Object.keys(commonGeometryAnimatableProperties);

  const entries = Object.entries(props);

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];

    const isShapeAttr = shapeAttrs.includes(key);
    const isStyleProp = styleKeys.includes(key);
    const isGeometryProp = geometryKeys.includes(key);

    // Property must exist in at least one allowed category
    if (!isShapeAttr && !isStyleProp && !isGeometryProp) {
      throw new InvalidOptionError(
        key,
        key,
        [...shapeAttrs, ...styleKeys, ...geometryKeys],
        'Animation.animate()'
      );
    }

    // Shape-specific attributes must be numeric
    if (isShapeAttr) {
      if (typeof value !== 'number') {
        throw new TypeMismatchError(
          key,
          typeof value,
          'number',
          'Animation.animate()'
        );
      }
      continue;
    }

    // Style property validation
    if (isStyleProp) {
      if (key === 'fill' || key === 'stroke') {
        if (typeof value !== 'string') {
          throw new TypeMismatchError(
            key,
            typeof value,
            'string',
            'Animation.animate()'
          );
        }
      } else {
        if (typeof value !== 'number') {
          throw new TypeMismatchError(
            key,
            typeof value,
            'number',
            'Animation.animate()'
          );
        }
      }
      continue;
    }

    // Geometry transform validation
    if (isGeometryProp) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeMismatchError(
          key,
          typeof value,
          'object',
          'Animation.animate()'
        );
      }

      // Translate validation
      if (key === 'translate') {
        if (!('x' in value) || typeof value.x !== 'number') {
          throw new TypeMismatchError(
            'translate.x',
            typeof value.x,
            'number',
            'Animation.animate()'
          );
        }
        if (!('y' in value) || typeof value.y !== 'number') {
          throw new TypeMismatchError(
            'translate.y',
            typeof value.y,
            'number',
            'Animation.animate()'
          );
        }
      }

      // Scale validation
      if (key === 'scale') {
        if (!('sx' in value) || typeof value.sx !== 'number') {
          throw new TypeMismatchError(
            'scale.sx',
            typeof value.sx,
            'number',
            'Animation.animate()'
          );
        }
        if (!('sy' in value) || typeof value.sy !== 'number') {
          throw new TypeMismatchError(
            'scale.sy',
            typeof value.sy,
            'number',
            'Animation.animate()'
          );
        }
      }

      // Skew validation
      if (key === 'skew') {
        if (!('sx' in value) || typeof value.sx !== 'number') {
          throw new TypeMismatchError(
            'skew.sx',
            typeof value.sx,
            'number',
            'Animation.animate()'
          );
        }
        if (!('sy' in value) || typeof value.sy !== 'number') {
          throw new TypeMismatchError(
            'skew.sy',
            typeof value.sy,
            'number',
            'Animation.animate()'
          );
        }
      }

      // Rotate validation
      if (key === 'rotate') {
        if (!('angle' in value) || typeof value.angle !== 'number') {
          throw new TypeMismatchError(
            'rotate.angle',
            typeof value.angle,
            'number',
            'Animation.animate()'
          );
        }
      }
    }
  }
}

/*
 *

export function andleProps(props: unknown, shape: string) {
  if (typeof props != 'object') {
    throw new TypeMismatchError(
      'attrs',
      typeof props,
      'number',
      'Animation.animate()'
    );
  }

  if (typeof props == 'object') {
    const attr = (ShapeSpecificAnimatableProperties as any)[shape];
    const style = Object.keys(CommonStyleAnimatableProperties);
    const tr = Object.keys(commonGeometryAnimatableProperties);

    const userAttr = Object.entries(props as object);

    for (let i = 0; i < userAttr.length; i++) {
      const e = userAttr[i];

      if (!attr.includes(e[0]) || !style.includes(e[0]) || !tr.includes(e[0])) {
        throw new InvalidOptionError(
          `${e[0]}`,
          e[0],
          attr,
          'Animation.animate()'
        );
      } else if (attr.includes(e[0]) && typeof e[1] != 'number') {
        throw new TypeMismatchError(
          `${e[1]}`,
          typeof e[1],
          'number',
          'Animation.animate()'
        );
      } else if (style.includes(e[0])) {



        if (typeof e[1] != 'string' && (e[0] == 'fill' || e[0] == 'stroke')) {
          throw new TypeMismatchError(
            `${e[1]}`,
            typeof e[1],
            'string',
            'Animation.animate()'
          );
        } else if (typeof e[1] != 'number') {
          throw new TypeMismatchError(
            `${e[1]}`,
            typeof e[1],
            'number',
            'Animation.animate()'
          );
        }
      } else if (tr.includes(e[0])) {

				if (e[0] == "translate"){
					if(  typeof e[1].x != "number" ){
						throw new TypeMismatchError("translate.x" , typeof e[1].x , "number" , "Animation.animate()" ); 
					
				}
       if(  typeof e[1].y  != "number"  ) {

						throw new TypeMismatchError("translate.x" , typeof e[1].x , "number" , "Animation.animate()" ); 

      }
    }


     	if (e[0] == "scale"){

					if(  typeof e[1].sx != "number" ){
						throw new TypeMismatchError("scale.x" , typeof e[1].sx , "number" , "Animation.animate()" ); 
					
				}
       if(  typeof e[1].sy != "number"  ) {

						throw new TypeMismatchError("scale.x" , typeof e[1].sy , "number" , "Animation.animate()" ); 

      }
    }

     	if (e[0] == "skew"){

					if(  typeof e[1].sx != "number" ){
						throw new TypeMismatchError("skew.x" , typeof e[1].sx , "number" , "Animation.animate()" ); 
					
				}
       if(  typeof e[1].sy != "number"  ) {

						throw new TypeMismatchError("skew.x" , typeof e[1].sy , "number" , "Animation.animate()" ); 

      }
    }

     	if (e[0] == "rotate"){

					if(  typeof e[1].angle != "number" ){
						throw new TypeMismatchError("rotate.angle" , typeof e[1].angle , "number" , "Animation.animate()" ); 
					
				}

    }


  }
}

*/
/*
export function handleDuration(duration: unknown): number {
  if (typeof duration != 'number') {
    throw new TypeMismatchError(
      'duration',
      typeof duration,
      'number',
      'Animation.animate()'
    );
  }
  if (typeof duration == 'number' && duration <= 0) {
    throw new NegativeValueError(duration, 'Animation.animate()');
  }

  return Math.abs(duration);
}
*/

/**
 * Validates and normalizes animation duration.
 *
 * Purpose:
 * - Ensures the provided duration is a valid number.
 * - Rejects zero or negative durations, as animations require
 *   a strictly positive time interval.
 *
 * Notes:
 * - This function performs validation only.
 * - No implicit normalization or correction is applied.
 *
 * @param duration - User-provided animation duration
 * @returns Validated animation duration
 */
export function handleDuration(duration: unknown): number {
  // Duration must be a number
  if (typeof duration !== 'number') {
    throw new TypeMismatchError(
      'duration',
      typeof duration,
      'number',
      'Animation.animate()'
    );
  }

  // Duration must be strictly positive
  if (duration <= 0) {
    throw new NegativeValueError(duration, 'Animation.animate()');
  }

  return duration;
}

/*
function ensureNumberToNumber(fn: Function) {
  return function (...args: number[]) {
    if (args.length < 1)
      throw new InvalidOptionError(
        'ease',
        fn.toString(),
        ['A functions with one number parameter and returning a number.'],
        'Animation.animate()'
      );

    const first = args[0];
    if (typeof first !== 'number')
      throw new InvalidArgumentError(
        getFirstParamName(fn),
        typeof first,
        'First argument must be a number',
        'Animation.animate()'
      );

    const result = fn(...args);

    if (typeof result !== 'number')
      throw new InvalidReturnTypeError(
        typeof result + '',
        'number ',
        'Animation.animate()'
      );

    return true;
  };
}
*/

/**
 * Validates that a function accepts a number and returns a number.
 *
 * Purpose:
 * - Performs a one-time validation of a user-provided function.
 * - Ensures the function conforms to the (t: number) => number contract.
 * - Avoids per-call overhead by NOT wrapping the function.
 *
 * Notes:
 * - This function throws on invalid behavior.
 * - On success, it returns the original function unchanged.
 *
 * @param fn - User-provided function to validate
 * @returns The same function, guaranteed to be (t: number) => number
 */
function ensureNumberToNumber(
  fn: (...args: unknown[]) => unknown
): (t: number) => number {
  // Probe with a known numeric value
  const probe = 0;

  const result = fn(probe);

  if (typeof result !== 'number') {
    throw new InvalidReturnTypeError(
      typeof result,
      'number',
      'Animation.animate()'
    );
  }

  // At this point:
  // - input was a number
  // - output was a number
  // We can safely trust the function
  return fn as (t: number) => number;
}

/*
export function handleEasing(ease: unknown): (t: number) => number {
  if (
    typeof ease != 'string' ||
    typeof ease != 'function' ||
    typeof ease != null
  ) {
    throw new TypeMismatchError(
      'ease',
      typeof ease,
      'string | Function | null',
      'Animation.animate()'
    );
  }

  if (typeof ease == 'function') {
    const fn = ensureNumberToNumber(ease) as Function;
    if (!fn(0)) {
      throw new InvalidArgumentError(
        'ease',
        ease,
        'A functions with one number parameter and returning a number.',
        'Animation.animate()'
      );
    }
  }
  if (typeof ease == 'string') {
    if (!easingMap.includes(ease)) {
      throw new InvalidOptionError(
        'ease',
        ease,
        easingMap,
        'Animation.animate()'
      );
    }
  }

  return typeof ease == 'string' ? easing(ease) : ease;
}
*/

/**
 * Validates and resolves an easing definition.
 *
 * Purpose:
 * - Accepts predefined easing names or custom easing functions.
 * - Ensures the final result is a function of type (t: number) => number.
 * - Performs strict runtime validation to prevent invalid easing behavior.
 *
 * @param ease - Easing identifier or easing function
 * @returns A validated easing function
 */
export function handleEasing(ease: unknown): (t: number) => number {
  // null or undefined is not allowed
  if (ease === null) ease = 'linear'; // null allowed
  if (ease === undefined) {
    throw new TypeMismatchError(
      'ease',
      String(ease),
      'string | function',
      'Animation.animate()'
    );
  }

  // Function easing
  if (typeof ease === 'function') {
    return ensureNumberToNumber(ease as (...args: unknown[]) => unknown);
  }

  // Named easing
  if (typeof ease === 'string') {
    if (!easingMap.includes(ease)) {
      throw new InvalidOptionError(
        'ease',
        ease,
        easingMap,
        'Animation.animate()'
      );
    }
    return easing(ease as EasingType);
  }

  // Everything else is invalid
  throw new TypeMismatchError(
    'ease',
    typeof ease,
    'string | function',
    'Animation.animate()'
  );
}

/*
export function handleOnComplete(onComplete: unknown) {
  if (onComplete && typeof onComplete != 'function') {
    throw new TypeMismatchError(
      'onComplete',
      typeof onComplete,
      'function',
      'Animation.animate()'
    );
  }

  return () => {
    typeof onComplete == 'function' && onComplete();
  };
}

*/

/**
 * Validates and normalizes an onComplete callback.
 *
 * Purpose:
 * - Ensures the provided value is either undefined/null or a function.
 * - Returns a stable, callable function for downstream usage.
 * - Avoids runtime checks during execution by validating once.
 *
 * @param onComplete - User-provided completion callback
 * @returns A function safe to call on animation completion
 */
export function handleOnComplete(onComplete: unknown): Function {
  // Allow undefined or null (no-op)
  if (onComplete === undefined || onComplete === null) {
    return () => {};
  }

  // Reject non-function values
  if (typeof onComplete !== 'function') {
    throw new TypeMismatchError(
      'onComplete',
      typeof onComplete,
      'function',
      'Animation.animate()'
    );
  }

  // At this point, onComplete is guaranteed to be a function
  return onComplete;
}

/**
 * Validates and applies advanced animation properties.
 *
 * Purpose:
 * - Performs strict runtime validation of advanced animation options.
 * - Ensures sub-objects are structurally and semantically correct.
 * - Mutates the provided default object only after validation succeeds.
 *
 * @param defaultOne - Default advanced animation configuration
 * @param userOne - User-provided partial advanced configuration
 */
export function handleAdvanceProps(
  defaultOne: IadvanceProps,
  userOne: Partial<IadvanceProps> | null
): void {
  if (userOne === null) return;

  if (typeof userOne !== 'object') {
    throw new TypeMismatchError(
      'advanceProps',
      typeof userOne,
      'object',
      'Animation.animate()'
    );
  }

  /* ---------------- curve ---------------- */

  if ('curve' in userOne && userOne.curve !== undefined) {
    const curve = userOne.curve;

    if (curve === null || typeof curve !== 'object') {
      throw new TypeMismatchError(
        'curve',
        typeof curve,
        'object',
        'Animation.animate()'
      );
    }

    if (Object.keys(curve).length === 0) {
      throw new InvalidOptionError(
        'curve',
        'empty object',
        ['curvePath', 'curvePathMotion', 'stepness', 'smoothness'],
        'Animation.animate()'
      );
    }

    if (!('curvePath' in curve) || typeof curve.curvePath !== 'string') {
      throw new MissingRequiredAnimationParameterError(
        'curve.curvePath',
        'Animation.animate()'
      );
    }

    if (!pathsMap.includes(curve.curvePath)) {
      throw new InvalidOptionError(
        'curve.curvePath',
        curve.curvePath,
        pathsMap,
        'Animation.animate()'
      );
    }

    if (curve.curvePath !== 'linear') {
      if (curve.curvePathMotion !== true) {
        throw new MissingRequiredAnimationParameterError(
          'curve.curvePathMotion',
          'Animation.animate()'
        );
      }

      if (typeof curve.stepness !== 'number') {
        throw new TypeMismatchError(
          'curve.stepness',
          typeof curve.stepness,
          'number',
          'Animation.animate()'
        );
      }
    }
  }

  /* ---------------- physics ---------------- */

  if ('physics' in userOne && userOne.physics !== undefined) {
    const physics = userOne.physics;

    if (physics === null || typeof physics !== 'object') {
      throw new TypeMismatchError(
        'physics',
        typeof physics,
        'object',
        'Animation.animate()'
      );
    }

    if ('speed' in physics) {
      if (typeof physics.speed !== 'number') {
        throw new TypeMismatchError(
          'physics.speed',
          typeof physics.speed,
          'number',
          'Animation.animate()'
        );
      }

      if (physics.speed < 0.02 || physics.speed > 5) {
        throw new OutOfRangeError(
          physics.speed,
          0.02,
          5,
          'Animation.animate()'
        );
      }

      if (physics.speed && physics.physicsMotion !== true) {
        throw new MissingRequiredAnimationParameterError(
          'physics.physicsMotion',
          'Animation.animate()'
        );
      }
    }
  }

  /* ---------------- pivot ---------------- */

  if ('pivot' in userOne && userOne.pivot !== undefined) {
    const pivot = userOne.pivot;

    if (pivot === null || typeof pivot !== 'object') {
      throw new TypeMismatchError(
        'pivot',
        typeof pivot,
        'object',
        'Animation.animate()'
      );
    }

    for (const [key, value] of Object.entries(pivot)) {
      if (key === 'mode') {
        if (typeof value !== 'string' || !modesMap.includes(value)) {
          throw new InvalidOptionError(
            'pivot.mode',
            String(value),
            modesMap,
            'Animation.animate()'
          );
        }
        continue;
      }

      if (Array.isArray(value)) {
        if (
          value.length !== 2 ||
          typeof value[0] !== 'number' ||
          typeof value[1] !== 'number'
        ) {
          throw new InvalidFormatError(
            value,
            '[px: number, py: number]',
            'Animation.animate()'
          );
        }
        continue;
      }

      if (typeof value !== 'string') {
        throw new TypeMismatchError(
          `pivot.${key}`,
          typeof value,
          'string | [number, number]',
          'Animation.animate()'
        );
      }

      if (!anchorsMap.includes(value)) {
        throw new InvalidOptionError(
          `pivot.${key}`,
          value,
          anchorsMap,
          'Animation.animate()'
        );
      }
    }
  }

  /* ---------------- controls ---------------- */

  if ('controls' in userOne && userOne.controls !== undefined) {
    const controls = userOne.controls;

    if (controls === null || typeof controls !== 'object') {
      throw new TypeMismatchError(
        'controls',
        typeof controls,
        'object',
        'Animation.animate()'
      );
    }

    if ('loop' in controls && typeof controls.loop !== 'boolean') {
      throw new TypeMismatchError(
        'controls.loop',
        typeof controls.loop,
        'boolean',
        'Animation.animate()'
      );
    }

    if (
      'direction' in controls &&
      (typeof controls.direction !== 'string' ||
        !directionsMap.includes(controls.direction))
    ) {
      throw new InvalidOptionError(
        'controls.direction',
        String(controls.direction),
        directionsMap,
        'Animation.animate()'
      );
    }

    if (
      'optimizationTechnique' in controls &&
      (typeof controls.optimizationTechnique !== 'string' ||
        !optMap.includes(controls.optimizationTechnique))
    ) {
      throw new InvalidOptionError(
        'controls.optimizationTechnique',
        String(controls.optimizationTechnique),
        optMap,
        'Animation.animate()'
      );
    }
  }

  // All validation passed → mutate defaults
  deepMerge(defaultOne, userOne);
}

/*
 *
export function handleAdvanceProps(
  defaultOne: IadvanceProps,
  userOne: Partial<IadvanceProps> | null
) {
  if (userOne != null) {
    const curveMotion = userOne.curve as curveParams;
    // curve sub object
    if (curveMotion) {
      if (Object.keys(curveMotion).length == 0) {
        throw new InvalidOptionError(
          'curve',
          'object - no options , at least give curvePath ',
          ['curvePathMotion', 'curvePath', 'stepness', 'smoothness'],
          'Animation.animate()'
        );
      }
      if (!curveMotion.curvePath) {
        throw new MissingRequiredAnimationParameterError(
          ' curve.curvePath - should be there , specify curve path ' +
            pathsMap.join(' | '),
          'Animation.animate()'
        );
      }

      if (curveMotion.curvePath != 'linear') {
        if (!curveMotion.curvePathMotion) {
          // curvePathMotion is not enable with curve is selected
          throw new MissingRequiredAnimationParameterError(
            'curvePathMotion - should be true ',
            'Animation.animate()'
          );
        }
        if (!curveMotion.stepness) {
          throw new MissingRequiredAnimationParameterError(
            'stepness - should be there ',
            'Animation.animate()'
          );
        }
      }

      const physics = userOne.physics as physicsParams;
      // physics sub object
      if (physics != null) {
        if (physics.speed && !physics.physicsMotion) {
          throw new MissingRequiredAnimationParameterError(
            'physics.physicsMotion',
            'Animation.animate()'
          );
        }
        if (typeof physics.speed != 'number') {
          throw new TypeMismatchError(
            'speed',
            typeof physics.speed,
            'number',
            'Animation.animate()'
          );
        }
        if (physics.speed <= 0.02 && physics.speed > 5) {
          throw new OutOfRangeError(
            physics.speed,
            0.02,
            5,
            'Animation.animate()'
          );
        }
      }

      const pivots = userOne.pivot as pivotParams;
      // pivot sub object
      if (pivots != null) {
        const pvt = Object.entries(pivots);
        for (let i = 0; i < pvt.length; i++) {
          const k: string = pvt[i][0];
          const v: string | number[] = pvt[i][1];

          if (k == 'mode' && typeof v == 'string' && !modesMap.includes(v)) {
            throw new InvalidOptionError(
              'pivot.mode',
              v,
              modesMap,
              'Animation.animate()'
            );
          }

          if (typeof v != 'string' || Array.isArray(v)) {
            throw new TypeMismatchError(
              `pivot.${k}`,
              typeof v,
              'string | [px , py ]',
              'Animation.animate()'
            );
          }

          if (typeof v == 'string' && k != 'mode' && !anchorsMap.includes(v)) {
            throw new InvalidOptionError(
              `pivot.${k}`,
              v,
              anchorsMap,
              'Animation.animate()'
            );
          }

          if (
            Array.isArray(v) &&
            v.length != 2 &&
            (typeof v[0] != 'number' || typeof v[1] != 'number')
          ) {
            throw new InvalidFormatError(
              v,
              ' [ px : number , py : number ] ',
              'Animation.animate()'
            );
          }
        }
      }

      const controls = userOne.controls as controlsParams;
      // controls sub object
      if (controls != null) {
        if (typeof controls.loop != 'boolean') {
          throw new TypeMismatchError(
            `controls.loop`,
            typeof controls.loop,
            'boolean',
            'Animation.animate()'
          );
        }

        if (
          typeof controls.direction == 'string' &&
          !directionsMap.includes(controls.direction)
        ) {
          throw new InvalidOptionError(
            `controls.direction`,
            controls.direction,
            directionsMap,
            'Animation.animate()'
          );
        } else if (typeof controls.direction != 'string') {
          throw new TypeMismatchError(
            `controls.direction`,
            typeof controls.direction,
            'string',
            'Animation.animate()'
          );
        }

        if (
          typeof controls.optimizationTechnique == 'string' &&
          !optMap.includes(controls.optimizationTechnique)
        ) {
          throw new InvalidOptionError(
            `controls.optimizationTechnique`,
            controls.optimizationTechnique,
            optMap,
            'Animation.animate()'
          );
        } else if (typeof controls.optimizationTechnique != 'string') {
          throw new TypeMismatchError(
            `controls.optimizationTechnique`,
            typeof controls.optimizationTechnique,
            'string',
            'Animation.animate()'
          );
        }
      }
    }
  }
  userOne != null &&
    typeof userOne === 'object' &&
    // mutate defaultOne directly using userOne Object
    deepMerge(defaultOne, userOne);
}

*/

/**
 * Performs linear interpolation between two numbers.
 *
 * Purpose:
 * - Calculates a value that is a fraction `t` of the way between `start` and `end`.
 * - Useful for animations, smooth transitions, or gradual value changes over time.
 *
 * Dependency:
 * - This function does not depend on any graphics API, DOM API, or external tool.
 * - It works purely with basic JavaScript numbers.
 *
 * @param start - The starting value.
 * @param end - The ending value.
 * @param t - A number between 0 and 1 representing the interpolation factor.
 *
 * @returns A number representing the interpolated value.
 */
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

/**
 * Calculates an adaptive smoothness (number of samples) for a curve segment
 * based on the distance between two points, the curve's bend, and curve type.
 *
 * The function dynamically adjusts the number of interpolation points:
 * - Longer curves or higher bends → more samples for smoothness.
 * - Curve type affects the mapping of bend and distance to sample count.
 * - Smoothness is clamped between user-provided min and max.
 *
 * Parameters:
 * @param P1 - Starting point of the curve { x: number, y: number }.
 * @param P2 - Ending point of the curve { x: number, y: number }.
 * @param bend - Curve bend factor in range [-1, 1]. Positive for upward/clockwise, negative for downward/counter-clockwise.
 * @param curveType - Type of the curve: 'linear', 'quadratic', 'cubic' , 'earc' , 'arc'.
 * @param minSamples - Minimum number of samples to use (default: 4).
 * @param maxSamples - Maximum number of samples to use (default: 100).
 *
 * Returns:
 * - number: Calculated smoothness (sample count) clamped between minSamples and maxSamples.
 *
 * Dependencies:
 * - Pure calculation, does not depend on DOM, canvas, or graphics APIs.
 */
export function getCurveAdaptiveSmoothness(
  P1: { x: number; y: number },
  P2: { x: number; y: number },
  bend: number,
  curveType: CurveType,
  minSamples: number = 4,
  maxSamples: number = 100
): number {
  // 1. Compute straight-line distance between points
  const dx = P2.x - P1.x;
  const dy = P2.y - P1.y;
  const distance = Math.hypot(dx, dy);

  // 2. Map bend [-1, 1] to a positive factor (0.5 to 1.5) to adjust smoothness
  const bendFactor = 1 + Math.abs(bend); // 0–1 becomes 1–2
  let adjustedMin = minSamples;
  let adjustedMax = maxSamples;

  // 3. Curve type adjustment
  switch (curveType) {
    case pathsMap[0]: // 'linear'
      adjustedMax = Math.min(maxSamples, 20); // linear requires fewer points
      break;
    case pathsMap[1]: // 'quadratic'
      adjustedMin = Math.max(minSamples, 6);
      adjustedMax = Math.min(maxSamples, 60);
      break;
    case pathsMap[2]: // 'cubic'
      adjustedMin = Math.max(minSamples, 10);
      adjustedMax = Math.min(maxSamples, 100);
      break;
    case pathsMap[3]: // 'arc'
    case pathsMap[4]: // 'earc'
      adjustedMin = Math.max(minSamples, 8);
      adjustedMax = Math.min(maxSamples, 80);
      break;
    default:
      // fallback
      break;
  }

  // 4. Map distance to sample count within adjusted range
  // Assume a reference distance of 200 units for scaling
  const refDistance = 200;
  let samples = Math.round(
    adjustedMin +
      (adjustedMax - adjustedMin) * (distance / refDistance) * bendFactor
  );

  // Clamp between min and max
  return Math.max(adjustedMin, Math.min(samples, adjustedMax));
}

/**
 * Returns an easing function based on a specified type.
 *
 * Purpose:
 * - Provides commonly used easing functions for animations, such as linear, quadratic, cubic, and bounce effects.
 * - Each returned function takes a parameter `t` (typically between 0 and 1) and outputs a transformed value,
 *   controlling the pacing of animations or transitions.
 *
 * Dependency:
 * - This function does not require any graphics API or DOM API.
 * - It works purely with JavaScript numbers and functions.
 *
 * @param type - A string specifying the type of easing. Examples:
 *               `"linear"`, `"easeInQuad"`, `"easeOutQuad"`, `"easeInOutQuad"`,
 *               `"easeInCubic"`, `"easeOutCubic"`, `"easeInOutCubic"`,
 *               `"easeOutBounce"`, `"easeInBounce"`, `"easeInOutBounce"`.
 * @returns A function `(t: number) => number` that maps a progress value `t` to its eased value.
 */

export function easing(type: EasingType): EasingFunction {
  switch (type) {
    case easingMap[0]: // 'linear'
      return (t) => t;

    // Quadratic
    case easingMap[1]: //'easeInQuad'
      return (t) => t * t;
    case easingMap[2]: // 'easeOutQuad'
      return (t) => t * (2 - t);
    case easingMap[3]: // 'easeInOutQuad'
      return (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Cubic
    case easingMap[4]: //  'easeInCubic'
      return (t) => t * t * t;
    case easingMap[5]: // 'easeOutCubic'
      return (t) => --t * t * t + 1; // (t-1)^3 + 1
    case easingMap[6]: // 'easeInOutCubic':
      return (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Bounce family
    case easingMap[7]: // 'easeOutBounce'
      return (t) => {
        const n1 = 7.5625,
          d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
      };
    case easingMap[8]: // 'easeInBounce'
      return (t) => 1 - easing('easeOutBounce')(1 - t);
    case easingMap[9]: // 'easeInOutBounce'
      return (t) =>
        t < 0.5
          ? (1 - easing('easeOutBounce')(1 - 2 * t)) / 2
          : (1 + easing('easeOutBounce')(2 * t - 1)) / 2;

    default:
      return (t) => t; // fallback linear
  }
}

/**
 * Separates input properties of a shape into `style` and `geometry` categories.
 *
 * Purpose:
 * - Organizes properties to clearly distinguish visual styling from geometric attributes.
 * - Handles common properties, mapped properties, and shape-specific animatable properties.
 * - Includes special handling for certain shapes (e.g., `"rect"`) to ensure corner radius properties (`rx`, `ry`) remain in style.
 *
 * Dependency:
 * - Depends on global objects or mappings like `CommonStyleAnimatableProperties`, `commonGeometryAnimatableProperties`, `map`, and `ShapeSpecificAnimatableProperties`.
 * - Does not rely on any graphics API or DOM API. Works purely with JavaScript objects.
 *
 * @param shape - The name of the shape (e.g., `"rect"`, `"circle"`, etc.) whose properties are being processed.
 * @param input - An object containing all properties assigned to the shape.
 *
 * @returns An object with two keys:
 * - `styleProps` → contains properties affecting appearance (color, opacity, stroke, etc.).
 * - `geometryProps` → contains properties affecting geometry (size, position, transformations, etc.).
 */

export function separateProperties(shape: string, input: Record<string, any>) {
  //   const { shape, ...rest } = input;

  const styleProps: Record<string, any> = {};
  const geometryProps: Record<string, any> = {};
  //    const shapeSpecificProps: Record<string, any> = {};

  const validShapeProps =
    shape &&
    ShapeSpecificAnimatableProperties[
      shape as keyof typeof ShapeSpecificAnimatableProperties
    ];

  for (const key in input) {
    if (!input.hasOwnProperty(key)) continue;

    const isStyleProp = key in CommonStyleAnimatableProperties;
    const isCommonGeometryProp = key in commonGeometryAnimatableProperties;
    const isMappedGeometryProp = key in map;
    const isShapeSpecificProp = validShapeProps?.includes(key);

    isStyleProp && (styleProps[key] = input[key]);
    // Geometry props only if:
    // 1. It's in commonGeometryAnimatableProperties or map
    // 2. OR it's a shapeSpecificProp AND it also belongs to commonGeometryAnimatableProperties/map
    (isCommonGeometryProp ||
      (isMappedGeometryProp &&
        isShapeSpecificProp &&
        (key in commonGeometryAnimatableProperties || key in map))) &&
      (geometryProps[key] = input[key]);
  }

  // Important For Rect Class dont delete it accidentaly
  const isShapeRect = shape == 'rect';
  isShapeRect &&
    'rx' in geometryProps &&
    ((styleProps['rx'] = geometryProps['rx']), delete geometryProps['rx']);
  isShapeRect &&
    'ry' in geometryProps &&
    ((styleProps['ry'] = geometryProps['ry']), delete geometryProps['ry']);

  return {
    styleProps,
    geometryProps
  };
}

/**
 * Recursively merges properties from a source object into a target object.
 *
 * Purpose:
 * - Copies all enumerable properties from the source object into the target object.
 * - Merges nested objects recursively to preserve existing structure.
 * - Only overwrites properties in the target if the source provides a defined value.
 *
 * Dependency:
 * - This function does not depend on any graphics API, DOM API, or external library.
 * - Works purely with plain JavaScript objects.
 *
 * @template T - The type of the target object.
 * @template S - The type of the source object (can be partial of T).
 * @param target - The object to receive merged properties.
 * @param source - The object whose properties will be merged into the target.
 */

export function deepMerge<T extends object, S extends Partial<T>>(
  target: T,
  source: S
): void {
  if (!target || !source) return;

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const typedKey = key as keyof S;
    const sourceValue = source[typedKey];
    const targetValue = target[typedKey as keyof T];

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      deepMerge(targetValue as any, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (target[typedKey as keyof T] as any) = sourceValue;
    }
  }
}

/**
 * Determines the pivot point coordinates for a shape based on a specified mode or anchor.
 *
 * Purpose:
 * - Calculates the (x, y) position of the pivot for transformations, rotations, or scaling.
 * - Supports various pivot modes such as corners (TL, TR, BR, BL), edges (TM, RM, BM, LM), and center.
 * - Defaults to the top-left corner (`TL`) if no mode is provided.
 *
 * Dependency:
 * - Depends on a Float32Array representing the oriented bounding box (OBB) of the shape.
 * - Does not rely on any graphics API or DOM API; purely a mathematical calculation.
 *
 * @param mode - A string or enum representing the desired pivot mode or anchor.
 *               Examples: `'TL'`, `'TR'`, `'BR'`, `'BL'`, `'C'`, `'center'`, `'TM'`, `'RM'`, `'BM'`, `'LM'`.
 * @param OBB - A `Float32Array` representing the four corners of the shape's bounding box in order.
 *
 * @returns A tuple `[x, y]` representing the coordinates of the chosen pivot point.
 */
export function pivotSetter(
  mode: modes | anchors | undefined,
  OBB: number[][] // Float32Array
): [number, number] {
  const [x1, y1] = OBB[0] as [number, number];
  const [x2, y2] = OBB[1] as [number, number];
  const [x3, y3] = OBB[2] as [number, number];
  const [x4, y4] = OBB[3] as [number, number];

  // Precompute sums used multiple times
  const sumX = [x1 + x2, x2 + x3, x3 + x4, x1 + x4];
  const sumY = [y1 + y2, y2 + y3, y3 + y4, y1 + y4];
  const centerX = (x1 + x2 + x3 + x4) / 4;
  const centerY = (y1 + y2 + y3 + y4) / 4;

  const lookup: Record<string, [number, number]> = {
    r: [x1, y1],
    relative: [x1, y1],
    TL: [x1, y1],
    c: [centerX, centerY],
    center: [centerX, centerY],
    C: [centerX, centerY],
    TM: [sumX[0]! / 2, sumY[0]! / 2],
    TR: [x2, y2],
    RM: [sumX[1]! / 2, sumY[1]! / 2],
    BR: [x3, y3],
    BM: [sumX[2]! / 2, sumY[2]! / 2],
    BL: [x4, y4],
    LM: [sumX[3]! / 2, sumY[3]! / 2]
  };

  return lookup[mode ?? 'TL'] ?? [x1, y1];
}

/**
 * Determines the optimal transformation computation strategy based on pivot settings.
 *
 * Purpose:
 * - Checks if rotation (or other transformations like scale/skew if enabled) uses an arbitrary pivot point.
 * - Returns `'preComputeFrames'` if an arbitrary pivot exists, requiring precomputation of frames.
 * - Returns `'fitPolynomialCofficient'` if all pivots are standard, allowing polynomial fitting optimization.
 *
 * Dependency:
 * - Depends on the input parameter object `TransformGeometryWithPivot` containing rotation, pivot, and optionally scale/skew values.
 * - Does not rely on any graphics API, DOM API, or external library.
 *
 * @param params - An object containing transformation parameters:
 *                 - `Rotate`: rotation angle in degrees or radians.
 *                 - `rotatePivot`: `[x, y]` coordinates of the rotation pivot point.
 *                 - Optional commented-out parameters: scale, skew, and their pivots.
 *
 * @returns A string indicating the recommended optimization method:
 *          - `'preComputeFrames'` → use precomputed frames due to arbitrary pivot.
 *          - `'fitPolynomialCofficient'` → safe to apply polynomial fitting for performance.
 */

export function choosePivotAwareOptimization(
  params: TransformGeometryWithPivot
): opt {
  const {
    Rotate = 0,
    rotatePivot = [0, 0]
    //Scale = [1, 1],                                                                          94     // scalePivot = [0, 0],
    // Skew = [0, 0],
    // skewPivot = [0, 0]
    //   Translate = [0, 0]
  } = params;

  // --- Check if rotation pivot is arbitrary ---
  const rotationArbitrary =
    Rotate !== 0 && (rotatePivot[0] !== 0 || rotatePivot[1] !== 0);

  if (rotationArbitrary) {
    // --- If rotation with arbitrary pivot exists → must use precompute ---
    return 'preComputeFrames';
  }

  // Optional: if skew with arbitrary pivot breaks polynomial fit, uncomment
  // if (skewArbitrary) return 'precompute';

  // Otherwise, polynomial fit is safe
  return 'fitPolynomialCofficient';
}
