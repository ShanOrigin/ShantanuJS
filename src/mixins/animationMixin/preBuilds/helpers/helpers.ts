import { DEV_INTERNAL_ACCESS } from '../../../../utils/providers/accesskeys.js';

import type { IGraphicalElementProperties as IG } from '../../../../properties/provider/shapeProperties';

import type { GraphicalElementComposer as GEC } from '../../../../core/graphics/graphics/graphicalElementComposer';

import type {
  IcommonGeometryAnimatableProperties,
  modes,
  anchors,
  opt,
  TransformGeometryWithPivot,
  EasingType,
  CurveType,
  EasingFunction
} from '../../../../types/animation';

//+++++++++++++++++++++++++++++++++++++++++++++++
// --------------- DATA SECTION -----------------
//+++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Defines common style properties that can be animated for all shapes.
 *
 * Purpose:
 * - Provides default values for visual properties such as color, stroke, opacity, clipping, and font attributes.
 * - Ensures consistent and animatable style attributes across different shapes.
 * - Used when separating style properties from geometry properties for animations or rendering updates.
 *
 * Dependency:
 * - Plain JavaScript object; does not rely on any graphics API, DOM API, or external library.
 *
 * @example
 * CommonStyleAnimatableProperties.fill → ''
 * CommonStyleAnimatableProperties.stroke → ''
 * CommonStyleAnimatableProperties['stroke-width'] → 0
 * CommonStyleAnimatableProperties.opacity → 0
 */

export const CommonStyleAnimatableProperties = {
  fill: '',
  stroke: '',
  'stroke-width': 0,
  opacity: 0,
  'clip-path': 0,
  'font-size': 0,
  'font-weight': 0
};

/**
 * Defines common geometric properties that can be animated for all shapes.
 *
 * Purpose:
 * - Provides default values for common transformations such as translation, scaling, rotation, and skewing.
 * - Ensures a consistent baseline for animating geometric changes across different shapes.
 * - Helps simplify animation logic by providing a unified structure for common properties.
 *
 * Dependency:
 * - Plain JavaScript object; does not rely on any graphics API, DOM API, or external library.
 *
 * @example
 * commonGeometryAnimatableProperties.translate → { x: 0, y: 0 }
 * commonGeometryAnimatableProperties.scale → { sx: 1, sy: 1 }
 * commonGeometryAnimatableProperties.rotate → { angle: 0 }
 * commonGeometryAnimatableProperties.skew → { sx: 0, sy: 0 }
 */

export const commonGeometryAnimatableProperties: IcommonGeometryAnimatableProperties =
  {
    translate: { x: 0, y: 0 },
    scale: { sx: 1, sy: 1 },
    rotate: { angle: 0 },
    skew: { sx: 0, sy: 0 }
  };

/**
 * Defines shape-specific properties that can be animated.
 *
 * Purpose:
 * - Lists the animatable properties for each supported shape type.
 * - Helps determine which properties can be safely modified or animated without affecting read-only or non-animatable attributes.
 * - Ensures animations and transformations apply only to meaningful, shape-specific attributes.
 *
 * Dependency:
 * - Plain JavaScript object; does not depend on any graphics API, DOM API, or external library.
 *
 * @example
 * ShapeSpecificAnimatableProperties.circle → ['cx', 'cy', 'r']
 * ShapeSpecificAnimatableProperties.rect → ['x', 'y', 'width', 'height', 'rx', 'ry']
 */

