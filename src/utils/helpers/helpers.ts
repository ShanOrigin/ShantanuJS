import { DEV_INTERNAL_ACCESS } from '../internals/accessKeys.js';

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
 * Checks whether a given SVG element has a valid parent canvas (an `<svg>` root element).
 *
 * Purpose:
 * - Ensures that a graphical element is properly attached to the main SVG canvas.
 * - Helps avoid errors when trying to interact with or render elements that are not added to the canvas.
 * - Can optionally return whether the parent canvas is marked as "selectable" through its data attributes.
 *
 * Dependency:
 * - This function does not depend on any specific graphics API (like WebGL or Canvas2D).
 * - It only relies on standard **SVG DOM elements** available in the browser.
 *
 * @param svg - The SVG element being checked. Can be `null`.
 * @param classType - A descriptive name for the type of element (default is `"GraphicalElement"`).
 *                    This is used only in error messages for clarity.
 * @param returnType - A flag to decide the function's behavior.
 *                     - If `false` (default), the function only checks and throws an error if invalid.
 *                     - If `true`, the function also returns a `boolean` indicating whether the canvas is selectable.
 *
 * @returns `void` (nothing) if `returnType` is false.
 *          A `boolean` (`true`/`false`) if `returnType` is true.
 */

export function checkParent(
  svg: SVGElement | null,
  classType: string = 'GraphicalElement',
  returnType: boolean = false
): void | boolean {
  const svgCanvas = svg?.ownerSVGElement;

  if (!(svgCanvas instanceof SVGSVGElement)) {
    throw new Error(
      `Possibly this ${classType} is not added to the svg canvas. Please use canvas.addTo() to add this Group.`
    );
  } else {
    if (returnType) {
      const val = Boolean(svgCanvas.dataset.selectable);
      return val;
    }
  }
}

/**
 * Assigns bounding box (Obbox) and/or shape matrix data to a graphical object.
 *
 * Purpose:
 * - Takes a matrix-generating function and writes its result into the target object's shared buffer.
 * - Ensures that the object has up-to-date geometric information for rendering or calculations.
 * - Can assign either:
 *   - Only the shape matrix,
 *   - Only the oriented bounding box (Obbox),
 *   - Or both at the same time.
 *
 * Dependency:
 * - This function does not rely on a specific graphics API like WebGL or Canvas2D.
 * - It depends only on JavaScript typed arrays (`Float32Array`) and the given data structure.
 *
 * @param g - The graphical object that will receive the matrix and/or Obbox.
 *            Expected to contain a `sharedBuffer` (a `Float32Array`) where data is stored.
 * @param fn - A function that produces the required matrix data.
 *             Must return an object with a `matrix` field (array of `Float32Array` rows).
 * @param key - A selector that determines what should be assigned:
 *              - `'Obbox'` → Only assign bounding box.
 *              - `'matrix'` → Only assign transformation matrix.
 *              - `'both'` → Assign both bounding box and matrix.
 *              Defaults to `'Obbox'`.
 *
 * @throws Error if:
 * - Parameters are invalid (e.g., missing object, missing function, or unsupported key).
 * - The returned matrix data is not properly structured.
 * - The shared buffer is too small to store the data.
 */
