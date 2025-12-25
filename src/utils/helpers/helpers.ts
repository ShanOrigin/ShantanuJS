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
 * Purpose:
 * This functions Takes messages from user and simply print that messages as errors in console so user may get context.
 *
 * @param msg - string based message from user
 *
 * @returns
 */

export function cerrors(msg: string) {
  console.error(msg);
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
      const row = mat[i];

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

    const [a, b, g, c, d, h, e, f, i] = tmat;

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
