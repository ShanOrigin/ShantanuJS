import type { Translation, Scale, Skew, Rotation } from '../geometry/transform';

/**
 * Transform properties that can be animated.
 */
export type AnimatableTransform = {
  translate?: Partial<Translation>;

  scale?: Partial<Scale>;

  rotate?: Partial<Rotation>;

  skew?: Partial<Skew>;
};

export type AnimatableStyle = {
  // common
  fill?: string | number[];
  stroke?: string | number[];
  'stroke-width'?: number;
  opacity?: number;

  // specific
  'clip-path'?: number;
  'font-size'?: number;
  'font-weight'?: number;
};