/*
export function assignBBoxMatrix(
  g: any,
  fn: Function,
  key: 'obbox' | 'canonicalMatrix' | 'both' = 'obbox'
) {
  try {
    //  console.log(g, typeof fn);
    if (
      !g ||
      typeof g !== 'object' ||
      'Obbox' in g ||
      typeof fn != 'function' ||
      (key !== 'obbox' && key !== 'canonicalMatrix' && key !== 'both')
    )
      throw new Error('please check parameters of assignBBoxMatrix ');

    const b = fn() as { matrix: Float32Array[] };
    // console.log(' in assignBBoxMatrix ', b);

    if (typeof b !== 'object' || !('matrix' in b))
      throw new Error(
        'Matrix assignment field check parameters specially function parameter'
      );

    let slen = g?.canonicalMatrix?.length ?? 0;
    const sb = g?.sharedBuffer as Float32Array;

    if (sb.length <= 12)
      throw new Error('Shared buffer too small to store matrix data');

    const [r0, r1, r2, r3] = b.matrix;
    const bm = [
      r0[0],
      r0[1],
      1,
      r1[0],
      r1[1],
      1,
      r2[0],
      r2[1],
      1,
      r3[0],
      r3[1],
      1
    ];

    if (key == 'canonicalMatrix' || key == 'both') {
      const offSet = 0;
      sb.set(bm, offSet);
      const mat = [
        new Float32Array(sb.buffer, offSet + 0 * 4, 3),
        new Float32Array(sb.buffer, offSet + 3 * 4, 3),
        new Float32Array(sb.buffer, offSet + 6 * 4, 3),
        new Float32Array(sb.buffer, offSet + 9 * 4, 3)
      ];

      g['canonicalMatrix'] = mat;
      slen = 4;
    }

    if (key == 'obbox' || key == 'both') {
      let offSet = slen * 3;
      // console.log('seting obbox', offSet, '+', bm.length * 4, sb.byteLength);
      sb.set(bm, offSet);
      // console.log('seted obbox');
      offSet *= 4;
      const mat = [
        new Float32Array(sb.buffer, offSet + 0 * 4, 3),
        new Float32Array(sb.buffer, offSet + 3 * 4, 3),
        new Float32Array(sb.buffer, offSet + 6 * 4, 3),
        new Float32Array(sb.buffer, offSet + 9 * 4, 3)
      ];

      g['obbox'] = mat;
    }
  } catch (e) {
    throw e;
  }
}
*/

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
 * Records a transformation applied to a graphical object into its transformation history list.
 *
 * Purpose:
 * - Maintains a stack-like log of all transformations applied to a shape.
 * - Each entry contains the type of matrix, the transformation type, and the transformation matrix itself.
 * - The first entry (index 0) accumulates the combined result of all subsequent transformations,
 *   providing a quick reference for the current overall transformation.
 *
 * Dependency:
 * - This function does not rely on any graphics API (like WebGL or Canvas2D).
 * - It operates purely on JavaScript objects and `Float32Array` for storing matrices.
 *
 * @param g - The graphical object to track transformations for.
 *            Expected to store a `TList` array for transformation history.
 * @param MatrixType - A string identifying the type of matrix being applied (e.g., "2D", "3D").
 * @param type - A string describing the kind of transformation (e.g., "translate", "rotate", "scale").
 * @param TMatrix - The transformation matrix as a `Float32Array` representing the applied transformation.
 *
 * @returns Nothing (`void`).
 *
 * @note The `TList` acts like a hybrid stack: index 0 contains the cumulative result of all other transformations.
 */
/*
export function trackTransformation(
  g: any,
  MatrixType: string,
  type: string,
  TMatrix: Float32Array
) {
  try {
    if (!g || typeof g !== 'object') return;

    const entry = { MatrixType, type, TMatrix };

    (g.TList ??= []).push(entry);
  } catch (e) {
    throw e;
  }
}
*/

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
 * Calculates the determinant of a 3x3 matrix.
 *
 * Purpose:
 * - Provides a numerical value representing the determinant of a 3x3 matrix,
 *   which is useful for transformations, checking invertibility, and other geometric calculations.
 * - Ensures that the matrix is valid before computing the determinant to prevent errors.
 *
 * Dependency:
 * - Relies on the `isValidMatrix` function to confirm the matrix structure.
 * - Does not depend on any graphics API; works purely with JavaScript `Float32Array`.
 *
 * @param matrix - A 3x3 matrix represented as an array of `Float32Array` rows, each of length 3.
 *
 * @returns The determinant of the matrix as a `number`.
 *
 * @throws Error if:
 * - The matrix is not a valid 3x3 matrix of `Float32Array` rows.
 */

export function determinant(matrix: Float32Array[]): number {
  try {
    if (!isValidMatrix(matrix, 3, 3)) {
      throw new Error(
        'Matrix must be 3x3 with each row as Float32Array of length 3'
      );
    }
    const [a, b, c] = matrix[0];
    const [d, e, f] = matrix[1];
    const [g, h, i] = matrix[2];
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  } catch (e) {
    throw e;
  }
}

