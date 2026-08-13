import { IGraphicalElementProperties } from "../../../property-definitions/specific/specific-properties";
import type { Translation, Scale, Skew, Rotation } from "../geometry/transform";
import { ValidGraphicsShapes } from "../graphics-model";

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
  "stroke-width"?: number;
  opacity?: number;

  // specific
  "clip-path"?: number;
  "font-size"?: number;
  "font-weight"?: number;
};

/**
 * Geometrical animatable properties.
 *
 * Represents numeric geometry attributes that can be animated and are used
 * to identify the corresponding transformation behavior during animations.
 */
export type GeometricalAnimatableProperties = {
  cx: number;
  cy: number;
  x: number;
  y: number;
  x1: number;
  y1: number;
  r: number;
  rx: number;
  ry: number;
  width: number;
  height: number;
  x2: number;
  y2: number;
};

// Defines all animatable properties accepted by the animation engine.
// Includes geometry-related properties and supported style properties.
// All properties are optional and resolved internally by the engine.
export type AnimatableProperties<
  Shapes extends ValidGraphicsShapes = ValidGraphicsShapes,
> = Partial<
  AnimatableTransform | AnimatableStyle | IGraphicalElementProperties<Shapes>
>;
