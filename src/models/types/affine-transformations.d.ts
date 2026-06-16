export type TransformTypes =
  | 'r'
  | 'relative'
  | 'a'
  | 'absolute'
  | 'p'
  | 'pivot';
export type CenterType = 'c' | 'center';

// Core transform metadata shared by all except flip
export interface BaseTransformMeta {
  tType?: TransformTypes | Uppercase<TransformTypes>;
  px?: number;
  py?: number;
}

// Translate
export interface TranslateMethodProps extends BaseTransformMeta {
  tType?:
    | TransformTypes
    | Uppercase<TransformTypes>
    | CenterType
    | Uppercase<CenterType>;
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

export type ParsedDaTa = { tName: string; data: {} };

export type CreateTransformationMatrixProps = {
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

export type BboxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  matrix: number[][];
};