/**
 * Calculates the area of a triangle using the Shoelace formula.
 *
 * Purpose:
 * - Computes the area of a triangle given its vertices arranged in a 3x3 matrix.
 * - Uses the determinant of the matrix to apply the Shoelace formula efficiently.
 *
 * Dependency:
 * - Relies on the `determinant` function to compute the determinant of the matrix.
 * - Does not depend on any graphics API; purely mathematical computation with `Float32Array`.
 *
 * @param matrix - A 3x3 matrix as an array of `Float32Array` rows representing the triangle's vertices.
 *
 * @returns The area of the triangle as a positive `number`.
 *
 * @throws Error if:
 * - The matrix is invalid or not suitable for computing the determinant (checked by `determinant`).
 */

export function triangleAreaByShoelaceFormula(matrix: Float32Array[]): number {
  try {
    const det = determinant(matrix);

    const ShoelaceResult = Math.abs(det) / 2;
    return ShoelaceResult;
  } catch (e) {
    throw e;
  }
}

/**
 * Computes the equation of a line passing through two points in 2D space.
 *
 * Purpose:
 * - Provides the standard form of a linear equation `ax + by = c` for a line through two points.
 * - Handles special cases for vertical (`x = constant`) and horizontal (`y = constant`) lines.
 * - Rounds coefficients to two decimal places for readability.
 *
 * Dependency:
 * - This function does not rely on any graphics API; it performs basic mathematical calculations.
 *
 * @param [x1, y1] - The first point on the line as a tuple of numbers.
 * @param [x2, y2] - The second point on the line as a tuple of numbers.
 *
 * @returns A string representing the line equation in standard form `ax + by = c`.
 */

export function linearEquation(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number]
): string {
  try {
    // vertical line  x = constant
    if (x2 === x1) return `1x + 0y = ${x1}`;

    // horizontal line  y = constant
    if (y2 === y1) return `0x + 1y = ${y1}`;

    // general case
    const m = (y2 - y1) / (x2 - x1);
    const a = m;
    const b = -1;
    const c = m * x1 - y1;

    const fmt = (n: number) => Math.trunc(n * 100) / 100;

    return `${fmt(a)}x ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}y = ${fmt(c)}`;
  } catch (e) {
    throw e;
  }
}
/*
export function getAbsolutePoint(m: Float32Array[]): Float32Array {
  try {
    if (!m.length || !isValidMatrix(m, m.length, m[0].length))
      return new Float32Array([0, 0]);
    return new Float32Array([m[0][0], m[0][1]]);
  } catch (e) {
    throw e;
  }
}

export function getCentre(smat: Float32Array[]): Float32Array {
  try {
    const centroid: Float32Array = new Float32Array([0, 0]);
    const TotalVertex = smat.length;
    if (!isValidMatrix(smat, smat.length, smat[0].length)) return centroid;
    let [cx, cy] = [0, 0];

    for (let i = 0; i < smat.length; i++) {
      const row = smat[i];
      cx += row[0];
      cy += row[1];
    }

    centroid[0] = cx / TotalVertex;
    centroid[1] = cy / TotalVertex;

    return centroid;
  } catch (e) {
    throw e;
  }
}
*/

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

/*
export function getChannelMatrix(g: any, fn: Function, sw: number) {
  try {
    //
    // function for recalculating bounding box Matrix after changing the with stroke width
    // fn : returns oriented bounding box all its dimensions
    if (
      !g ||
      !('matrix' in g) ||
      typeof g !== 'object' ||
      !('Obbox' in g) ||
      typeof fn != 'function'
    )
      return;

    const { localXAxis: u, localYAxis: v } = fn() as {
      localXAxis: number[];
      localYAxis: number[];
    };

    const m = g.Obbox as number[][];
    const s = sw * 0.5 + 0.8;
    const cs = [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s]
    ];

    const newMat = m.map((r: number[], i: number) => {
      const [x, y] = r;
      const offset = cs[i];
      return [
        x * u[0] + y * v[0] + offset[0],
        x * u[1] + y * v[1] + offset[1],
        1
      ];
    });

    g.Obbox = newMat;
  } catch (e) {
    throw e;
  }
}
*/

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

