/**
 * Supported interpolation curves.
 */
export type CurveType = "linear" | "quadratic" | "cubic" | "arc" | "earc";

/**
 * Curve metadata.
 */
export type CurveInfo = {
  quadraticControlX?: number;
  quadraticControlY?: number;

  cubicControlPoint1?: Point2D;
  cubicControlPoint2?: Point2D;

  arcDirection?: number;
};

/**
 * Arc-length lookup table entry.
 */
export type ArcLengthTableEntry = {
  t: number;
  distance: number;
};
