import { CenterAnchors, Pivot, TransformAnchors } from "./anchors";
import { ArrayType, Major } from "./types";

/**
 * Translation.
 */
export type Translation = {
  x: number;
  y: number;
};

/**
 * Scale factors.
 */
export type Scale = {
  sx: number;
  sy: number;
};

/**
 * Skew angles.
 */
export type Skew = {
  sx: number;
  sy: number;
};

/**
 * Rotation angle.
 */
export type Rotation = {
  angle: number;
};

/**
 * Complete transform values.
 */
export type BaseTransformations = {
  translate?: Translation;
  scale?: Scale;
  skew?: Skew;
  rotate?: Rotation;
};

// Core transform metadata shared by all except flip
export interface BaseTransformationMeta extends Pivot {
  tType?: TransformAnchors | CenterAnchors;
}

// Translate
export interface TranslateMethodProps
  extends BaseTransformationMeta, Translation {
  tType?: TransformAnchors | CenterAnchors;
}

// Scale
export interface ScaleMethodProps extends BaseTransformationMeta, Scale {}

// Rotate
export interface RotateMethodProps extends BaseTransformationMeta, Rotation {}

// Skew
export interface SkewMethodProps extends BaseTransformationMeta, Skew {}

// dsl transformations data parser type
export type ParsedDaTa = { tName: string; data: {} };

/**
 * Complete transform values.
 */
export type PivotTransformations = {
  translate: TranslateMethodProps;
  scale: ScaleMethodProps;
  skew: SkewMethodProps;
  rotate: RotateMethodProps;
};

export type CreateTransformationMatrixProps = {
  transformations?: PivotTransformations;
  major?: Major; // 'row' | 'column'
  arrayType?: ArrayType; // 'normal' | 'float32'
  baseTMatrix?: Float32Array;
  multiplyWithBase?: boolean;
};
