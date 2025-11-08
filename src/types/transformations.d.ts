// Core transform metadata shared by all except flip
interface BaseTransformMeta {
  type?: string;
  px?: number;
  py?: number;
}

// Effect-related props (used where needed)
interface EffectProps {
  isEffect?: boolean;
  isVEffect?: boolean;
  callbacks?: Function;
}

// Translate
export interface TranslateMethodProps extends BaseTransformMeta {
  x: number;
  y: number;
}

// Scale
export interface ScaleMethodProps extends BaseTransformMeta {
  sx: number;
  sy: number;
}

// Rotate
export interface RotateMethodProps extends BaseTransformMeta {
  angle: number;
}

// Skew
export interface SkewMethodProps extends BaseTransformMeta {
  sx: number;
  sy: number;
}

// Flip (does not use isEffect or callbacks)
export interface FlipMethodProps {
  flipX: boolean;
  flipY: boolean;
  dirX?: 'x+' | 'x-';
  dirY?: 'y+' | 'y-';
}

// Translate
export interface TranslateProps extends BaseTransformMeta, EffectProps {
  x: number;
  y: number;
}

// Scale
export interface ScaleProps extends BaseTransformMeta, EffectProps {
  sx: number;
  sy: number;
}

// Rotate
export interface RotateProps extends BaseTransformMeta, EffectProps {
  angle: number;
}

// Skew
export interface SkewProps extends BaseTransformMeta, EffectProps {
  sx: number;
  sy: number;
}

// Flip (does not use isEffect or callbacks)
export interface FlipProps extends EffectProps {
  flipX: boolean;
  flipY: boolean;
  dirX?: 'x+' | 'x-';
  dirY?: 'y+' | 'y-';
}

/*++++++++++++++++++++All Projections Types +++++++++++++++++++++*/
// Perspective
export interface PerspectiveProps extends BaseTransformMeta, EffectProps {
  g: number;
  h: number;
}

// Orthographic
export interface OrthographicProps extends BaseTransformMeta, EffectProps {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Oblique
export interface ObliqueProps extends BaseTransformMeta, EffectProps {
  depth: number;
  angle: number;
}

// Isometric
export interface IsometricProps extends BaseTransformMeta, EffectProps {
  axisAngle?: number;
  depthAngle?: number;
  depth?: number;
}

// Cavalier
export interface CavalierProps extends BaseTransformMeta, EffectProps {
  angle: number;
}

// Cabinet
export interface CabinetProps extends BaseTransformMeta, EffectProps {
  angle: number;
}

// Stereographic
export interface StereographicProps extends BaseTransformMeta, EffectProps {
  z: number;
}

/*++++++++++++++++++++++*/

export type ParsedDaTa = { tName: string; data: {} };
export type Parsed = { transformation: Function; tName: string; data: {} };
export type Vector2 = { x: number; y: number };

export type Matrix3x3 = [number[], number[], number[]];

// These are the valid method names on Matrix
export type MatrixMethodName =
  | 'multiply3x3By1x3'
  | 'multiply3x3By2x3'
  | 'multiply3x3By3x3'
  | 'multiply3x3By4x3'
  | 'multiply3x3By5x3'
  | 'multiply3x3Bynx3';

export type EffectMode = 'a' | 'v' | 'd' | 'all' | 'visual' | 'data';

/*
export type sl_sk_t_props = [
  number,
  number,
  'a' | 'absolute' | 'r' | 'relative' | 'p' | 'pivot',
  number,
  number
];

export type r_props = [
  number,
  'a' | 'absolute' | 'r' | 'relative' | 'p' | 'pivot',
  number,
  number
];

export type createTransformationMatrixProps = {
  scale?: Partial<sl_sk_t_props>;
  skew?: Partial<sl_sk_t_props>;
  rotate?: Partial<r_props>;
  translate?: Partial<sl_sk_t_props>;
};

*/

export type createTransformationMatrixProps = {
  scale?: ScaleMethodProps;
  skew?: SkewMethodProps;
  rotate?: RotateMethodProps;
  translate?: TranslateMethodProps;
};
export type row = [number, number, number];
export type tMatrixData = [row, row, row];
