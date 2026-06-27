import type { Pivot, PivotAnchors } from '../geometry/anchors';

/**
 * Pivot resolution mode.
 */
export type PivotMode = 'r' | 'relative' | 'c' | 'center' | 'p' | 'pivot';

/**
 * Pivot configuration.
 */
export type PivotOptions = {
  mode?: PivotMode;

  commonPivot?: Pivot | PivotAnchors;

  scalePivot?: Pivot | PivotAnchors;

  rotatePivot?: Pivot | PivotAnchors;

  skewPivot?: Pivot | PivotAnchors;
};
