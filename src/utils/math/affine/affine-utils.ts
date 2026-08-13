import { BaseTransformations } from "../../../models/types/geometry/transform";

export const DEFAULT_TRANSFORMATIONS: BaseTransformations = {
  translate: { x: 0, y: 0 }, // No translation
  scale: { sx: 1, sy: 1 }, // Identity scale
  rotate: { angle: 0 }, // No rotation
  skew: { sx: 0, sy: 0 }, // No skew
};
