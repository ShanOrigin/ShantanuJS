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
  rowlen: number,
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
        valid &&= typeof row[j] === "number";
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
        "Given matrix is not valid! Please check your parameters and ensure all elements are numbers.",
      );
    }
  } catch (e) {
    // Rethrow the error for further handling
    throw e;
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
  which: number = 0,
  major: "r" | "c" = "r",
): number[][] {
  const TMat = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  try {
    if ((!tList && !Array.isArray(tList)) || tList.length === 0) {
      return TMat;
    }

    let index = which;
    if (index === -1) index = tList.length - 1;
    if (index < 0 || index >= tList.length) {
      return TMat;
    }
    if (!("TMatrix" in tList[index])) {
      return TMat;
    }

    const tmat = tList[index]?.TMatrix;
    if (!(tmat instanceof Float32Array) || tmat.length < 9) {
      return TMat;
    }

    const [a = 1, b = 0, g = 0, c = 0, d = 1, h = 0, e = 0, f = 0, i = 1] =
      tmat;

    if (major === "r") {
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
    return TMat;
  }
}

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
