/**
 * Standard anchor locations on an oriented bounding box.
 *
 * TL = Top Left
 * TM = Top Middle
 * TR = Top Right
 * RM = Right Middle
 * BR = Bottom Right
 * BM = Bottom Middle
 * BL = Bottom Left
 * LM = Left Middle
 * C  = Center
 */
export type UpperCasePivotAnchors =
  | 'TL'
  | 'TM'
  | 'TR'
  | 'RM'
  | 'BR'
  | 'BM'
  | 'BL'
  | 'LM'
  | 'C';

export type LowerCasePivotAnchors = Lowercase<UpperCasePivotAnchors>;

/**
 * Supports both uppercase and lowercase anchor names.
 */
export type PivotAnchors = UpperCasePivotAnchors | LowerCasePivotAnchors;

/**
 * Pivot location.
 *
 * Can be either an explicit coordinate
 * or one of the predefined anchors.
 */
export type Pivot = { px?: number; py?: number };

/**
 * Transform reference modes.
 */
export type LowerCaseTransformAnchors =
  | 'r'
  | 'relative' // local coordinate space
  | 'a'
  | 'absolute' // Globle or canvas coordinate space
  | 'p'
  | 'pivot'; // arbitry coordinate space

export type UpperCaseTransformAnchors = Uppercase<LowerCaseTransformAnchors>;

export type TransformAnchors =
  | LowerCaseTransformAnchors
  | UpperCaseTransformAnchors;

/**
 * Center anchor aliases.
 */
export type LowerCaseCenterAnchors = 'c' | 'center';

export type UpperCaseCenterAnchors = Uppercase<LowerCaseCenterAnchors>;

export type CenterAnchors = LowerCaseCenterAnchors | UpperCaseCenterAnchors;
