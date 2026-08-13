import {
  InvalidOptionError,
  TypeMismatchError,
} from "../../../errors/index.js";

import {
  SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES,
  COMMON_STYLE_ANIMATABLE_PROPERTIES,
  COMMON_GEOMETRY_ANIMATABLE_PROPERTIES,
} from "../animation-constants.js";

/**
 * Validates user-provided animation properties against
 * shape-specific, style, and geometry animatable definitions.
 *
 * Purpose:
 * - Performs strict runtime validation of animation properties.
 * - Ensures only supported keys are accepted for a given shape.
 * - Validates value types since JavaScript provides no static guarantees.
 *
 * Notes:
 * - This function only validates input; it does not transform data.
 * - All validation rules are derived from predefined default maps.
 *
 * @param props - User-defined animation properties
 * @param shape - Shape identifier (e.g., 'vgpircle', 'rect', 'line')
 */

export type ShapeType = keyof typeof SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES;

export function userPropsValidation(props: unknown, shape: ShapeType): void {
  // Ensure props is a plain object
  if (props === null || typeof props !== "object" || Array.isArray(props)) {
    throw new TypeMismatchError(
      "attrs",
      typeof props,
      "object",
      "Animation.animate()",
    );
  }

  const shapeAttrs = SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES[shape];

  if (!Array.isArray(shapeAttrs)) {
    throw new InvalidOptionError(
      "shape",
      shape,
      Object.keys(SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES),
      "Animation.animate()",
    );
  }

  const styleKeys = Object.keys(COMMON_STYLE_ANIMATABLE_PROPERTIES);
  const geometryKeys = Object.keys(COMMON_GEOMETRY_ANIMATABLE_PROPERTIES);

  const entries = Object.entries(props);

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];

    const isShapeAttr = shapeAttrs.includes(key);
    const isStyleProp = styleKeys.includes(key);
    const isGeometryProp = geometryKeys.includes(key);

    // Property must exist in at least one allowed category
    if (!isShapeAttr && !isStyleProp && !isGeometryProp) {
      throw new InvalidOptionError(
        key,
        key,
        [...shapeAttrs, ...styleKeys, ...geometryKeys],
        "Animation.animate()",
      );
    }

    // Shape-specific attributes must be numeric
    if (isShapeAttr) {
      if (typeof value !== "number") {
        throw new TypeMismatchError(
          key,
          typeof value,
          "number",
          "Animation.animate()",
        );
      }
      continue;
    }

    // Style property validation
    if (isStyleProp) {
      if (key === "fill" || key === "stroke") {
        if (typeof value !== "string") {
          throw new TypeMismatchError(
            key,
            typeof value,
            "string",
            "Animation.animate()",
          );
        }
      } else {
        if (typeof value !== "number") {
          throw new TypeMismatchError(
            key,
            typeof value,
            "number",
            "Animation.animate()",
          );
        }
      }
      continue;
    }

    // Geometry transform validation
    if (isGeometryProp) {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeMismatchError(
          key,
          typeof value,
          "object",
          "Animation.animate()",
        );
      }

      // Translate validation
      if (key === "translate") {
        if (!("x" in value) || typeof value.x !== "number") {
          throw new TypeMismatchError(
            "translate.x",
            typeof value.x,
            "number",
            "Animation.animate()",
          );
        }
        if (!("y" in value) || typeof value.y !== "number") {
          throw new TypeMismatchError(
            "translate.y",
            typeof value.y,
            "number",
            "Animation.animate()",
          );
        }
      }

      // Scale validation
      if (key === "scale") {
        if (!("sx" in value) || typeof value.sx !== "number") {
          throw new TypeMismatchError(
            "scale.sx",
            typeof value.sx,
            "number",
            "Animation.animate()",
          );
        }
        if (!("sy" in value) || typeof value.sy !== "number") {
          throw new TypeMismatchError(
            "scale.sy",
            typeof value.sy,
            "number",
            "Animation.animate()",
          );
        }
      }

      // Skew validation
      if (key === "skew") {
        if (!("sx" in value) || typeof value.sx !== "number") {
          throw new TypeMismatchError(
            "skew.sx",
            typeof value.sx,
            "number",
            "Animation.animate()",
          );
        }
        if (!("sy" in value) || typeof value.sy !== "number") {
          throw new TypeMismatchError(
            "skew.sy",
            typeof value.sy,
            "number",
            "Animation.animate()",
          );
        }
      }

      // Rotate validation
      if (key === "rotate") {
        if (!("angle" in value) || typeof value.angle !== "number") {
          throw new TypeMismatchError(
            "rotate.angle",
            typeof value.angle,
            "number",
            "Animation.animate()",
          );
        }
      }
    }
  }
}
