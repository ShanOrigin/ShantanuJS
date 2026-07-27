/**
 * Represents a 2D point.
 */
export type Point2D = {
  x: number;
  y: number;
};

/**
 * Represents a 2D vector.
 */
export type Vector2D = {
  x: number;
  y: number;
};

/**
 * Represents a pair of numeric values.
 */
export type NumericPair = [number, number];

export type BboxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  matrix: number[][];
};

export type Major = "row" | "column";
export type ArrayType = "normal" | "float32";
