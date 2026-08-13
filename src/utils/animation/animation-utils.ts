import {
  SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES,
  COMMON_STYLE_ANIMATABLE_PROPERTIES,
  COMMON_GEOMETRY_ANIMATABLE_PROPERTIES,
  PROPERTY_TRANSFORMATION_MAP,
} from "./animation-constants.js";

/**
 * Separates input properties of a shape into `style` and `geometry` categories.
 *
 * Purpose:
 * - Organizes properties to clearly distinguish visual styling from geometric attributes.
 * - Handles common properties, mapped properties, and shape-specific animatable properties.
 * - Includes special handling for certain shapes (e.g., `"rect"`) to ensure corner radius properties (`rx`, `ry`) remain in style.
 *
 * Dependency:
 * - Depends on global objects or mappings like `CommonStyleAnimatableProperties`, `commonGeometryAnimatableProperties`, `map`, and `ShapeSpecificAnimatableProperties`.
 * - Does not rely on any graphics API or DOM API. Works purely with JavaScript objects.
 *
 * @param shape - The name of the shape (e.g., `"rect"`, `"circle"`, etc.) whose properties are being processed.
 * @param input - An object containing all properties assigned to the shape.
 *
 * @returns An object with two keys:
 * - `styleProps` → contains properties affecting appearance (color, opacity, stroke, etc.).
 * - `geometryProps` → contains properties affecting geometry (size, position, transformations, etc.).
 */

export function separateProperties(shape: string, input: Record<string, any>) {
  //   const { shape, ...rest } = input;

  const styleProps: Record<string, any> = {};
  const geometryProps: Record<string, any> = {};
  //    const shapeSpecificProps: Record<string, any> = {};

  const validShapeProps =
    shape &&
    (SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES[
      shape as keyof typeof SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES
    ] as readonly string[]);

  for (const key in input) {
    if (!input.hasOwnProperty(key)) continue;

    const isStyleProp = key in COMMON_STYLE_ANIMATABLE_PROPERTIES;
    const isCommonGeometryProp = key in COMMON_GEOMETRY_ANIMATABLE_PROPERTIES;
    const isMappedGeometryProp = key in PROPERTY_TRANSFORMATION_MAP;
    const isShapeSpecificProp = validShapeProps?.includes(key);

    isStyleProp && (styleProps[key] = input[key]);
    // Geometry props only if:
    // 1. It's in commonGeometryAnimatableProperties or map
    // 2. OR it's a shapeSpecificProp AND it also belongs to commonGeometryAnimatableProperties/map
    (isCommonGeometryProp ||
      (isMappedGeometryProp &&
        isShapeSpecificProp &&
        (key in COMMON_GEOMETRY_ANIMATABLE_PROPERTIES ||
          key in PROPERTY_TRANSFORMATION_MAP))) &&
      (geometryProps[key] = input[key]);
  }

  // Important For Rect Class dont delete it accidentaly
  const isShapeRect = shape == "rect";
  isShapeRect &&
    "rx" in geometryProps &&
    ((styleProps["rx"] = geometryProps["rx"]), delete geometryProps["rx"]);
  isShapeRect &&
    "ry" in geometryProps &&
    ((styleProps["ry"] = geometryProps["ry"]), delete geometryProps["ry"]);

  return {
    styleProps,
    geometryProps,
  };
}

/**
 * Recursively merges properties from a source object into a target object.
 *
 * Purpose:
 * - Copies all enumerable properties from the source object into the target object.
 * - Merges nested objects recursively to preserve existing structure.
 * - Only overwrites properties in the target if the source provides a defined value.
 *
 * Dependency:
 * - This function does not depend on any graphics API, DOM API, or external library.
 * - Works purely with plain JavaScript objects.
 *
 * @template T - The type of the target object.
 * @template S - The type of the source object (can be partial of T).
 * @param target - The object to receive merged properties.
 * @param source - The object whose properties will be merged into the target.
 */

export function deepMerge<T extends object, S extends Partial<T>>(
  target: T,
  source: S,
): void {
  if (!target || !source) return;

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const typedKey = key as keyof S;
    const sourceValue = source[typedKey];
    const targetValue = target[typedKey as keyof T];

    if (
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      deepMerge(targetValue as any, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (target[typedKey as keyof T] as any) = sourceValue;
    }
  }
}
