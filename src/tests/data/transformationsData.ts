/**
 * ============================================================================
 * Transformation Test Datasets & Specifications
 * ============================================================================
 *
 * This module defines shared test datasets, expected transformation parameters,
 * and verification tolerance thresholds for all transformation test suites
 * (translate, scale, rotate, skew, transform, beginT, endT).
 *
 * ============================================================================
 * VALID tType VALUES PER TRANSFORMATION (case-insensitive)
 * ============================================================================
 *
 *  translate : 'a' | 'absolute'   → translate relative to resolved pivot from bounds (TL corner)
 *              'r' | 'relative'   → translate directly (no pivot, pure offset)
 *              'c' | 'center'     → translate relative to resolved center of bounds
 *              'p' | 'pivot'      → translate relative to manually provided px/py coordinates
 *
 *  scale     : 'a' | 'absolute'   → scale around resolved pivot from bounds (uses px/py from resolvePivots)
 *              'r' | 'relative'   → scale without pivot (raw scale from current state)
 *              'p' | 'pivot'      → scale around manually provided px/py coordinates
 *
 *  rotate    : 'a' | 'absolute'   → rotate around resolved pivot (uses px/py from resolvePivots → TL)
 *              'r' | 'relative'   → rotate directly (no pivot translation)
 *              'p' | 'pivot'      → rotate around manually provided px/py coordinates
 *
 *  skew      : 'a' | 'absolute'   → skew around resolved pivot (uses px/py from resolvePivots)
 *              'r' | 'relative'   → skew directly (no pivot translation)
 *              'p' | 'pivot'      → skew around manually provided px/py coordinates
 *
 * NOTE: 'center'/'c' is ONLY valid for translate — it is NOT a valid tType for scale/rotate/skew.
 * NOTE: Anchor strings like 'TL', 'BM', 'TR' etc. are NOT valid tType values — they are
 *       resolved internally by resolvePivots() when tType is 'a' or 'r'. They must NOT
 *       be passed as tType to any transformation method.
 */

export interface TransformTestCase<T = Record<string, any>> {
  id: string;
  name: string;
  description: string;
  props: T;
  tolerance?: number;
  expectedStatus: "pass" | "fail";
  isNegative?: boolean;
}

