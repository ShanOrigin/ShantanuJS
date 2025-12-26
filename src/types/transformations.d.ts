// Core transform metadata shared by all except flip
interface BaseTransformMeta {
  tType?: string;
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

/*++++++++++++++++++++++*/

export type ParsedDaTa = { tName: string; data: {} };

export type createTransformationMatrixProps = {
  transformations: {
    rotate?: RotateProps;
    skew?: SkewProps;
    scale?: ScaleProps;
    translate?: TranslateProps;
  };
  major?: 'row' | 'column';
  arrayType?: 'normal' | 'float32';
  baseTMatrix?: Float32Array;
  multiplyWithBase?: boolean;
};