export const ShapeSpecificAnimatableProperties = {
  dot: ['cx', 'cy', 'r'],
  circle: ['cx', 'cy', 'r'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  polyline: ['points'],
  polygon: ['points'],
  path: ['d'],
  text: ['x', 'y'],
  image: ['x', 'y', 'width', 'height']
};

/**
 * Arrays mapping shape properties to their corresponding matrix transformation functions.
 *
 * Purpose:
 * - `tx` → Properties affecting horizontal translation, mapped to translation matrix operations.
 * - `ty` → Properties affecting vertical translation, mapped to translation matrix operations.
 * - `sx` → Properties affecting horizontal scaling, mapped to scaling matrix operations.
 * - `sy` → Properties affecting vertical scaling, mapped to scaling matrix operations.
 * - These arrays are used to determine which matrix function should be applied to a given property during transformations or animations.
 *
 * Dependency:
 * - Plain JavaScript arrays; does not rely on any graphics API, DOM API, or external library.
 */
export const tx = ['translateX', 'cx', 'x', 'x1'];
export const ty = ['translateY', 'cy', 'y', 'y1'];

export const sx = ['scaleX', 'r', 'rx', 'width'];
export const sy = ['scaleY', 'r', 'ry', 'height'];

/**
 * Maps shape property names to their corresponding geometric transformation categories.
 *
 * Purpose:
 * - Categorizes common and shape-specific properties for transformations.
 * - Translation properties (`x`, `y`, `cx`, `cy`, etc.) are mapped to `'Translate'`.
 * - Scaling properties (`width`, `height`, `rx`, `ry`, `r`, etc.) are mapped to `'Scale'`.
 * - Properties not associated with a transformation are set to `null`.
 * - Helps streamline property handling for animations or geometric computations.
 *
 * Dependency:
 * - This is a plain JavaScript object and does not depend on any graphics API, DOM API, or external library.
 */

export const map = {
  // Translate map
  // translate: 'Translate',
  cx: 'Translate',
  cy: 'Translate',
  x: 'Translate',
  y: 'Translate',
  x1: 'Translate',
  y1: 'Translate',

  // Scale map
  // scale: 'Scale',
  r: 'Scale',
  rx: 'Scale',
  ry: 'Scale',
  width: 'Scale',
  height: 'Scale',
  x2: 'Scale', // line
  y2: 'Scale', // line

  // Rotate map
  // rotate: 'Rotate',

  // Shear map
  // skewr: 'Skwe',

  not: null
};

//+++++++++++++++++++++++++++++++++++++++++++++++
// ------------- FUNCTION SECTION ---------------
//+++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Performs linear interpolation between two numbers.
 *
 * Purpose:
 * - Calculates a value that is a fraction `t` of the way between `start` and `end`.
 * - Useful for animations, smooth transitions, or gradual value changes over time.
 *
 * Dependency:
 * - This function does not depend on any graphics API, DOM API, or external tool.
 * - It works purely with basic JavaScript numbers.
 *
 * @param start - The starting value.
 * @param end - The ending value.
 * @param t - A number between 0 and 1 representing the interpolation factor.
 *
 * @returns A number representing the interpolated value.
 */
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function getAdaptiveSmoothness(
  el: GEC<keyof IG, keyof IG>,
  curveDistance: number,
  minSamples: number = 4,
  maxSamples: number = 100
): number {
  const canvas = el.getIFig(DEV_INTERNAL_ACCESS).ownerSVGElement;

  const rawCanvasWidth = canvas?.getAttribute('width');
  const rawCanvasHeight = canvas?.getAttribute('height');
  let width: number = 0,
    height: number = 0;

  if (rawCanvasWidth && rawCanvasHeight) {
    width = parseFloat(rawCanvasWidth);
    height = parseFloat(rawCanvasHeight);
  }

  const canvasDiagonal = Math.hypot(width, height) || curveDistance * 1.5;
  const relativeSize = curveDistance / canvasDiagonal;

  // Map relative size (0–1) to sample count (e.g. 4 to 100)
  const samples = Math.round(
    minSamples + (maxSamples - minSamples) * relativeSize
  );

  return Math.max(minSamples, Math.min(samples, maxSamples));
}

/**
 * Calculates an adaptive smoothness (number of samples) for a curve segment
 * based on the distance between two points, the curve's bend, and curve type.
 *
 * The function dynamically adjusts the number of interpolation points:
 * - Longer curves or higher bends → more samples for smoothness.
 * - Curve type affects the mapping of bend and distance to sample count.
 * - Smoothness is clamped between user-provided min and max.
 *
 * Parameters:
 * @param P1 - Starting point of the curve { x: number, y: number }.
 * @param P2 - Ending point of the curve { x: number, y: number }.
 * @param bend - Curve bend factor in range [-1, 1]. Positive for upward/clockwise, negative for downward/counter-clockwise.
 * @param curveType - Type of the curve: 'linear', 'quadratic', 'cubic', or 'arc'.
 * @param minSamples - Minimum number of samples to use (default: 4).
 * @param maxSamples - Maximum number of samples to use (default: 100).
 *
 * Returns:
 * - number: Calculated smoothness (sample count) clamped between minSamples and maxSamples.
 *
 * Dependencies:
 * - Pure calculation, does not depend on DOM, canvas, or graphics APIs.
 */
export function getCurveAdaptiveSmoothness(
  P1: { x: number; y: number },
  P2: { x: number; y: number },
  bend: number,
  curveType: CurveType,
  minSamples: number = 4,
  maxSamples: number = 100
): number {
  // 1. Compute straight-line distance between points
  const dx = P2.x - P1.x;
  const dy = P2.y - P1.y;
  const distance = Math.hypot(dx, dy);

  // 2. Map bend [-1, 1] to a positive factor (0.5 to 1.5) to adjust smoothness
  const bendFactor = 1 + Math.abs(bend); // 0–1 becomes 1–2
  let adjustedMin = minSamples;
  let adjustedMax = maxSamples;

  // 3. Curve type adjustment
  switch (curveType) {
    case 'linear':
      adjustedMax = Math.min(maxSamples, 20); // linear requires fewer points
      break;
    case 'quadratic':
      adjustedMin = Math.max(minSamples, 6);
      adjustedMax = Math.min(maxSamples, 60);
      break;
    case 'cubic':
      adjustedMin = Math.max(minSamples, 10);
      adjustedMax = Math.min(maxSamples, 100);
      break;
    case 'arc':
    case 'earc':
      adjustedMin = Math.max(minSamples, 8);
      adjustedMax = Math.min(maxSamples, 80);
      break;
    default:
      // fallback
      break;
  }

  // 4. Map distance to sample count within adjusted range
  // Assume a reference distance of 200 units for scaling
  const refDistance = 200;
  let samples = Math.round(
    adjustedMin +
      (adjustedMax - adjustedMin) * (distance / refDistance) * bendFactor
  );

  // Clamp between min and max
  return Math.max(adjustedMin, Math.min(samples, adjustedMax));
}

/**
 * Returns an easing function based on a specified type.
 *
 * Purpose:
 * - Provides commonly used easing functions for animations, such as linear, quadratic, cubic, and bounce effects.
 * - Each returned function takes a parameter `t` (typically between 0 and 1) and outputs a transformed value,
 *   controlling the pacing of animations or transitions.
 *
 * Dependency:
 * - This function does not require any graphics API or DOM API.
 * - It works purely with JavaScript numbers and functions.
 *
 * @param type - A string specifying the type of easing. Examples:
 *               `"linear"`, `"easeInQuad"`, `"easeOutQuad"`, `"easeInOutQuad"`,
 *               `"easeInCubic"`, `"easeOutCubic"`, `"easeInOutCubic"`,
 *               `"easeOutBounce"`, `"easeInBounce"`, `"easeInOutBounce"`.
 * @returns A function `(t: number) => number` that maps a progress value `t` to its eased value.
 */

export function easing(type: EasingType): EasingFunction {
  switch (type) {
    case 'linear':
      return (t) => t;

    // Quadratic
    case 'easeInQuad':
      return (t) => t * t;
    case 'easeOutQuad':
      return (t) => t * (2 - t);
    case 'easeInOutQuad':
      return (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Cubic
    case 'easeInCubic':
      return (t) => t * t * t;
    case 'easeOutCubic':
      return (t) => --t * t * t + 1; // (t-1)^3 + 1
    case 'easeInOutCubic':
      return (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // Bounce family
    case 'easeOutBounce':
      return (t) => {
        const n1 = 7.5625,
          d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        else return n1 * (t -= 2.625 / d1) * t + 0.984375;
      };
    case 'easeInBounce':
      return (t) => 1 - easing('easeOutBounce')(1 - t);
    case 'easeInOutBounce':
      return (t) =>
        t < 0.5
          ? (1 - easing('easeOutBounce')(1 - 2 * t)) / 2
          : (1 + easing('easeOutBounce')(2 * t - 1)) / 2;

    default:
      return (t) => t; // fallback linear
  }
}

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
    ShapeSpecificAnimatableProperties[
      shape as keyof typeof ShapeSpecificAnimatableProperties
    ];

  for (const key in input) {
    if (!input.hasOwnProperty(key)) continue;

    const isStyleProp = key in CommonStyleAnimatableProperties;
    const isCommonGeometryProp = key in commonGeometryAnimatableProperties;
    const isMappedGeometryProp = key in map;
    const isShapeSpecificProp = validShapeProps?.includes(key);

    isStyleProp && (styleProps[key] = input[key]);
    // Geometry props only if:
    // 1. It's in commonGeometryAnimatableProperties or map
    // 2. OR it's a shapeSpecificProp AND it also belongs to commonGeometryAnimatableProperties/map
    (isCommonGeometryProp ||
      (isMappedGeometryProp &&
        isShapeSpecificProp &&
        (key in commonGeometryAnimatableProperties || key in map))) &&
      (geometryProps[key] = input[key]);
  }

  // Important For Rect Class dont delete it accidentaly
  const isShapeRect = shape == 'rect';
  isShapeRect &&
    'rx' in geometryProps &&
    ((styleProps['rx'] = geometryProps.rx), delete geometryProps.rx);
  isShapeRect &&
    'ry' in geometryProps &&
    ((styleProps['ry'] = geometryProps.ry), delete geometryProps.ry);

  return {
    styleProps,
    geometryProps
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
  source: S
): void {
  if (!target || !source) return;

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

    const typedKey = key as keyof S;
    const sourceValue = source[typedKey];
    const targetValue = target[typedKey as keyof T];

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      deepMerge(targetValue as any, sourceValue as any);
    } else if (sourceValue !== undefined) {
      (target[typedKey as keyof T] as any) = sourceValue;
    }
  }
}

export function ivotSetter(
  mode: modes | anchors | undefined,
  OBB: Float32Array
): [number, number] {
  const [x1, y1, , x2, y2, , x3, y3, , x4, y4] = OBB;

  switch (mode) {
    case 'r':
    case 'relative':
    case 'TL':
      return [x1, y1];

    case 'c':
    case 'center':
    case 'C':
      return [(x1 + x2 + x3 + x4) / 4, (y1 + y2 + y3 + y4) / 4];

    case 'TM':
      return [(x1 + x2) / 2, (y1 + y2) / 2];

    case 'TR':
      return [x2, y2];

    case 'RM':
      return [(x2 + x3) / 2, (y2 + y3) / 2];

    case 'BR':
      return [x3, y3];

    case 'BM':
      return [(x3 + x4) / 2, (y3 + y4) / 2];

    case 'BL':
      return [x4, y4];

    case 'LM':
      return [(x1 + x4) / 2, (y1 + y4) / 2];

    default:
      return [x1, y1];
  }
}

/**
 * Determines the pivot point coordinates for a shape based on a specified mode or anchor.
 *
 * Purpose:
 * - Calculates the (x, y) position of the pivot for transformations, rotations, or scaling.
 * - Supports various pivot modes such as corners (TL, TR, BR, BL), edges (TM, RM, BM, LM), and center.
 * - Defaults to the top-left corner (`TL`) if no mode is provided.
 *
 * Dependency:
 * - Depends on a Float32Array representing the oriented bounding box (OBB) of the shape.
 * - Does not rely on any graphics API or DOM API; purely a mathematical calculation.
 *
 * @param mode - A string or enum representing the desired pivot mode or anchor.
 *               Examples: `'TL'`, `'TR'`, `'BR'`, `'BL'`, `'C'`, `'center'`, `'TM'`, `'RM'`, `'BM'`, `'LM'`.
 * @param OBB - A `Float32Array` representing the four corners of the shape's bounding box in order.
 *
 * @returns A tuple `[x, y]` representing the coordinates of the chosen pivot point.
 */
export function pivotSetter(
  mode: modes | anchors | undefined,
  OBB: number[][] // Float32Array
): [number, number] {
  const [x1, y1] = OBB[0];
  const [x2, y2] = OBB[1];
  const [x3, y3] = OBB[2];
  const [x4, y4] = OBB[3];

  // Precompute sums used multiple times
  const sumX = [x1 + x2, x2 + x3, x3 + x4, x1 + x4];
  const sumY = [y1 + y2, y2 + y3, y3 + y4, y1 + y4];
  const centerX = (x1 + x2 + x3 + x4) / 4;
  const centerY = (y1 + y2 + y3 + y4) / 4;

  const lookup: Record<string, [number, number]> = {
    r: [x1, y1],
    relative: [x1, y1],
    TL: [x1, y1],
    c: [centerX, centerY],
    center: [centerX, centerY],
    C: [centerX, centerY],
    TM: [sumX[0] / 2, sumY[0] / 2],
    TR: [x2, y2],
    RM: [sumX[1] / 2, sumY[1] / 2],
    BR: [x3, y3],
    BM: [sumX[2] / 2, sumY[2] / 2],
    BL: [x4, y4],
    LM: [sumX[3] / 2, sumY[3] / 2]
  };

  return lookup[mode ?? 'TL'] ?? [x1, y1];
}

/**
 * Determines the optimal transformation computation strategy based on pivot settings.
 *
 * Purpose:
 * - Checks if rotation (or other transformations like scale/skew if enabled) uses an arbitrary pivot point.
 * - Returns `'preComputeFrames'` if an arbitrary pivot exists, requiring precomputation of frames.
 * - Returns `'fitPolynomialCofficient'` if all pivots are standard, allowing polynomial fitting optimization.
 *
 * Dependency:
 * - Depends on the input parameter object `TransformGeometryWithPivot` containing rotation, pivot, and optionally scale/skew values.
 * - Does not rely on any graphics API, DOM API, or external library.
 *
 * @param params - An object containing transformation parameters:
 *                 - `Rotate`: rotation angle in degrees or radians.
 *                 - `rotatePivot`: `[x, y]` coordinates of the rotation pivot point.
 *                 - Optional commented-out parameters: scale, skew, and their pivots.
 *
 * @returns A string indicating the recommended optimization method:
 *          - `'preComputeFrames'` → use precomputed frames due to arbitrary pivot.
 *          - `'fitPolynomialCofficient'` → safe to apply polynomial fitting for performance.
 */

export function choosePivotAwareOptimization(
  params: TransformGeometryWithPivot
): opt {
  const {
    Rotate = 0,
    rotatePivot = [0, 0]
    //Scale = [1, 1],                                                                          94     // scalePivot = [0, 0],
    // Skew = [0, 0],
    // skewPivot = [0, 0]
    //   Translate = [0, 0]
  } = params;

  // --- Check if rotation pivot is arbitrary ---
  const rotationArbitrary =
    Rotate !== 0 && (rotatePivot[0] !== 0 || rotatePivot[1] !== 0);
  /*
  // --- Check if scale pivot is arbitrary ---
  const scaleArbitrary =                                                                     
    (Scale[0] !== 1 || Scale[1] !== 1) &&                                                    
    (scalePivot[0] !== 0 || scalePivot[1] !== 0);

  // --- Check if skew pivot is arbitrary ---                                                
  const skewArbitrary =
    (Skew[0] !== 0 || Skew[1] !== 0) &&
    (skewPivot[0] !== 0 || skewPivot[1] !== 0);                                             
*/
  if (rotationArbitrary) {
    // --- If rotation with arbitrary pivot exists → must use precompute ---
    return 'preComputeFrames';
  }

  // Optional: if skew with arbitrary pivot breaks polynomial fit, uncomment
  // if (skewArbitrary) return 'precompute';

  // Otherwise, polynomial fit is safe
  return 'fitPolynomialCofficient';
}