// ----------------------------------------------------------------------------
// 1. TRANSLATION TEST DATA
// ----------------------------------------------------------------------------
// Valid tType for translate: 'a' | 'absolute' | 'r' | 'relative' | 'c' | 'center' | 'p' | 'pivot'
// Default: 'a' (absolute — resolves pivot to TL corner of bounds)
// ----------------------------------------------------------------------------
export const translateTestData: TransformTestCase[] = [
  {
    id: "translate-absolute",
    name: "Absolute Translation (tType: 'a')",
    description: "Translates shape by (dx: 30, dy: 40) in absolute mode — pivot resolves to TL corner",
    props: { x: 30, y: 40, tType: "a" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "translate-relative",
    name: "Relative Translation (tType: 'r')",
    description: "Translates shape by (dx: 20, dy: 20) in relative mode — raw offset, no pivot",
    props: { x: 20, y: 20, tType: "r" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "translate-center",
    name: "Center-Anchor Translation (tType: 'c')",
    description: "Translates shape by (dx: 15, dy: 10) relative to shape center (only valid for translate)",
    props: { x: 15, y: 10, tType: "c" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "translate-pivot",
    name: "Manual Pivot Translation (tType: 'p')",
    description: "Translates shape by (dx: 25, dy: 25) pivoting around user-supplied coordinate (px: 50, py: 50)",
    props: { x: 25, y: 25, tType: "p", px: 50, py: 50 },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "translate-negative-offsets",
    name: "Negative Offset Translation (tType: 'relative')",
    description: "Translates shape by negative offsets (dx: -15, dy: -25) in relative mode",
    props: { x: -15, y: -25, tType: "relative" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "translate-zero-identity",
    name: "Zero Offset Identity Translation (tType: 'r')",
    description: "Translates shape by zero offset (dx: 0, dy: 0) — bounding box should remain unchanged",
    props: { x: 0, y: 0, tType: "r" },
    tolerance: 0.1,
    expectedStatus: "pass",
  },
  {
    id: "translate-negative-invalid-type",
    name: "Negative Test: Non-numeric Translation Offset",
    description: "Passes a non-numeric value for x — parameterTypeValidator should reject with an error",
    props: { x: "not_a_number" as any, y: 20, tType: "r" },
    expectedStatus: "fail",
    isNegative: true,
  },
];

// ----------------------------------------------------------------------------
// 2. SCALE TEST DATA
// ----------------------------------------------------------------------------
// Valid tType for scale: 'a' | 'absolute' | 'r' | 'relative' | 'p' | 'pivot'
// Default: 'a' (absolute — px/py resolved from bounds by resolvePivots → TL corner at (minX, minY))
// NOTE: 'c'/'center' is NOT valid for scale.
// NOTE: Passing explicit px/py is only meaningful when tType is 'p' (pivot).
//       For tType 'a', px/py are overwritten by resolvePivots(). Use tType 'p' for custom pivot.
// ----------------------------------------------------------------------------
export const scaleTestData: TransformTestCase[] = [
  {
    id: "scale-absolute-default",
    name: "Absolute Scaling (tType: 'a') — Pivot at TL Corner",
    description: "Scales shape uniformly by 2x (sx: 2, sy: 2) in absolute mode — pivot resolves to TL corner of bounds",
    props: { sx: 2, sy: 2, tType: "a" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "scale-relative",
    name: "Relative Scaling (tType: 'r') — No Pivot",
    description: "Scales shape non-uniformly (sx: 1.5, sy: 0.75) in relative mode — no pivot translation applied",
    props: { sx: 1.5, sy: 0.75, tType: "r" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "scale-explicit-pivot",
    name: "Pivot Scaling (tType: 'p') — Custom Coordinate Pivot",
    description: "Scales shape (sx: 1.5, sy: 1.5) around explicit pivot coordinate (px: 50, py: 50)",
    props: { sx: 1.5, sy: 1.5, tType: "p", px: 50, py: 50 },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "scale-identity",
    name: "Identity Scaling (sx: 1, sy: 1)",
    description: "Scales shape by identity factor (sx: 1, sy: 1) in relative mode — dimensions must be preserved",
    props: { sx: 1, sy: 1, tType: "r" },
    tolerance: 0.1,
    expectedStatus: "pass",
  },
  {
    id: "scale-negative-invalid-type",
    name: "Negative Test: Non-numeric Scale Factor",
    description: "Passes a non-numeric value for sx — parameterTypeValidator should reject with an error",
    props: { sx: "invalid_factor" as any, sy: 2, tType: "r" },
    expectedStatus: "fail",
    isNegative: true,
  },
];

// ----------------------------------------------------------------------------
// 3. ROTATION TEST DATA
// ----------------------------------------------------------------------------
// Valid tType for rotate: 'a' | 'absolute' | 'r' | 'relative' | 'p' | 'pivot'
// Default: 'a' (absolute — px/py resolved from bounds by resolvePivots → TL corner at (minX, minY))
// NOTE: 'c'/'center' is NOT valid for rotate.
// NOTE: For custom-center rotation, use tType: 'p' with explicit px/py pointing to the shape center.
// ----------------------------------------------------------------------------
export const rotateTestData: TransformTestCase[] = [
  {
    id: "rotate-45-relative",
    name: "45-Degree Relative Rotation (tType: 'r')",
    description: "Rotates shape 45 degrees in relative mode — no pivot translation, pure in-place rotation",
    props: { angle: 45, tType: "r" },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "rotate-90-pivot",
    name: "90-Degree Pivot Rotation (tType: 'p')",
    description: "Rotates shape 90 degrees around explicit coordinate pivot (px: 60, py: 60)",
    props: { angle: 90, tType: "p", px: 60, py: 60 },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "rotate-180-absolute",
    name: "180-Degree Absolute Rotation (tType: 'a')",
    description: "Rotates shape 180 degrees in absolute mode — pivot resolves to TL corner (minX, minY)",
    props: { angle: 180, tType: "a" },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "rotate-360-modulo",
    name: "360-Degree Full Turn (Modulo Normalization)",
    description: "Rotates shape 360 degrees in relative mode — angle % 360 = 0, should produce near-identity result",
    props: { angle: 360, tType: "r" },
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "rotate-negative-angle",
    name: "Negative Counter-Clockwise Rotation (tType: 'p')",
    description: "Rotates shape -45 degrees around explicit pivot (px: 40, py: 40)",
    props: { angle: -45, tType: "p", px: 40, py: 40 },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "rotate-negative-invalid-type",
    name: "Negative Test: Non-numeric Rotation Angle",
    description: "Passes a non-numeric value for angle — parameterTypeValidator should reject with an error",
    props: { angle: "not_a_number" as any, tType: "r" },
    expectedStatus: "fail",
    isNegative: true,
  },
];

// ----------------------------------------------------------------------------
// 4. SKEW TEST DATA
// ----------------------------------------------------------------------------
// Valid tType for skew: 'a' | 'absolute' | 'r' | 'relative' | 'p' | 'pivot'
// Default: 'a' (absolute — px/py resolved from bounds by resolvePivots → TL corner at (minX, minY))
// NOTE: 'c'/'center' is NOT valid for skew.
// NOTE: skewXSelf/skewYSelf skip when sx/sy is 0 (falsy), so zero-axis is safe.
// ----------------------------------------------------------------------------
export const skewTestData: TransformTestCase[] = [
  {
    id: "skew-horizontal-relative",
    name: "Horizontal Shear in Relative Mode (tType: 'r')",
    description: "Applies horizontal shear of 15 degrees in relative mode (sx: 15, sy: 0) — no pivot translation",
    props: { sx: 15, sy: 0, tType: "r" },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "skew-vertical-relative",
    name: "Vertical Shear in Relative Mode (tType: 'r')",
    description: "Applies vertical shear of 15 degrees in relative mode (sx: 0, sy: 15) — no pivot translation",
    props: { sx: 0, sy: 15, tType: "r" },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "skew-dual-axis-pivot",
    name: "Dual-Axis Shear with Explicit Pivot (tType: 'p')",
    description: "Applies shear along both axes (sx: 10, sy: 10) around explicit pivot (px: 40, py: 40)",
    props: { sx: 10, sy: 10, tType: "p", px: 40, py: 40 },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "skew-absolute-default",
    name: "Absolute Skew (tType: 'a') — Pivot at TL Corner",
    description: "Applies horizontal shear (sx: 10, sy: 0) in absolute mode — pivot resolves to TL corner of bounds",
    props: { sx: 10, sy: 0, tType: "a" },
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "skew-zero-identity",
    name: "Zero Skew Identity (sx: 0, sy: 0)",
    description: "Applies zero shear in relative mode (sx: 0, sy: 0) — skewXSelf/skewYSelf skipped, matrix unchanged",
    props: { sx: 0, sy: 0, tType: "r" },
    tolerance: 0.1,
    expectedStatus: "pass",
  },
  {
    id: "skew-negative-invalid-type",
    name: "Negative Test: Non-numeric Skew Values",
    description: "Passes a non-numeric value for sx — parameterTypeValidator should reject with an error",
    props: { sx: "not_a_number" as any, sy: 0, tType: "r" },
    expectedStatus: "fail",
    isNegative: true,
  },
];

// ----------------------------------------------------------------------------
// 5. DSL TRANSFORM TEST DATA
// ----------------------------------------------------------------------------
// transform(dsl: string) parses DSL expression strings via parseExpression()
// and dispatches to translate/scale/rotate/skew internally.
// Valid DSL command names: translate, scale, rotate, skew
// Arguments follow the same rules as direct method calls.
// ----------------------------------------------------------------------------
export const transformDslTestData: TransformTestCase<string>[] = [
  {
    id: "dsl-single-translate",
    name: "Single DSL Command: translate(25, 35)",
    description: "Parses and applies a single translate instruction via DSL string 'translate(25, 35)'",
    props: "translate(25, 35)",
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "dsl-single-scale",
    name: "Single DSL Command: scale(1.5, 1.5)",
    description: "Parses and applies a single scale instruction via DSL string 'scale(1.5, 1.5)'",
    props: "scale(1.5, 1.5)",
    tolerance: 0.5,
    expectedStatus: "pass",
  },
  {
    id: "dsl-combined-translate-scale",
    name: "Combined Multi-Command DSL: translate then scale",
    description: "Parses and sequentially applies translate then scale via 'translate(20, 20) scale(1.2, 1.2)'",
    props: "translate(20, 20) scale(1.2, 1.2)",
    tolerance: 0.75,
    expectedStatus: "pass",
  },
  {
    id: "dsl-negative-malformed-syntax",
    name: "Negative Test: Malformed/Unknown DSL Command",
    description: "Passes an invalid DSL string — parseExpression should throw an InvalidFormatError or similar",
    props: "unknownOp(10, 20)",
    expectedStatus: "fail",
    isNegative: true,
  },
];

// ----------------------------------------------------------------------------
// 6. BATCHING (BEGINT & ENDT) TEST DATA
// ----------------------------------------------------------------------------
// beginT() activates batching mode — subsequent calls accumulate into composed matrix.
// endT() finalizes and returns the 9-element Float32Array (3x3 affine homogeneous matrix).
// Calling beginT() while already batching throws OperationInProgressError.
// Calling endT() without active beginT() returns identity matrix [1,0,0, 0,1,0, 0,0,1].
// ----------------------------------------------------------------------------
export const batchingTestData = {
  chainedMultiTransform: {
    name: "Chained Batch: translate → scale → rotate",
    description: "Applies translate, scale, and rotate in a single beginT()...endT() batch — all composed into one Float32Array matrix",
    // tType 'r' (relative) used throughout to avoid dependency on shape-specific bound resolution
    translate: { x: 15, y: 25, tType: "r" },
    scale: { sx: 1.5, sy: 1.5, tType: "r" },
    rotate: { angle: 45, tType: "r" },
    tolerance: 0.75,
  },
  nestedBatchError: {
    name: "Negative Test: Nested beginT() Throws OperationInProgressError",
    description: "Calling beginT() a second time while a batch is already active must throw OperationInProgressError",
  },
  safeUnbatchedEndT: {
    name: "Safe No-Op: endT() Without Active Batch Returns Identity Matrix",
    description: "Calling endT() without a prior beginT() returns a 9-element Float32Array identity matrix [1,0,0,0,1,0,0,0,1]",
    expectedMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  },
};