/**
 * Restores a graphical object's transformation state and optionally applies effects or rendering updates.
 *
 * Purpose:
 * - Converts a DOMMatrix into a Float32Array format suitable for internal tracking.
 * - Optionally tracks the transformation in the object's history (`TList`).
 * - Applies internal effect restoration and updates the renderer if required.
 * - Provides flexibility for visual effects, projections, and transformation tracking.
 *
 * Dependency:
 * - Depends on `trackTransformation` for maintaining transformation history.
 * - Uses a DOMMatrix for input transformations but does not rely on any specific graphics API.
 * - Renderer and restore functions are passed in, making this function framework-agnostic.
 *
 * @param g - The graphical object to render or update.
 * @param geo - The geometry object used for transformation tracking.
 * @param tmat - The DOMMatrix representing the transformation to restore.
 * @param transformation - A string identifying the transformation type (e.g., "rotate", "scale").
 * @param type - A string describing the category of the transformation.
 * @param isEffect - Boolean indicating whether to apply internal effect restoration.
 * @param isVEffect - Boolean indicating whether to apply visual effects via the renderer. Defaults to `true`.
 * @param isProjections - Boolean indicating whether to apply projections during rendering. Defaults to `true`.
 * @param track - Boolean indicating whether to track this transformation in history. Defaults to `true`.
 * @param restoreFN - A function that performs effect restoration (framework-specific).
 * @param rendererFN - A function that handles rendering updates for the object.
 */
/*
export function restore({
  g,
  geo,
  tmat,
  transformation,
  type,
  isEffect,
  isVEffect = true,
  isProjections = true,
  track = true,
  restoreFN,
  rendererFN
}: {
  g: object;
geo: object;
  tmat: DOMMatrix;
  transformation: string;
  type: string;
  isEffect: boolean;
  isVEffect: boolean;
  isProjections: boolean;
  track: boolean;
  restoreFN: Function;
  rendererFN: Function;
}) {
  const TM = new Float32Array([
    tmat.a,
    tmat.b,
    0,
    tmat.c,
    tmat.d,
    0,
    tmat.e,
    tmat.f,
    1
  ]); // column major because shape matrix is row major and for clearity

  track && geo && trackTransformation(geo, transformation, type, TM);
  isEffect && restoreFN(DEV_INTERNAL_ACCESS);
  isVEffect &&
    rendererFN({
      el: g,
      T: tmat,
      isEffect: isVEffect,
      isProjections
    });
}
*/

/**
 * Computes the axis-aligned bounding box (AABB) for a graphical object.
 *
 * Purpose:
 * - Ensures the object has an oriented bounding box (`Obbox`) and calculates its minimum and maximum coordinates.
 * - Determines the width, height, and center coordinates of the bounding box.
 * - Returns the corner points in canvas order as a matrix suitable for further transformations or rendering.
 *
 * Dependency:
 * - Uses `assignBBoxMatrix` to generate the object's bounding box if not already present.
 * - Does not depend on any specific graphics API; works with plain JavaScript objects and `Float32Array`.
 *
 * @param geo - The graphical object whose bounding box is to be computed. Expected to contain or receive an `Obbox`.
 * @param fn - A function that generates the bounding box matrix if it does not exist.
 *
 * @returns An object containing:
 * - `x`, `y` → top-left coordinates of the bounding box.
 * - `width`, `height` → dimensions of the bounding box.
 * - `cx`, `cy` → center coordinates of the bounding box.
 * - `matrix` → an array of `Float32Array` representing the four corners in canvas order: top-left, top-right, bottom-right, bottom-left.
 *
 * @throws Error if `geo` is not an object or `fn` is not a function.
 */

/*
export function computeBBox(geo: any, fn: Function) {
  if (typeof geo !== 'object' && typeof fn !== 'function') {
    throw new Error(' Check parameters Of Function types are wrong  ');
  }
  if (!geo?.Obbox) {
    assignBBoxMatrix(geo, fn, 'obbox');
  }
  const matrix = geo?.Obbox as Float32Array[];

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (let i = 0; i < matrix.length; i++) {
    const [x, y] = matrix[i] as Float32Array;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const [cx, cy] = [minX + width / 2, minY + height / 2];
  // Create the 4 corner points in canvas order (top-left, top-right, bottom-right, bottom-left)
  const bboxMatrix = [
    new Float32Array([minX, minY, 1]), // top-left
    new Float32Array([maxX, minY, 1]), // top-right
    new Float32Array([maxX, maxY, 1]), // bottom-right
    new Float32Array([minX, maxY, 1]) // bottom-left
  ];
  return {
    x: minX,
    y: minY,
    width,
    height,
    cx,
    cy,
    matrix: bboxMatrix
  };
}

*/
