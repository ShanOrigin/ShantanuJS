import { OptimizationTechnique } from "../../models/types/animation/control";
import { AdvancedAnimationOptions } from "../../models/types/animation/options";

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
 * COMMON_STYLE_ANIMATABLE_PROPERTIES.fill → ''
 * COMMON_STYLE_ANIMATABLE_PROPERTIES.stroke → ''
 * COMMON_STYLE_ANIMATABLE_PROPERTIES['stroke-width'] → 0
 * COMMON_STYLE_ANIMATABLE_PROPERTIES.opacity → 0
 */
export const COMMON_STYLE_ANIMATABLE_PROPERTIES = {
  // common
  fill: "",
  stroke: "",
  "stroke-width": 0,
  opacity: 0,

  // specific
  "clip-path": 0,
  "font-size": 0,
  "font-weight": 0,
} as const;

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
 * COMMON_GEOMETRY_ANIMATABLE_PROPERTIES.translate → { x: 0, y: 0 }
 * COMMON_GEOMETRY_ANIMATABLE_PROPERTIES.scale → { sx: 1, sy: 1 }
 * COMMON_GEOMETRY_ANIMATABLE_PROPERTIES.rotate → { angle: 0 }
 * COMMON_GEOMETRY_ANIMATABLE_PROPERTIES.skew → { sx: 0, sy: 0 }
 */
export const COMMON_GEOMETRY_ANIMATABLE_PROPERTIES = {
  translate: { x: 0, y: 0 },
  scale: { sx: 1, sy: 1 },
  rotate: { angle: 0 },
  skew: { sx: 0, sy: 0 },
} as const;

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
 * SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES.circle → ['cx', 'cy', 'r']
 * SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES.rect → ['x', 'y', 'width', 'height', 'rx', 'ry']
 */
