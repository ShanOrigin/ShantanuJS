import {
  TranslateMethodProps,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps
} from '../types/affine-transformations';

export interface ITransformation {
  translate(translateProps: TranslateMethodProps): Float32Array | void;

  rotate(rotateProps: RotateMethodProps): Float32Array | void;

  scale(scaleProps: ScaleMethodProps): Float32Array | void;

  skew(skewProps: SkewMethodProps): Float32Array | void;

  transform(dsl: string): Float32Array | void;

  beginT(): void;
  endT(): Float32Array | void;
}