export const SHAPE_SPECIFIC_ANIMATABLE_PROPERTIES = {
  dot: ["cx", "cy", "r"],
  circle: ["cx", "cy", "r"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  line: ["x1", "y1"],
  ellipse: ["cx", "cy", "rx", "ry"],
  polyline: ["points"],
  polygon: ["points"],
  path: ["d"],
  text: ["x", "y"],
  image: ["x", "y", "width", "height"],
} as const;

/**
 * Arrays mapping shape properties to their corresponding matrix transformation functions.
 *
 * Purpose:
 * - `TX_PROPERTIES` → Properties affecting horizontal translation, mapped to translation matrix operations.
 * - `TY_PROPERTIES` → Properties affecting vertical translation, mapped to translation matrix operations.
 * - `SX_PROPERTIES` → Properties affecting horizontal scaling, mapped to scaling matrix operations.
 * - `SY_PROPERTIES` → Properties affecting vertical scaling, mapped to scaling matrix operations.
 * - These arrays are used to determine which matrix function should be applied to a given property during transformations or animations.
 *
 * Dependency:
 * - Plain JavaScript arrays; does not rely on any graphics API, DOM API, or external library.
 */
export const TX_PROPERTIES = ["translateX", "cx", "x", "x1"] as const;

export const TY_PROPERTIES = ["translateY", "cy", "y", "y1"] as const;

export const SX_PROPERTIES = ["scaleX", "r", "rx", "width"] as const;

export const SY_PROPERTIES = ["scaleY", "r", "ry", "height"] as const;

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
export const PROPERTY_TRANSFORMATION_MAP = {
  // Translate map
  cx: "Translate",
  cy: "Translate",
  x: "Translate",
  y: "Translate",
  x1: "Translate",
  y1: "Translate",

  // Scale map
  r: "Scale",
  rx: "Scale",
  ry: "Scale",
  width: "Scale",
  height: "Scale",
  x2: "Scale",
  y2: "Scale",

  not: null,
} as const;

/**
 * List of supported animation direction modes.
 *
 * Direction modes define how an animation sequence progresses over time,
 * including forward playback, reversed playback, or alternating behavior.
 */
export const DIRECTIONS_MAP = ["normal", "reverse", "alternate"] as const;

/**
 * List of supported optional feature flags.
 *
 * These options enable or modify advanced behaviors such as precomputation
 * or polynomial fitting strategies. They are intended for fine-tuning
 * performance or numerical behavior rather than core functionality.
 */
export const OPT_MAP = [
  "fitPolynomialCoefficient",
  "preComputeFrames",
] as const;

/**
 * Stores all advanced animation configuration used internally by the engine.
 *
 * -------------------------------------------------------------------------
 * ROLE IN THE ANIMATION SYSTEM
 * -------------------------------------------------------------------------
 * This object represents the complete set of advanced animation controls,
 * combining both:
 *
 * - user-provided advanced options (via `animate`)
 * - engine-defined default values
 *
 * It acts as the single source of truth for all non-basic animation behavior
 * such as physics motion, curve following, pivot handling, looping, direction,
 * and optimization strategies.
 *
 * This object is mutated internally during animation setup and execution.
 *
 * -------------------------------------------------------------------------
 * IMPORTANT VERSIONING NOTE
 * -------------------------------------------------------------------------
 * ⚠️ THIS STRUCTURE IS NOT FIXED.
 *
 * New properties MAY be added, existing properties MAY evolve,
 * and internal behavior MAY change across library versions.
 *
 * This object is PRIVATE and NOT part of the public API contract.
 * Users should never rely on its internal structure directly.
 *
 * -------------------------------------------------------------------------
 * DESIGN PRINCIPLES
 * -------------------------------------------------------------------------
 * - All defaults are safe and deterministic
 * - Missing user options are resolved automatically
 * - Advanced features are opt-in, not mandatory
 * - Engine invariants are always preserved
 */

export const DEFAULT_ADVANCE_OPTIONS: AdvancedAnimationOptions = {
  /**
   * -------------------------------------------------------
   * PHYSICS CONFIGURATION
   * -------------------------------------------------------
   * Controls how animation progress is computed:
   * - time-based (default)
   * - distance-based (physics motion)
   */
  physics: {
    /**
     * Enables distance-based motion instead of time-based motion.
     *
     * When enabled, animation progress is derived from:
     *   distance = speed × time
     *
     * This is primarily used for curve-based translation
     * with arc-length reparameterization.
     */
    enabled: false,

    /**
     * Controls animation speed when physicsMotion is enabled.
     *
     * Interpreted as:
     *   speed = distance / time
     *
     * Higher values result in faster traversal along the path.
     */
    speed: 0.5,
  },

  /**
   * -------------------------------------------------------
   * CURVE / PATH CONFIGURATION
   * -------------------------------------------------------
   * Controls whether translation follows a curve
   * and how that curve is generated.
   */
  curve: {
    /**
     * Enables motion along a computed curve path.
     *
     * If false, translation is linear.
     * If true, translation follows the selected curve type.
     */
    enabled: false,

    /**
     * Specifies the curve type used for path-based motion.
     *
     * Examples:
     * - 'linear'
     * - 'cubic'
     * - 'quadratic'
     * - 'arc'
     * - 'earc'
     */
    path: "linear",

    /**
     * Controls curve bending (curvature).
     *
     * - Positive values bend the curve above the baseline
     * - Negative values bend the curve below the baseline
     * - Zero results in a straight line
     */
    curvature: 0,

    /**
     * Controls smoothness of curve formation.
     *
     * Affects how stepness is distributed and
     * how smooth the resulting motion feels.
     */
    samples: 0,
  },

  /**
   * -------------------------------------------------------
   * PIVOT CONFIGURATION
   * -------------------------------------------------------
   * Controls how transformations are applied relative
   * to reference points on the shape.
   */
  pivots: {
    /**
     * Controls the transformation mode.
     *
     * Possible meanings:
     * - 'relative' : relative to top-left corner
     * - 'center'   : geometric center (translate only)
     * - 'pivot'    : explicit pivot-based transformation
     *
     * The engine may override this value when required
     * to preserve correct animation behavior.
     */
    mode: "relative",

    /**
     * Pivot used for rotation transformations.
     *
     * Defaults to geometric center ('C').
     */
    rotatePivot: "C",

    /**
     * Pivot used for scale transformations.
     *
     * Defaults to geometric center ('C').
     */
    scalePivot: "C",

    /**
     * Pivot used for skew transformations.
     *
     * Defaults to geometric center ('C').
     */
    skewPivot: "C",
  },

  /**
   * -------------------------------------------------------
   * CONTROL & EXECUTION CONFIGURATION
   * -------------------------------------------------------
   * Controls animation lifecycle behavior
   * and execution strategy.
   */
  controls: {
    /**
     * Enables continuous looping of the animation.
     */
    loop: false,

    /**
     * Controls animation playback direction.
     *
     * Examples:
     * - 'normal'
     * - 'reverse'
     * - 'alternate'
     */
    direction: "normal",

    /**
     * Specifies which optimization technique
     * the engine should use for interpolation.
     *
     * The engine may override this choice
     * if a better strategy is detected.
     */
    optimizationTechnique: "fitPolynomialCoefficient",
  },
};
