/**
 * ============================================================================
 * ⚠️ CORE ANIMATION ENGINE — INTERNAL ARCHITECTURE NOTICE
 * ============================================================================
 *
 * This class implements the core animation engine responsible for
 * driving geometry and style interpolation for graphics shapes.
 *
 * --------------------------------------------------------------------------
 * CONTEXT & SCOPE
 * --------------------------------------------------------------------------
 * At present, this animation engine operates on an SVG-based rendering
 * backend. As such, certain implementation details (e.g. transform
 * composition, DOM interaction, curve visualization) are aligned with
 * SVG semantics.
 *
 * HOWEVER:
 * This class is designed as a rendering-agnostic animation controller.
 *
 * In future versions of the library:
 * - The rendering backend MAY change (e.g. Canvas, WebGL, WebGPU).
 * - Portions of this class MAY be refactored, extended, or replaced.
 * - Backend-specific logic MAY be delegated or abstracted further.
 *
 * --------------------------------------------------------------------------
 * STABILITY GUARANTEES
 * --------------------------------------------------------------------------
 * - Public lifecycle methods (start, pause, resume, cancel, etc.)
 *   are intended to remain stable across versions.
 *
 * - Internal methods, state variables, and optimization strategies
 *   are NOT part of the public API contract and MAY change without notice.
 *
 * --------------------------------------------------------------------------
 * DESIGN INTENT
 * --------------------------------------------------------------------------
 * This class prioritizes:
 * - correctness over convenience
 * - deterministic behavior over implicit magic
 * - engine authority over user misconfiguration
 *
 * Users express animation intent; the engine enforces valid execution.
 *
 * --------------------------------------------------------------------------
 * IMPORTANT NOTE FOR CONTRIBUTORS
 * --------------------------------------------------------------------------
 * This is a foundational subsystem.
 *
 * Any modification to this class should be approached with care, as
 * changes here directly affect:
 * - animation timing
 * - transformation correctness
 * - pivot resolution
 * - performance characteristics
 *
 * Always reason about:
 * - time domain
 * - space domain
 * - transformation order
 * - rendering backend assumptions
 *
 * before introducing changes.
 *
 * ============================================================================
 */

// ----- Types Imports -----

import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_INTERNAL_STYLE_METHOD
} from '../../internal/keys/dev-keys.js';

import type { GraphicsRenderNode } from '../../models/interfaces/render-node';
import type {
  AnimatableStyle,
  GeometricalAnimatableProperties
} from '../../models/types/animation/animatable';
import type {
  AnimationControls,
  OptimizationTechnique
} from '../../models/types/animation/control';
import type { EasingFunction } from '../../models/types/animation/easing';
import type {
  CurveMotionOptions,
  PhysicsOptions
} from '../../models/types/animation/motion';
import type {
  AdvancedAnimationOptions,
  IAnimationOptions,
  UpdateAnimationReturnType
} from '../../models/types/animation/options';
import type { TransformStack } from '../../models/types/common';
import type {
  ArcLengthTableEntry,
  CurveType
} from '../../models/types/geometry/curve';
import type {
  BaseTransformations,
  PivotTransformations
} from '../../models/types/geometry/transform';
import type { NumericPair, Point2D } from '../../models/types/geometry/types';
import type { Pivot, PivotAnchors } from '../../models/types/geometry/anchors';

import type {
  PivotMode,
  PivotOptions
} from '../../models/types/animation/pivot';

import type {
  InternalGeometryAccessor,
  InternalStyleAccessor
} from '../../models/types/graphics-model';

import type {
  GetInternalGraphicsAccessor,
  GraphicsNode
} from '../../models/interfaces/graphics-container';

import type { IAllStyleProperties as IS } from '../../property-definitions/common/common-properties';
import type { IAnimation } from '../../models/interfaces/animation';

import {
  COMMON_STYLE_ANIMATABLE_PROPERTIES,
  DEFAULT_ADVANCE_OPTIONS,
  PROPERTY_TRANSFORMATION_MAP,
  SX_PROPERTIES,
  SY_PROPERTIES,
  TX_PROPERTIES,
  TY_PROPERTIES
} from '../../utils/animation/animation-constants.js';
import { separateProperties } from '../../utils/animation/animation-utils.js';
import { handleEasing } from '../../utils/animation/validators/easing-validation.js';
import { ShapeType } from '../../utils/animation/validators/user-props-validation.js';
import {
  getTForDistance,
  interpolateAlongCurve
} from '../../utils/math/interpolation/interpolate-along-curve.js';
import { advancePropsValidation } from '../../utils/animation/validators/advance-props-validation.js';
import { onCompleteFuncValidation } from '../../utils/animation/validators/on-complete-func-validation.js';
import { userPropsValidation } from '../../utils/animation/validators/user-props-validation.js';
import { timeValidation } from '../../utils/animation/validators/time-validation.js';

import { lerp } from '../../utils/math/interpolation/lerp.js';

import { fitTransformPolynomialsFast } from '../../utils/math/polynomial/fit-polynomial-fast.js';

import {
  choosePivotAwareOptimization,
  resolvePivots
} from '../../utils/geometry/pivot-resolution/pivot-utils.js';
import { precomputeFramesRaw } from '../../utils/animation/frame-sampling/pre-computation/pre-compute-frames.js';
import { setPreComputedFrame } from '../../utils/math/interpolation/interpolate-pre-compute-frames.js';
import { transformUsingPolynomialFast } from '../../utils/math/interpolation/interpolate-fit-polynomial-fast.js';

import Colors from '../../utils/colors/colors.js';
import { generateCurvePoints } from '../../utils/geometry/curves/curve-generator/generate-curve-points.js';
import { DEFAULT_TRANSFORMATIONS } from '../../utils/math/affine/affine-utils.js';

type GraphicsRenderNodeWithInternals = GraphicsNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  GetInternalGraphicsAccessor;

// Represents the optimized data produced by polynomial fitting,
// combined with a Float32Array for fast numerical access.
// Used internally by the interpolation system.
type optFuncType = Float32Array &
  ReturnType<typeof fitTransformPolynomialsFast>;

// Function signature for frame-based precomputation optimization.
// Takes initial geometry, curve points, progress and flags,
// and returns a serialized transform matrix.
type precomputeFramesRawType = (
  a: Float32Array, // initial geometry data
  b: Point2D[], // curve sampling points
  c: number, // normalized progress (0–1)
  d: boolean, // translation availability flag
  e?: number // optional extra parameter (engine-specific)
) => Float32Array;

// Function signature for polynomial-based interpolation.
// Uses precomputed polynomial data instead of raw frames
// to generate the final transform matrix.
type transformUsingPolynomialFastType = (
  a: ReturnType<typeof fitTransformPolynomialsFast>, // polynomial coefficients
  b: Point2D[], // curve sampling points
  c: number, // normalized progress (0–1)
  d: boolean, // translation availability flag
  e?: number // optional extra parameter
) => Float32Array;

// Alias representing all supported graphics shape tags.
// Used to constrain the Animation class to valid shape types.
// temporary svg source for animation trajectory path visualization
const GraphicsSource = 'http://www.w3.org/2000/svg';

/**
 * Core animation engine responsible for driving time-based and
 * physics-based animations on a single graphics shape.
 *
 * ============================================================================
 * WHAT THIS CLASS IS
 * ============================================================================
 * This class represents a complete, self-contained animation pipeline.
 *
 * It is NOT a simple “move or rotate” helper.
 * It is an engine-level abstraction that:
 *
 * - understands geometry, style, time, space, and direction
 * - resolves user intent into deterministic animation behavior
 * - enforces invariants required for correct affine transformations
 *
 * Each instance of this class owns exactly one animation lifecycle
 * for exactly one graphics shape.
 *
 * ============================================================================
 * RESPONSIBILITIES
 * ============================================================================
 * The Animation class is responsible for:
 *
 * 1. Capturing initial geometry and style state
 * 2. Accepting user animation intent (attributes + advanced options)
 * 3. Normalizing and validating animation input
 * 4. Resolving pivots and transformation modes
 * 5. Supporting both time-based and distance-based (physics) motion
 * 6. Handling curve-based translation and arc-length parameterization
 * 7. Selecting and applying optimization strategies
 * 8. Interpolating geometry and style per animation frame
 * 9. Managing animation lifecycle (start, pause, resume, cancel)
 * 10. Enforcing correct final state and cleanup
 *
 * ============================================================================
 * DESIGN PHILOSOPHY
 * ============================================================================
 * This class is designed around the principle:
 *
 *   “Users express intent. The engine enforces correctness.”
 *
 * The API deliberately allows partial, null, or minimal configuration.
 * When users do not specify details, the engine:
 * - chooses safe defaults
 * - resolves ambiguity
 * - prevents invalid states
 *
 * This makes the system powerful without being fragile.
 *
 * ============================================================================
 * POWER VS CONTROL
 * ============================================================================
 * This engine does not give users raw control over internals.
 * Instead, it gives them expressive power while retaining authority.
 *
 * Users can:
 * - specify pivots, curves, physics, direction, optimization hints
 * - omit any of the above and rely on the engine
 *
 * Users cannot:
 * - break affine transformation rules
 * - bypass pivot resolution
 * - create inconsistent animation state
 * - corrupt interpolation logic
 *
 * ============================================================================
 * MOTION MODELS
 * ============================================================================
 * The engine supports two distinct animation models:
 *
 * 1. Time-based motion
 *    - Progress driven by elapsed time
 *    - Easing functions applied
 *    - Suitable for UI and scripted animations
 *
 * 2. Distance-based (physics) motion
 *    - Progress driven by distance traveled
 *    - Uses arc-length parameterization
 *    - Suitable for physically meaningful motion
 *
 * The engine automatically selects and executes
 * the correct model based on configuration.
 *
 * ============================================================================
 * PIVOT-AWARE TRANSFORMATION
 * ============================================================================
 * This animation system supports fully dynamic pivot resolution.
 *
 * - Each transform (translate, rotate, scale, skew) may have its own pivot
 * - Pivots may be numeric or semantic (anchors)
 * - Translation dominates pivot resolution when present
 * - The engine overrides invalid combinations automatically
 *
 * This allows predictable, composable, and physically correct animation.
 *
 * ============================================================================
 * PERFORMANCE & OPTIMIZATION
 * ============================================================================
 * The engine supports multiple optimization strategies, including:
 *
 * - precomputed frame interpolation
 * - polynomial coefficient fitting
 *
 * Optimization is chosen dynamically based on:
 * - transformation complexity
 * - presence of pivots
 * - motion type
 *
 * Execution paths are kept tight and deterministic.
 *
 * ============================================================================
 * LIFECYCLE MANAGEMENT
 * ============================================================================
 * The class exposes a controlled lifecycle API:
 *
 * - start()
 * - pause()
 * - resume()
 * - cancelAnimation()
 * - isRunning()
 * - isPaused()
 *
 * Internal state is explicitly tracked and cleaned up
 * to prevent leaks and stale animation data.
 *
 * ============================================================================
 * INTERNAL VS PUBLIC API
 * ============================================================================
 * This class contains both:
 *
 * - public, user-facing lifecycle methods
 * - private, engine-internal execution logic
 *
 * Internal methods and fields are NOT part of the public contract
 * and may change across versions.
 *
 * ============================================================================
 * VERSIONING NOTE
 * ============================================================================
 * This class is expected to evolve.
 *
 * New animation capabilities, optimization techniques,
 * and advanced properties may be added in future versions.
 *
 * Users should rely only on the documented public API,
 * not internal structure.
 *
 * ============================================================================
 * SUMMARY
 * ============================================================================
 * This class is the backbone of the animation system.
 *
 * It unifies:
 * - time
 * - space
 * - geometry
 * - style
 * - physics
 * - optimization
 *
 * into a single, coherent, and deterministic animation engine.
 */

export class Animation implements IAnimation {
  /**
   * Reference to the graphics shape instance being animated.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the high-level graphics element controlled by
   * this animation instance.
   *
   * This object provides access to:
   * - geometry
   * - style
   * - transformation application methods
   *
   * All animation effects ultimately target this instance.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Injected during construction
   * - Remains constant for the lifetime of the animation
   */
  #el!: GraphicsRenderNodeWithInternals; // GEC<keyof IG, keyof IG>;

  /**
   * Arc-length lookup table for curve parameterization.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Stores precomputed arc-length data for the animation curve.
   *
   * This table allows the engine to:
   * - convert traveled distance into normalized curve parameter (t)
   * - ensure uniform motion along curved paths
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Generated during curve preprocessing
   * - Used during physics-based animation updates
   * - Remains constant during animation execution
   */
  #arcTable!: ArcLengthTableEntry[];

  /**
   * Discrete sampling points along the animation curve.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the sampled points of the curve used for:
   * - translation interpolation
   * - distance-based motion
   * - curve visualization
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Generated during curve preprocessing
   * - Used during animation execution
   * - Cleared during animation cleanup
   */
  #curvePoints: Point2D[] = [];

  /**
   * Total arc length of the animation path.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the total distance of the curve when arc-length
   * parameterization is used.
   *
   * This value is required for distance-based (physics) motion,
   * allowing progress to be mapped from traveled distance
   * back to normalized curve parameter space.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Computed during curve preprocessing
   * - Used during physics-based animation updates
   * - Remains constant for the duration of the animation
   */
  #totalLength!: number;

  /**
   * Normalized animation progress in the range [0, 1].
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents how much of the animation has been completed.
   * This is the canonical progress value used by the engine
   * to drive interpolation of geometry and style.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Updated every animation frame
   * - Derived from time-based or distance-based motion
   * - Passed through easing and direction logic
   *
   * -------------------------------------------------------------------------
   * IMPORTANT NOTE
   * -------------------------------------------------------------------------
   * This value always represents *effective* progress,
   * after easing and direction adjustments.
   */
  #progress!: number;

  /**
   * Flag used to manage alternate (ping-pong) animation direction.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * When the animation direction is set to `alternate`,
   * this flag tracks whether the current cycle is playing
   * forward or backward.
   *
   * It allows the engine to invert progress on every
   * alternate cycle without recomputing animation data.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Initialized to false
   * - Toggled at the end of each animation cycle
   * - Used only when direction mode is `alternate`
   */
  #reverseCycle: boolean = false;

  /**
   * Timestamp representing when the animation started.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * This value is captured when the animation is started or resumed.
   * It serves as the reference point for computing elapsed time.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Set when animation starts or resumes
   * - Used to compute `#elapsedTime`
   * - Not modified during frame updates
   */
  #startTime!: number;

  /**
   * Accumulated elapsed time since the animation started.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Tracks how much time has passed since the animation began.
   * This value is especially important for pause/resume behavior.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Updated when the animation is paused
   * - Used to resume animation seamlessly
   * - Reset when animation restarts
   */
  #elapsedTime: number = 0;

  /**
   * Total duration of the animation.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the full time span the animation should take
   * from start to completion.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Set during animation initialization
   * - Used to normalize time-based progress
   * - Remains constant for the animation lifecycle
   */
  #totalTime!: number;

  /**
   * Timestamp of the previous animation frame.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Used to compute delta time (dt) between frames,
   * enabling frame-rate independent animation updates.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Updated every frame
   * - Reset when animation restarts
   */
  #lastTime: number = 0;

  /**
   * Distance traveled along the animation path.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Used only in physics-based (distance-driven) animations.
   * Tracks how far the animation has progressed along a curve.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Incremented every frame in physics mode
   * - Reset when animation restarts
   */
  #travelledDistance!: number;

  /**
   * Raw linear progress value in the range [0, 1].
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents un-eased progress based purely on time.
   * This value is passed through the easing function
   * to produce the final eased progress.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Updated every frame in time-based animations
   * - Reset when animation restarts
   */
  #rawProgress!: number;

  /**
   * Indicates whether the animation is currently active.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Acts as the primary logical flag controlling whether
   * animation updates should occur.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Set to true when animation starts or resumes
   * - Set to false when animation is paused or completed
   */
  #animationState: boolean = false;

  /**
   * Callback used to register or unregister this animation
   * with the parent animation system.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Prevents multiple animations from running simultaneously
   * on the same shape by coordinating with the owning system.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Injected via constructor
   * - Called when animation starts or ends
   *
   * This keeps animation ownership centralized
   * and avoids conflicting animation instances.
   */
  #isAnimation: (t: boolean) => boolean | undefined | void;

  /**
   * Stores the initial geometric state of the animation target.
   *
   * -------------------------------------------------------------------------
   * ROLE IN THE ANIMATION PIPELINE
   * -------------------------------------------------------------------------
   * This object represents the baseline geometric transformation
   * of the shape at the moment the animation is initialized.
   *
   * It is used as the starting point for all geometry interpolation
   * during animation execution.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Populated during animation setup
   * - Remains immutable during animation execution
   * - Used as the reference for interpolating toward `#finalGeometry`
   *
   * -------------------------------------------------------------------------
   * IMPORTANT NOTES
   * -------------------------------------------------------------------------
   * - Values represent normalized affine transform components
   * - Defaults correspond to identity transformation
   */
  #initialGeometry!: BaseTransformations;

  /**
   * Stores the initial style state of the animation target.
   *
   * -------------------------------------------------------------------------
   * ROLE IN THE ANIMATION PIPELINE
   * -------------------------------------------------------------------------
   * This object captures the visual style of the shape
   * before animation begins.
   *
   * It serves as the interpolation baseline for all
   * animatable style properties.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Captured during animation initialization
   * - Used during every animation frame
   * - Never mutated after initialization
   *
   * -------------------------------------------------------------------------
   * STYLE REPRESENTATION
   * -------------------------------------------------------------------------
   * - Numeric styles are stored as numbers
   * - Color styles (fill, stroke) are normalized to RGBA arrays
   */
  #initialStyle: AnimatableStyle = {};

  /**
   * Stores the resolved final geometric state of the animation target,
   * including pivot information.
   *
   * -------------------------------------------------------------------------
   * ROLE IN THE ANIMATION PIPELINE
   * -------------------------------------------------------------------------
   * This object represents the target geometric transformation
   * after all user input, pivot resolution, and normalization
   * have been applied.
   *
   * It is interpolated against `#initialGeometry` during animation execution.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Constructed during animation setup
   * - Mutated during pivot resolution
   * - Read-only during animation execution
   *
   * -------------------------------------------------------------------------
   * IMPORTANT NOTES
   * -------------------------------------------------------------------------
   * - Pivot properties are attached only after resolution
   * - Scale defaults to zero and is normalized later
   * - All values are expected to be in local coordinate space
   */
  #finalGeometry!: PivotTransformations;

  /**
   * Stores the resolved final style state of the animation target.
   *
   * -------------------------------------------------------------------------
   * ROLE IN THE ANIMATION PIPELINE
   * -------------------------------------------------------------------------
   * This object represents the target visual style
   * that the animation interpolates toward.
   *
   * It is combined with `#initialStyle` during per-frame
   * style interpolation.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Populated during animation setup
   * - Normalized for interpolation
   * - Read-only during animation execution
   *
   * -------------------------------------------------------------------------
   * VALUE REPRESENTATION
   * -------------------------------------------------------------------------
   * - Numeric properties are stored as numbers
   * - Color properties are stored as RGBA arrays
   * - String values are used only where required (e.g., transform)
   */
  #finalStyle: AnimatableStyle = {};

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
  #advanceOptions!: AdvancedAnimationOptions;
  /**
   * Easing function used to map linear progress into eased progress.
   *
   * This function is resolved from user input during animation setup.
   * Defaults to an identity function (linear easing).
   *
   * It is invoked on every animation frame to transform raw progress.
   */
  #easingFunction: EasingFunction = (t: number) => t;

  /**
   * Callback invoked when the animation completes fully.
   *
   * This function is called exactly once after the animation
   * reaches 100% progress and all final state has been applied.
   *
   * It may be composed internally with multiple callbacks.
   */
  #onComplete!: Function;

  /**
   * Cleanup callback invoked after animation completion or cancellation.
   *
   * This function is responsible for:
   * - releasing resources
   * - unregistering animation instances
   * - performing engine-level cleanup tasks
   *
   * It is injected from outside to keep the animation engine decoupled
   * from the scheduling and rendering systems.
   */
  #cleanUp!: Function;

  /**
   * Indicates whether the current animation includes translation.
   *
   * This flag is resolved during animation setup and is used to:
   * - optimize interpolation paths
   * - determine whether curve-based motion is required
   * - simplify execution logic in hot paths
   */
  #isTranslation!: boolean;

  /**
   * Interpolation function selected by the optimization strategy.
   *
   * This function is used during animation execution to compute
   * interpolated geometry for the current progress value.
   *
   * The specific implementation depends on whether:
   * - frame precomputation, or
   * - polynomial fitting
   * was selected during setup.
   */
  #interpolateFunction!:
    | precomputeFramesRawType
    | transformUsingPolynomialFastType;

  /**
   * Precomputed interpolation data produced during animation setup.
   *
   * Depending on the chosen optimization technique, this may contain:
   * - a buffer of precomputed transformation frames, or
   * - polynomial coefficients used for fast interpolation
   *
   * This data is consumed by the selected interpolation function
   * during animation execution.
   */
  #preComputeFranesOrPolynomial!:
    | Float32Array
    | ReturnType<typeof fitTransformPolynomialsFast>;

  /**
   * Constructs a new Animation instance bound to a specific graphics element.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This constructor initializes all animation-related bindings
   * between the animation engine and the target graphics element.
   *
   * It captures:
   * - element references required for animation
   * - initial style state for interpolation
   * - lifecycle hooks used by the animation system
   *
   * This constructor does NOT start the animation.
   * It only prepares the animation instance for future execution.
   *
   * -------------------------------------------------------------
   * WHY INITIALIZATION HAPPENS HERE
   * -------------------------------------------------------------
   * Animation requires a stable baseline state from which
   * interpolation can occur.
   *
   * By capturing the element's initial style at construction time:
   * - style animations become deterministic
   * - repeated animations behave consistently
   * - interpolation does not depend on external mutations
   *
   * -------------------------------------------------------------
   * DESIGN NOTES
   * -------------------------------------------------------------
   * - Internal access keys are used intentionally
   * - Only animatable style properties are captured
   * - Lifecycle hooks are injected rather than hardcoded
   *
   * This keeps the animation engine decoupled from:
   * - the rendering backend
   * - the global animation scheduler
   *
   * -------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------
   * @param shape   - Target graphics element to be animated
   * @param isAnimation - Callback used to register animation activity
   *                      with the animation system
   * @param cleanUp     - Cleanup callback invoked when animation ends
   */
  /*
  #createTransformMatrix!: (
    param: createTransformationMatrixProps
  ) => Float32Array | number[][];
  #getBBox!: (param: boolean) => bboxProps;

	*/

  constructor(
    shape: GraphicsRenderNodeWithInternals,
    isAnimation: (t: boolean) => boolean,
    cleanUp: Function
  ) {
    /**
     * Retrieve the element's internal style object.
     * This represents the current visual state before animation.
     */
    const style = shape[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);

    /**
     * Store the animation registration callback.
     * This allows the animation engine to signal active/inactive state.
     */
    this.#isAnimation = isAnimation;

    /**
     * Store a reference to the target graphics element.
     */
    this.#el = shape;

    /**
     * Capture initial style values for all animatable style properties.
     *
     * Only properties that:
     * - exist in the style object
     * - are recognized as style properties
     * - are declared animatable
     *
     * are copied into the initial style state.
     *
     * This snapshot is later used as the interpolation baseline.
     */

    for (const key in style) {
      key in COMMON_STYLE_ANIMATABLE_PROPERTIES &&
        ((this.#initialStyle as Record<string, unknown>)[key as keyof IS] = (
          style as IS
        )[key as keyof IS]);
    }

    /**
     * Store the cleanup callback.
     * This will be invoked when the animation lifecycle fully completes.
     */
    this.#cleanUp = cleanUp as Function;

    /*
    this.#createTransformMatrix = createTransformMatrix;
    this.#getBBox = getBBox;
		*/
  }

  /**
   * Visualizes the computed animation curve by rendering it as an SVG polyline.
   *
   * -------------------------------------------------------------
   * STATUS
   * -------------------------------------------------------------
   * EXPERIMENTAL / BETA FEATURE
   *
   * This method is NOT part of the stable animation pipeline
   * and is not included in v1 of the library.
   *
   * It currently exists for:
   * - debugging
   * - development-time visualization
   * - internal verification of curve generation logic
   *
   * The implementation is SVG-specific and may be replaced,
   * extended, or removed entirely in future versions depending
   * on rendering context and engine evolution.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * Given a list of precomputed curve points, this function:
   *
   * - Converts those points into SVG polyline coordinates
   * - Applies normalization offsets to align with local space
   * - Renders the resulting curve directly into the SVG DOM
   *
   * This allows developers to visually inspect the exact path
   * that an animation will follow.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * Curve-based animations are difficult to reason about
   * purely numerically.
   *
   * This function provides a direct visual representation
   * of the animation trajectory, making it easier to:
   *
   * - debug curve generation
   * - verify pivot and normalization logic
   * - validate arc-length and interpolation correctness
   *
   * -------------------------------------------------------------
   * IMPORTANT NOTES
   * -------------------------------------------------------------
   * - This function mutates the SVG DOM directly
   * - It assumes an SVG rendering context
   * - It should not be used in production builds
   * - It is intentionally decoupled from the animation lifecycle
   *
   * -------------------------------------------------------------
   * INPUT PARAMETERS
   * -------------------------------------------------------------
   * @param curvePoints     - Array of curve points generated by the engine
   * @param normalizePoints - Offset used to convert local curve space
   *                          into SVG coordinate space
   */

  // temporary svg source for animation trajectory path visualization
  // this method or logic will be deleted or moved to renderer after animation component will work properly.
  #curveFormation(
    curvePoints: { x: number; y: number }[],
    normalizePoints: Pivot
  ) {
    /**
     * Capture the internal figure representation of the element.
     * This is used for low-level transformation application.
     */
    const elFig = this.#el[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    );
    /**
     * Guard clause to ensure valid curve data.
     * If curvePoints is not an array, there is nothing to render.
     */
    if (!Array.isArray(curvePoints)) return;

    /**
     * Create an SVG polyline element to represent the curve path.
     */
    const curve = document.createElementNS(GraphicsSource, 'polyline');

    /**
     * String buffer for collecting polyline point coordinates.
     * SVG polyline points are expressed as "x,y x,y x,y".
     */
    let path = '';

    /**
     * Iterate over each curve point and transform it
     * from local curve space into SVG coordinate space.
     */
    for (let i = 0; i < curvePoints.length; i++) {
      const p = curvePoints[i] as Point2D;

      /**
       * Apply normalization offset to align curve points
       * with the element's local origin.
       */
      let x = normalizePoints.px! + p.x;
      let y = normalizePoints.py! + p.y;

      /**
       * Append transformed point to polyline path string.
       */
      path += `${x},${y} `;
    }

    /**
     * Assign the computed point list to the polyline.
     */
    curve.setAttribute('points', path);

    /**
     * Styling attributes for debug visualization.
     * These values are intentionally simple and explicit.
     */
    curve.setAttribute('stroke-width', '1');
    curve.setAttribute('stroke', 'black');
    curve.setAttribute('fill', 'none');

    /**
     * Append the curve visualization to the same SVG root
     * as the animated element.
     */
    elFig.ownerSVGElement?.appendChild(curve);
  }

  /**
   * Interpolates geometry and style properties for the current animation frame
   * and applies them to the target element.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This method is the central execution unit for per-frame animation updates.
   * It is responsible for:
   *
   * - Computing the interpolated transformation matrix
   * - Interpolating all animatable style properties
   * - Applying the combined result to the element in a single update
   *
   * This function is invoked internally on every animation frame
   * while the animation is active.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * The animation system separates:
   * - preparation (normalization, pivot resolution, optimization)
   * - execution (per-frame interpolation and application)
   *
   * This function performs only execution.
   * All expensive decisions have already been made earlier
   * in the animation pipeline.
   *
   * -------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------
   * - Geometry interpolation is delegated to the selected strategy
   * - Style interpolation is linear and deterministic
   * - Color values are interpolated numerically (RGBA)
   * - Only user-declared animatable properties are processed
   * - Final application is done in a single attribute update
   *
   * @returns Object of type Record<string, number | string | Float32Array>with geometry , style and animationMatrix as Float32Array combined
   */
  #interpolater() {
    // -----------------------------------------------------------
    // STEP 1: Interpolate geometry (transform matrix)
    // -----------------------------------------------------------

    /**
     * Object holding final interpolated properties
     * to be applied to the element in this frame.
     */
    const fP: Record<string, number | string | Float32Array> = {};

    /**
     * Compute the interpolated transformation matrix
     * using the selected interpolation strategy.
     */
    const tMatrix = this.#interpolateFunction(
      this.#preComputeFranesOrPolynomial as optFuncType,
      this.#curvePoints,
      this.#progress,
      this.#isTranslation
    );

    /**
     * Store the transform matrix as a style-compatible value.
     */
    fP['animationMatrix'] = tMatrix;

    // -----------------------------------------------------------
    // STEP 2: Prepare style state for interpolation
    // -----------------------------------------------------------

    /**
     * Initial and final style states.
     * These have already been normalized earlier in the pipeline.
     */
    const iS = this.#initialStyle as Record<string, unknown>;
    const fS = this.#finalStyle as Record<string, unknown>;

    // -----------------------------------------------------------
    // STEP 3: Interpolate style properties
    // -----------------------------------------------------------

    for (const k in fS) {
      /**
       * Numeric style properties (excluding colors).
       */
      if (
        k in COMMON_STYLE_ANIMATABLE_PROPERTIES &&
        k !== 'fill' &&
        k !== 'stroke'
      ) {
        const iv = (iS[k] as number | undefined) ?? 0;
        const fv = fS[k] as number;

        fP[k] = lerp(iv, fv, this.#progress);

        /**
         * Color properties (fill / stroke).
         * These are interpolated component-wise in RGBA space.
         */
      } else if (k === 'fill' || k === 'stroke') {
        const i = (iS[k] as number[] | undefined) ?? [0, 0, 0, 0];
        const f = fS[k] as number[];

        fP[k] = `rgba(
  ${Math.round(lerp(i[0]!, f[0]!, this.#progress))},
  ${Math.round(lerp(i[1]!, f[1]!, this.#progress))},
  ${Math.round(lerp(i[2]!, f[2]!, this.#progress))},
  ${lerp(i[3]!, f[3]!, this.#progress)}
)`;
      }
    }

    // -----------------------------------------------------------
    // STEP 4: Return interpolated properties to update function
    // -----------------------------------------------------------

    /**
     * Return all interpolated geometry and style properties
     * in a single object update.
     */
    return fP;
  }

  /**
   * Indicates whether the animation is currently running.
   *
   * An animation is considered running if:
   * - a requestAnimationFrame callback is active, and
   * - the internal animation state is marked as active
   *
   * @returns `true` if the animation is running, otherwise `false`
   */
  public isRunning(): boolean {
    // Animation is running if there’s an active frame and state is true
    return this.#animationState;
  }

  /**
   * Indicates whether the animation is currently paused.
   *
   * An animation is considered paused if:
   * - there is no active requestAnimationFrame callback, and
   * - the internal animation state is inactive
   *
   * @returns `true` if the animation is paused, otherwise `false`
   */
  public isPaused(): boolean {
    // Animation is paused if no frame is active and state is false
    return !this.#animationState;
  }

  /**
   * Cancels the animation entirely and resets all internal state.
   *
   * This method:
   * 1. Pauses the animation if it is currently running
   * 2. Clears all animation-related internal state
   *
   * After calling this method, the animation instance is returned
   * to a clean state and cannot be resumed.
   *
   * This is intended for cases where the animation should be
   * forcefully terminated rather than paused.
   *
   * @returns void
   */
  public cancelAnimation(): void {
    /**
     * Pause the animation first so the current visual
     * state is reflected correctly before cleanup.
     */
    this.pause();

    /**
     * Reset all internal animation state.
     * This performs a full teardown of the animation instance.
     */
    this.#resetAllStates();
  }

  /**
   * Resets all internal animation-related state to `null`.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function performs a full teardown of the animation instance
   * by explicitly nullifying every internal field associated with:
   *
   * - animation timing
   * - geometry and style state
   * - interpolation data
   * - curve and optimization data
   * - lifecycle and completion handling
   *
   * It is intended to be used internally after an animation
   * has fully completed or has been explicitly cleaned up.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * The animation engine maintains a large amount of transient state
   * during animation execution. Retaining this state after completion
   * would:
   *
   * - waste memory
   * - risk stale references
   * - cause incorrect behavior on subsequent animations
   * - complicate garbage collection
   *
   * This method provides a single, centralized reset point to ensure
   * the animation instance returns to a clean, reusable state.
   *
   * -------------------------------------------------------------
   * DESIGN DECISIONS
   * -------------------------------------------------------------
   * - All fields are explicitly set to `null`
   * - No conditional logic is used
   * - The reset list is exhaustive and declarative
   *
   * This makes the reset behavior:
   * - predictable
   * - easy to audit
   * - resistant to partial cleanup bugs
   *
   * -------------------------------------------------------------
   * IMPORTANT NOTES
   * -------------------------------------------------------------
   * - This function assumes the animation is no longer active
   * - It should NOT be called while an animation is running
   * - After this call, the instance must be reinitialized
   *   before reuse
   *
   * -------------------------------------------------------------
   * TYPE SYSTEM CONSIDERATION
   * -------------------------------------------------------------
   * Bracket access and `any` casting are used intentionally here
   * to allow dynamic resetting of private fields.
   *
   * This is a controlled internal operation and not exposed
   * to user-facing APIs.
   */
  #resetAllStates() {
    this.#totalLength = 0;
    this.#progress = 0;
    this.#rawProgress = 0;
    this.#startTime = 0;
    this.#elapsedTime = 0;
    this.#lastTime = 0;
    this.#totalTime = 0;

    this.#travelledDistance = 0;
    this.#reverseCycle = false;
    this.#animationState = false;
    this.#isTranslation = false;
    this.#initialGeometry = structuredClone(DEFAULT_TRANSFORMATIONS);
    this.#finalGeometry = structuredClone(
      DEFAULT_TRANSFORMATIONS
    ) as PivotTransformations;
    this.#initialStyle = {};
    this.#finalStyle = {};

    this.#advanceOptions = structuredClone(DEFAULT_ADVANCE_OPTIONS);
  }

  /**
   * Pauses the animation at its current progress.
   *
   * This method stops the animation loop while preserving
   * the current animation state so it can be resumed later.
   *
   * If the animation is already paused, this method does nothing.
   *
   * This method is intended to be used as part of the animation
   * lifecycle control (start → pause → resume).
   *
   * @returns void
   */
  public pause(): void {
    /**
     * If the animation is not currently running,
     * there is nothing to pause.
     */
    if (!this.#animationState) return; // Already paused

    /**
     * Store the elapsed time so the animation can
     * resume from the correct position later.
     */
    this.#elapsedTime = performance.now() - this.#startTime;

    /**
     * Mark animation as inactive to stop further updates.
     */
    this.#animationState = false;

    /**
     * Apply the current transformation state immediately.
     *
     * This ensures the visual state reflects the exact
     * animation progress at the moment of pause, and that
     * resuming later continues from the same position. and
     * resume() method undo the reflected changes when resume
     * invoked after pause().
     */
    //  this.#applyFinalTransformationMatrix(this.#progress);
  }

  /**
   * Starts the animation.
   *
   * This method initializes the animation timing state and marks
   * the animation as active so it can begin updating on subsequent
   * animation frames.
   *
   * If the animation is already running or already registered
   * as active in the animation system, this method does nothing.
   *
   * This is the primary entry point for users to trigger animation
   * playback.
   *
   * @returns void
   */
  public start() {
    /**
     * Prevent starting the animation if:
     * - it is already registered as active, or
     * - it is already running
     *
     * This avoids duplicate starts and inconsistent state.
     */
    if (this.#isAnimation(false) || this.#animationState) {
      return;
    }

    /**
     * Register this animation instance as active
     * within the animation system.
     */
    this.#isAnimation(true);

    /**
     * Initialize timing state.
     * The start time is captured from the current high-resolution clock,
     * and elapsed time is reset to zero.
     */
    this.#startTime = performance.now();
    this.#elapsedTime = 0;

    /**
     * Mark animation as running so update cycles can proceed.
     */
    this.#animationState = true;
  }

  /**
   * Resumes a previously paused animation.
   *
   * If the animation is already running, this method does nothing.
   * Otherwise, it adjusts internal timing state so the animation
   * continues smoothly from where it was paused.
   *
   * This method is intended to be called by the user as part of
   * animation lifecycle control (pause → resume).
   *
   * @returns void
   */
  public resume() {
    /**
     * If the animation is already active, there is nothing to resume.
     * This prevents restarting or corrupting the animation state.
     */
    if (this.#animationState) return;

    /**
     * Recalculate the animation start time so that
     * elapsed time continues from the paused position.
     *
     * This ensures time-based animations resume seamlessly
     * without jumping or restarting.
     */
    this.#startTime = performance.now() - this.#elapsedTime;

    /**
     * Mark animation as active so it can continue
     * updating on subsequent animation frames.
     */
    this.#animationState = true;

    // +++++++++++++++++++++++++++
    // need to delete transformation stacks last transform which is added by pause() method of animation

    /*
    const geo = this.#el.getIGeo(DEV_INTERNAL_ACCESS);
    if (!geo) {
      throw new Error('geometry is undefined');
    }
    const tStack = geo.transformStack as transformStack;
    tStack.stack.pop();
		*/
  }

  /**
   * Advances and resolves the animation state for the current render frame.
   *
   * =====================================================================
   * ROLE IN THE ANIMATION ENGINE
   * =====================================================================
   * This function is the *core temporal driver* of the animation system.
   * It is responsible for progressing animations over time and orchestrating
   * the execution of all previously prepared animation data.
   *
   * This method is NOT a user-facing API.
   * It is invoked internally by the rendering / scheduling system
   * (e.g., requestAnimationFrame) under controlled conditions.
   *
   * Users never call this directly.
   *
   * =====================================================================
   * HIGH-LEVEL RESPONSIBILITIES
   * =====================================================================
   * 1. Manage animation timing and frame-to-frame progression
   * 2. Support both time-based and distance-based (physics) animation
   * 3. Apply easing functions to normalized progress
   * 4. Handle animation direction modes (normal, reverse, alternate)
   * 5. Execute interpolation logic for the current frame
   * 6. Detect animation cycle completion
   * 7. Handle looping, alternation, and finalization
   * 8. Ensure correct final state application on completion
   * 9. Maintain numerical stability across frame drops and tab switches
   *
   * =====================================================================
   * MOTION MODELS SUPPORTED
   * =====================================================================
   * The engine supports two fundamentally different animation models:
   *
   * --------------------------------------------------
   * 1. TIME-BASED MOTION
   * --------------------------------------------------
   * - Progress is derived from elapsed time
   * - Suitable for standard UI and scripted animations
   * - Progress is normalized to [0, 1]
   * - Easing functions are applied to shape motion
   *
   * --------------------------------------------------
   * 2. DISTANCE-BASED (PHYSICS) MOTION
   * --------------------------------------------------
   * - Progress is derived from distance traveled along a curve
   * - Used for physically meaningful motion
   * - Independent of frame rate
   * - Uses arc-length parameterization for accuracy
   *
   * The engine dynamically chooses the correct model
   * based on animation configuration.
   *
   * =====================================================================
   * FRAME-RATE INDEPENDENCE & STABILITY
   * =====================================================================
   * This function relies on delta-time (dt) computation
   * rather than absolute timestamps to ensure:
   *
   * - Consistent motion across different frame rates
   * - Smooth animation under variable system load
   * - Protection against large jumps caused by:
   *   - browser tab switching
   *   - garbage collection pauses
   *   - background throttling
   *
   * Delta time is explicitly clamped to prevent instability.
   *
   * =====================================================================
   * DIRECTION & CYCLE MANAGEMENT
   * =====================================================================
   * Supported direction modes include:
   *
   * - Normal      : forward playback
   * - Reverse     : inverted transformation deltas
   * - Alternate   : forward + backward cycles
   *
   * In alternate mode:
   * - Progress is flipped every other cycle
   * - Internal state tracks cycle direction
   * - Final state application is handled carefully
   *
   * =====================================================================
   * INTERPOLATION EXECUTION
   * =====================================================================
   * Once progress is computed:
   * - Geometry interpolation is applied
   * - Style interpolation (if any) is applied
   * - All transforms respect previously resolved pivots
   * - Execution is delegated to the interpolation pipeline
   *
   * This function does NOT compute interpolation formulas itself.
   * It only coordinates execution.
   *
   * =====================================================================
   * COMPLETION & CLEANUP
   * =====================================================================
   * When an animation cycle completes:
   * - Looping rules are evaluated
   * - Completion callbacks are triggered
   * - Internal state is cleaned up
   * - Final transformation state is enforced if required
   *
   * This guarantees:
   * - Deterministic final geometry
   * - No partial transform states
   * - No lingering animation artifacts
   *
   * =====================================================================
   * DESIGN PHILOSOPHY
   * =====================================================================
   * This function intentionally combines multiple concerns:
   * - timing
   * - control flow
   * - execution coordination
   *
   * While large, this centralization is deliberate:
   * - Animation timing logic must remain cohesive
   * - Fragmentation would introduce subtle state bugs
   * - Performance-critical paths are kept inline
   *
   * Complexity here reflects engine responsibility,
   * not accidental design.
   *
   * =====================================================================
   * IMPORTANT INVARIANTS
   * =====================================================================
   * - Progress is always clamped to [0, 1]
   * - Interpolation never executes outside valid bounds
   * - Animation state transitions are explicit
   * - Final geometry state is always valid
   * - Engine authority is never delegated to user input
   *
   * =====================================================================
   * SUMMARY
   * =====================================================================
   * This function is the heartbeat of the animation engine.
   * Every animation frame passes through it.
   *
   * It does not decide *what* to animate —
   * it decides *when* and *how* animation progresses safely.
   *
   * Any change to this function must be approached
   * with extreme caution.
	 *
   * -------------------------------------------------------------
   * INPUT
   * -------------------------------------------------------------
   * @param time - High Precision timestamp from RFA for frame data calculation. 
	 *
   * @returns Object of type Record<string, number | string | Float32Array>with geometry , style and animationMatrix as Float32Array combined

   */

  public update = (currentTime: number): UpdateAnimationReturnType => {
    /**
     * Abort update if animation is not currently active.
     * This prevents unnecessary computation.
     */
    if (!this.#animationState) return null;

    /**
     * ---------------------------------------------------------
     * FIRST FRAME INITIALIZATION
     * ---------------------------------------------------------
     *
     * On the very first frame, only initialize timing state.
     * No animation progress is computed yet.
     */
    if (this.#lastTime === null) {
      this.#lastTime = currentTime;
      return null;
    }

    /**
     * Extract physics and control parameters.
     *
     * - speed controls playback rate
     * - physicsMotion enables distance-based motion
     * - direction controls playback direction behavior
     */
    const { speed = 1, enabled: physicsMotion = false } = this.#advanceOptions
      .physics as PhysicsOptions;
    const { direction } = this.#advanceOptions.controls as AnimationControls;

    /**
     * Clamp speed to a safe operational range.
     * Prevents extreme values from breaking motion stability.
     */
    const clampedSpeed = Math.min(Math.max(speed, 0.01), 5);

    /**
     * ---------------------------------------------------------
     * DELTA TIME COMPUTATION (seconds)
     * ---------------------------------------------------------
     *
     * Delta time is computed per frame to support:
     * - frame-rate independent motion
     * - physics-based animation
     */
    let dt = (currentTime - this.#lastTime) / 1000;
    this.#lastTime = currentTime;

    /**
     * Clamp delta time to avoid large jumps caused by:
     * - tab switching
     * - garbage collection pauses
     * - browser throttling
     */

    dt = Math.min(dt, 0.033); // clamp large delta spikes (~30ms max)

    /**
     * ---------------------------------------------------------
     * PROGRESS COMPUTATION
     * ---------------------------------------------------------
     *
     * Two distinct motion models are supported:
     *
     * 1. Distance-based (physicsMotion)
     * 2. Time-based (standard animation)
     *
     * The commented code below represents alternative approaches
     * that may be revisited or compared in the future.
     */

    if (this.#isTranslation && physicsMotion) {
      /**
       * -------------------------------------------------------
       * DISTANCE-BASED MOTION (PHYSICS MODE)
       * -------------------------------------------------------
       *
       * This approach advances motion based on distance traveled
       * along a precomputed curve, rather than elapsed time.
       */

      /*
    const distance = (elapsed / 1000) * clampedSpeed * this.#totalLength;
    const safeDistance = Math.min(Math.max(0, distance), this.#totalLength);
    this.#progress = getTForDistance(safeDistance, this.#arcTable);
    */

      /**
       * Current implementation uses incremental distance
       * accumulation per frame for smoother and more stable motion.
       */
      const deltaDistance = dt * clampedSpeed * this.#totalLength;

      this.#travelledDistance = (this.#travelledDistance ?? 0) + deltaDistance;

      this.#travelledDistance = Math.min(
        this.#travelledDistance,
        this.#totalLength
      );

      /**
       * Convert traveled distance into curve parameter (t).
       */
      this.#progress = getTForDistance(this.#travelledDistance, this.#arcTable);
    } else {
      /**
       * -------------------------------------------------------
       * TIME-BASED MOTION (STANDARD MODE)
       * -------------------------------------------------------
       *
       * This approach advances animation progress
       * based purely on elapsed time.
       */

      /*
    const time = Math.min((elapsed * clampedSpeed) / this.#totalTime, 1);
    this.#progress = this.#easingFunction(time);
    */

      /**
       * Current implementation uses incremental progress
       * accumulation for frame-rate independence.
       */
      const deltaProgress = dt / (this.#totalTime / 1000);

      this.#rawProgress = (this.#rawProgress ?? 0) + deltaProgress;
      this.#rawProgress = Math.min(this.#rawProgress, 1);

      /**
       * Apply easing function to raw progress.
       */
      this.#progress = this.#easingFunction(this.#rawProgress);
    }

    /**
     * ---------------------------------------------------------
     * DIRECTION HANDLING
     * ---------------------------------------------------------
     *
     * In alternate mode, progress is flipped every other cycle
     * to create forward-backward animation behavior.
     */
    let reverseProgress = 0;
    direction === 'alternate' &&
      this.#reverseCycle &&
      ((reverseProgress = this.#progress),
      (this.#progress = 1 - this.#progress));

    /**
     * ---------------------------------------------------------
     * APPLY INTERPOLATION
     * ---------------------------------------------------------
     *
     * Only interpolate when progress is within valid bounds.
     */
    let frameData: Record<string, string | number | Float32Array> | null = null;
    if (this.#progress >= 0 && this.#progress <= 1) {
      frameData = this.#interpolater();
    }

    /**
     * ---------------------------------------------------------
     * CYCLE COMPLETION CHECK
     * ---------------------------------------------------------
     *
     * Determines whether the current animation cycle
     * has completed and handles looping, alternation,
     * or final cleanup.
     */
    if (this.#progress >= 1 || reverseProgress >= 1) {
      if (
        this.#advanceOptions?.controls?.loop ||
        (direction === 'alternate' && !this.#reverseCycle)
      ) {
        /**
         * Restart animation cycle.
         */
        this.#startTime = currentTime;
        this.#elapsedTime = 0;
        this.#progress = 0;
      } else {
        /**
         * Finalize animation.
         */
        this.#animationState = false;
        this.#isAnimation(true);
        this.#onComplete();

        this.#cleanUp();

        /**
         * Ensure final transformation state is applied
         * when animation ends normally.
         */
        direction !== 'alternate' && this.#applyFinalTransformationMatrix(1);
      }

      /**
       * Toggle reverse cycle flag for alternate mode.
       */
      direction === 'alternate' && (this.#reverseCycle = !this.#reverseCycle);
    }

    return frameData;
  };

  /**
   * Applies the final, interpolated transformation matrix to the shape
   * for the given animation progress.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function is the *final execution stage* of the animation pipeline.
   *
   * It:
   * - Interpolates between initial and final transform states
   * - Applies pivot-aware affine transformations
   * - Composes all active transforms into a single matrix batch
   * - Writes the result directly to the shape
   *
   * This method is called repeatedly during animation playback,
   * typically once per animation frame.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * Animation systems must separate:
   * - preparation (normalization, pivot resolution, optimization)
   * - execution (applying interpolated transforms per frame)
   *
   * This function performs only execution.
   * All expensive or complex decisions have already been resolved.
   *
   * -------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------
   * - All transforms are applied in local space
   * - Pivots are always respected for rotate, scale, and skew
   * - Translation follows the precomputed curve path if enabled
   * - Only active transforms are applied
   * - Transform batching is used whenever possible
   *
   * -------------------------------------------------------------
   * INPUT
   * -------------------------------------------------------------
   * @param progress - Normalized animation progress in range [0, 1]
   */
  #applyFinalTransformationMatrix(progress: number) {
    /**
     * -----------------------------------------------------------
     * STEP 1: Extract initial transformation values
     * -----------------------------------------------------------
     *
     * These represent the starting state of the shape
     * before animation begins.
     *
     * Default values are explicitly provided to guarantee
     * type safety and predictable interpolation behavior.
     */
    const {
      scale: IS, // Default: identity scale
      skew: ISK, // Default: no skew
      rotate: IR // Default: no rotation
    } = this.#initialGeometry as BaseTransformations;

    /**
     * -----------------------------------------------------------
     * STEP 2: Extract final transformation values and pivots
     * -----------------------------------------------------------
     *
     * These represent the resolved target state after all
     * user input, pivot logic, and normalization steps.
     *
     * Each transform has its own pivot to ensure
     * correct affine composition.
     */
    const {
      scale: FS,
      skew: FSK,
      rotate: FR
    } = this.#finalGeometry as PivotTransformations;

    /*
		{
      Scale: NumberType;
      Skew: NumberType;
      Rotate: number;
      Translate: NumberType;
      rotatePivot: NumberType;
      skewPivot: NumberType;
      scalePivot: NumberType;
    };
*/

    /**
     * -----------------------------------------------------------
     * STEP 3: Determine which transforms are active
     * -----------------------------------------------------------
     *
     * This allows:
     * - Skipping unnecessary work
     * - Correct batching decisions
     * - Cleaner execution flow
     */
    let isR = FR.angle !== 0; // Rotation active
    let isS = FS.sx !== 1 || FS.sy !== 1; // Scale active
    let isSK = FSK.sx !== 0 || FSK.sy !== 0; // Skew active

    /**
     * Shape instance reference.
     * Used to apply transformation commands.
     */
    const s = this.#el as GraphicsRenderNodeWithInternals & GraphicsRenderNode;

    /**
     * -----------------------------------------------------------
     * STEP 4: Determine whether transformations should be composed
     * -----------------------------------------------------------
     *
     * If at least one transform exists, we batch all
     * transformation calls into a single matrix composition.
     *
     * Boolean values are coerced into numbers for summation.
     */
    const isToCompose = +this.#isTranslation + +isR + +isS + +isSK;

    /**
     * Begin transformation batching if required.
     */
    isToCompose > 0 && s.beginT();

    /**
     * -----------------------------------------------------------
     * STEP 5: Apply translation (curve-based if enabled)
     * -----------------------------------------------------------
     *
     * Translation is treated specially:
     * - It may follow a precomputed curve
     * - It is applied in relative or center mode
     * - It benefits from prior pivot resolution
     */
    if (this.#isTranslation) {
      /**
       * Interpolate position along the precomputed curve
       * based on current animation progress.
       */
      const p = interpolateAlongCurve(this.#curvePoints, progress);

      /**
       * Apply translation in local space.
       * Translation type is handled internally by the engine.
       */
      s.translate({
        x: p.x,
        y: p.y,
        tType: 'r' // Relative translation mode
      });
    }

    /**
     * -----------------------------------------------------------
     * STEP 6: Apply skew (shear) transformation
     * -----------------------------------------------------------
     *
     * Skew values are linearly interpolated
     * and applied with respect to their pivot.
     */
    isSK &&
      s.skew({
        sx: lerp(ISK!.sx, FSK.sx, progress),
        sy: lerp(ISK!.sy, FSK.sy, progress),
        tType: 'p',
        px: FSK?.px,
        py: FSK?.py
      });

    /**
     * -----------------------------------------------------------
     * STEP 7: Apply scale transformation
     * -----------------------------------------------------------
     *
     * Scale interpolation respects independent x/y components
     * and is applied around the resolved scale pivot.
     */
    isS &&
      s.scale({
        sx: lerp(IS!.sx, FS.sx, progress),
        sy: lerp(IS!.sy, FS.sy, progress),
        tType: 'p',
        px: FS.px,
        py: FS.py
      });

    /**
     * -----------------------------------------------------------
     * STEP 8: Apply rotation transformation
     * -----------------------------------------------------------
     *
     * Rotation is interpolated as a scalar value
     * and applied around its resolved pivot.
     */
    isR &&
      s.rotate({
        angle: lerp(IR!.angle, FR.angle, progress),
        tType: 'pivot',
        px: FR.px,
        py: FR.py
      });

    /**
     * -----------------------------------------------------------
     * STEP 9: Finalize transformation batching
     * -----------------------------------------------------------
     *
     * This commits the composed transformation matrix
     * to the shape in a single operation.
     */
    isToCompose > 0 && s.endT();
  }

  /**
   * Animates the element by applying geometry and style transitions
   * over a given duration using the configured animation pipeline.
   *
   * This is the main public entry point for triggering animations.
   * It prepares all animation state, resolves pivots, chooses
   * optimization strategies, and finally starts the animation loop.
   *
   * @param attrs      - User-provided animatable properties (style + geometry)
   * @param advanceOptions    - Optional advanced animation configuration
   * @param duration   - Total animation duration (milliseconds)
   * @param ease       - Easing function or easing name (default: 'linear')
   * @param onComplate - Optional callback invoked when animation completes
   * @param start      - Whether to auto-start the animation immediately
   *
   */
  public animate({
    attrs,
    advanceOptions,
    duration,
    ease = 'linear',
    onComplete,
    start = true
  }: IAnimationOptions): void {
    this.#resetAllStates();

    // ------------------------------------------------------------------
    // STEP 1: Handle and normalize basic animation parameters
    // ------------------------------------------------------------------

    userPropsValidation(attrs, this.#el.geometry?.shape as ShapeType);
    // Normalize duration (negative values treated as positive)
    this.#totalTime = timeValidation(duration) as number;

    // Resolve easing function (string-based or function-based)
    this.#easingFunction = handleEasing(ease) as EasingFunction;

    // Chain onComplete callbacks if provided
    this.#onComplete = onCompleteFuncValidation(onComplete) as Function;

    // Merge user-provided advanced properties into internal defaults
    advancePropsValidation(this.#advanceOptions, advanceOptions ?? {});

    // ------------------------------------------------------------------
    // STEP 2: Decompose user attributes into style and geometry properties
    // ------------------------------------------------------------------

    const geo = this.#el[GET_INTERNAL_GEOMETRY_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    ) as {
      transformStack: TransformStack;
      shape: ShapeType;
      buffer: Float32Array;
      bounds: Float32Array;
    };

    const { styleProps: sp, geometryProps: gp } = separateProperties(
      geo.shape as string,
      attrs
    );

    // ------------------------------------------------------------------
    // STEP 3: Normalize style properties for interpolation
    // ------------------------------------------------------------------

    this.#finalStyle = sp;
    this.#styleLerp();

    // ------------------------------------------------------------------
    // STEP 4: Associate geometry properties into affine representation
    // ------------------------------------------------------------------

    this.#associate(gp);

    // ------------------------------------------------------------------
    // STEP 5: Resolve pivot configuration and translation mode
    // ------------------------------------------------------------------

    let translateMode;

    [this.#isTranslation, translateMode] = this.#resolvePivot() as [
      boolean,
      PivotMode
    ];

    // ------------------------------------------------------------------
    // STEP 6: Reverse animation properties if direction is reverse
    // ------------------------------------------------------------------

    this.#advanceOptions?.controls?.direction === 'reverse' &&
      this.#reverseAnimationProps();

    // ------------------------------------------------------------------
    // STEP 7: Pre-compute curve path if translation is involved
    // ------------------------------------------------------------------

    if (this.#isTranslation) {
      this.#preComputeCurvePath(translateMode as PivotMode);
    }

    // ------------------------------------------------------------------
    // STEP 8: Determine base transformation matrix
    // ------------------------------------------------------------------

    //  const baseTransformationMatrix: Float32Array =
    //    geo.transformStack.stack[0].transformMatrix ||
    //    new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    // ------------------------------------------------------------------
    // STEP 9: Choose and apply optimization strategy
    // ------------------------------------------------------------------

    let controls = this.#advanceOptions.controls as AnimationControls;

    controls.optimizationTechnique !== 'preComputeFrames' &&
      (controls.optimizationTechnique = choosePivotAwareOptimization(
        this.#finalGeometry
      ));

    let optimizationTechnique =
      controls.optimizationTechnique as OptimizationTechnique;

    // STEP 9a: Pre-compute animation frames
    if (optimizationTechnique === 'preComputeFrames') {
      this.#preComputeFranesOrPolynomial = precomputeFramesRaw(
        this.#initialGeometry,
        this.#finalGeometry,
        100
      ) as optFuncType;
      this.#interpolateFunction = setPreComputedFrame;
    }
    // STEP 9b: Fit polynomial coefficients for interpolation
    else {
      // if (optimizationTechnique === 'fitPolynomialCofficient') {
      this.#preComputeFranesOrPolynomial = fitTransformPolynomialsFast(
        this.#initialGeometry,
        this.#finalGeometry
      );
      this.#interpolateFunction = transformUsingPolynomialFast;
    }

    // ------------------------------------------------------------------
    // STEP 10: Start animation if auto-start is enabled
    // ------------------------------------------------------------------

    if (start && !this.#animationState) {
      this.start();
    }
  }

  /**
   * Prepares style-related properties for linear interpolation
   * during animation.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function normalizes color-based style properties
   * (currently `fill` and `stroke`) so they can be interpolated
   * numerically over time.
   *
   * Animation systems cannot interpolate raw color strings
   * directly (e.g., hex, rgb, named colors). They must first be
   * converted into a numeric representation.
   *
   * This method performs that conversion *once*, before the
   * animation starts, for both:
   * - the initial style state
   * - the final target style state
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * Style animation should be:
   * - deterministic
   * - performant
   * - independent of per-frame parsing
   *
   * Parsing colors during each animation frame would:
   * - waste CPU cycles
   * - introduce unnecessary allocations
   * - complicate interpolation logic
   *
   * By resolving color values up front, the animation loop
   * only performs numeric interpolation.
   *
   * -------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------
   * - Only style properties explicitly present in `finalStyle`
   *   are considered animatable
   * - Initial styles are captured from the element once
   * - Both initial and final styles are normalized into
   *   interpolation-friendly formats
   * - No new style properties are introduced here
   *
   * This function mutates internal style state as part of
   * animation setup.
   */
  #styleLerp() {
    /**
     * Style properties that currently support color interpolation.
     * These are treated symmetrically.
     */
    const [f, s] = ['fill', 'stroke'];
    const iS = this.#initialStyle as Record<string, unknown>;
    const fS = this.#finalStyle as Record<string, unknown>;

    /**
     * Handle fill color interpolation.
     *
     * If the final style defines a `fill`, then:
     * - Capture the element's current fill as the initial value
     * - Normalize both initial and final fill values
     */
    f in fS &&
      ((iS[f] = this.#el.attrs(f)),
      this.#lerpColor(f, fS),
      this.#lerpColor(f, iS));

    /**
     * Handle stroke color interpolation.
     *
     * If the final style defines a `stroke`, then:
     * - Capture the element's current stroke as the initial value
     * - Normalize both initial and final stroke values
     */
    s in fS &&
      ((iS[s] = this.#el.attrs(s)),
      this.#lerpColor(s, fS),
      this.#lerpColor(s, iS));
  }

  /**
   * Reverses all applicable animation geometry properties in-place.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function prepares the animation system for reverse playback
   * by inverting the direction of all relevant affine transformations
   * stored in `finalGeometry`.
   *
   * It operates directly on the accumulated runtime geometry state
   * and does not touch user-provided input.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * Reverse animation is not achieved by replaying frames backwards.
   * Instead, the animation engine reverses the *direction* of motion
   * by negating transform deltas.
   *
   * This approach ensures:
   * - Deterministic behavior
   * - No need for frame buffering
   * - Correct interaction with easing and time-based interpolation
   *
   * -------------------------------------------------------------
   * TRANSFORM-SPECIFIC RULES
   * -------------------------------------------------------------
   * - Translate  → vector inversion
   * - Rotate     → angle sign inversion
   * - Skew       → vector inversion
   * - Scale      → NOT inverted
   *
   * Scale is intentionally excluded because:
   * - Negative scale would flip geometry
   * - It would change visual meaning
   * - Reverse playback should not mirror shapes
   *
   * -------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------
   * - Only own properties of `finalGeometry` are processed
   * - Scale is explicitly excluded
   * - All operations are done in-place
   * - Geometry integrity is preserved
   */
  #reverseAnimationProps() {
    /**
     * Iterate over all properties in finalGeometry.
     * Each property represents a resolved affine transform
     * accumulated earlier in the animation pipeline.
     */
    for (const k in this.#finalGeometry) {
      /**
       * Skip:
       * - inherited properties
       * - scale, which must not be inverted
       */
      if (
        !Object.prototype.hasOwnProperty.call(this.#finalGeometry, k) ||
        k == 'scale'
      )
        continue;

      /**
       * Rotation reversal.
       * Negating the rotation angle reverses angular direction.
       */

      k === 'rotate' &&
        (this.#finalGeometry[k].angle =
          (this.#finalGeometry[k].angle as number) * -1);

      /**
       * Vector-based transform reversal.
       *
       * Applies to:
       * - Translate
       * - Skew
       *
       * Each component of the vector is negated
       * to reverse directional motion.
       */
      k === 'translate' &&
        ((this.#finalGeometry[k].x = (this.#finalGeometry[k].x as number) * -1),
        (this.#finalGeometry[k].y = (this.#finalGeometry[k].y as number) * -1));

      k === 'skew' &&
        ((this.#finalGeometry[k].sx =
          (this.#finalGeometry[k].sx as number) * -1),
        (this.#finalGeometry[k].sy =
          (this.#finalGeometry[k].sy as number) * -1));
    }
  }

  /**
   * Resolves and applies pivot points for all affine transformations
   * (rotate, scale, skew) based on current animation state and user input.
   *
   * -------------------------
   * CORE RESPONSIBILITY
   * -------------------------
   * This function translates high-level, user-provided pivot intent
   * (strings like 'center', 'TL', or numeric coordinates)
   * into concrete numeric pivot coordinates stored directly
   * in the runtime geometry (`finalGeometry`).
   *
   * It enforces strict animation invariants so that:
   * - Animations remain predictable
   * - Transform composition behaves correctly
   * - User mistakes do not break animation semantics
   *
   * -------------------------
   * KEY INVARIANTS ENFORCED
   * -------------------------
   * 1. Translation dominance:
   *    If translation exists, it overrides all other pivot configurations.
   *    This prevents broken affine composition.
   *
   * 2. Single source of truth:
   *    Resolved pivots are written ONLY into finalGeometry,
   *    not back into user pivot input.
   *
   * 3. Deterministic resolution:
   *    String anchors are always resolved against the current bounding box.
   *
   * 4. Safe defaults:
   *    Missing or invalid pivots fall back to [0, 0].
   *
   * -------------------------
   * RETURN VALUE
   * -------------------------
   * [boolean, modes]
   * - boolean: whether translation exists
   * - modes: the resolved pivot mode used for this animation
   *
   * This information is used later for optimization and interpolation logic.
   */
  #resolvePivot(): [boolean, PivotMode] {
    /**
     * User-provided pivot configuration.
     * This object represents user intent and may contain:
     * - string anchors
     * - numeric coordinates
     * - missing or partial data
     *
     * NOTE:
     * This object SHOULD NOT be treated as runtime state.
     * Runtime state is written into finalGeometry instead.
     */
    const pivot = this.#advanceOptions.pivots as PivotOptions;

    /**
     * Normalize pivot mode.
     * Ensures the mode is a valid internal enum value.
     */
    pivot.mode = pivot.mode as PivotMode;

    // --- Get object bounding info ---

    /**
     * bounds of the element.
     * All string-based pivot anchors are resolved
     * against this geometry.
     *
     * bounds is treated as read-only input data.
     */

    const bounds = this.#el.geometry.bounds as Float32Array;

    // --- Check if translation exists ---

    /**
     * Extract translation vector from final geometry.
     * Translation is evaluated BEFORE pivot resolution
     * because it may override pivot behavior entirely.
     */
    const { translate } = this.#finalGeometry as PivotTransformations;

    /**
     * Alias to runtime geometry.
     * This is the ONLY place where resolved pivots are stored.
     */
    const fg = this.#finalGeometry as PivotTransformations;

    /**
     * Translation existence check.
     * Even a single non-zero component activates translation dominance.
     */
    let isT = translate.x !== 0 || translate.y !== 0;

    /**
     * Flag returned to the caller.
     * Used by later animation logic to optimize behavior.
     */
    let isTranslation = false;

    if (isT) {
      /**
       * -------------------------------------------------------
       * TRANSLATION DOMINANCE MODE
       * -------------------------------------------------------
       *
       * If translation exists, it dominates all pivot semantics.
       * This is REQUIRED to maintain correct affine composition.
       *
       * Without this rule:
       * - Rotation would orbit unexpected points
       * - Scaling would visually drift
       * - Animation would feel physically incorrect
       */

      isTranslation = true;

      /**
       * Enforce a translation-compatible pivot mode.
       * Only relative or center-based pivots are valid here.
       * Any invalid mode is corrected automatically.
       */
      !['r', 'relative', 'c', 'center'].includes(pivot.mode) &&
        (pivot.mode = 'r');

      /**
       * Resolve the translation pivot once.
       * This single pivot is applied uniformly
       * to rotate, scale, and skew.
       */
      const { px, py } = resolvePivots(pivot.mode as PivotMode, bounds);

      /**
       * IMPORTANT:
       * Each pivot gets its own array instance.
       * This avoids aliasing bugs and unintended shared mutation.
       */
      fg.rotate.px = px;
      fg.rotate.py = py;

      fg.scale.px = px;
      fg.scale.py = py;

      fg.skew.px = px;
      fg.skew.py = py;
    } else {
      /**
       * -------------------------------------------------------
       * NON-TRANSLATION MODE
       * -------------------------------------------------------
       *
       * When no translation exists:
       * - Each transform may have its own pivot
       * - Common pivot may override individual pivots
       */

      /**
       * Pivot mode defaults to explicit pivot handling.
       */
      pivot.mode = 'p';

      // --- Common pivot has the highest priority ---

      /**
       * Common pivot applies to ALL transforms
       * and overrides individual pivot definitions.
       */
      const commonPivot = pivot.commonPivot;

      if (commonPivot) {
        /**
         * Resolved common pivot in numeric form.
         */
        let px!: number, py!: number;

        /**
         * Numeric pivot provided by user.
         * Ignore zero-only pivots as invalid intent.
         */
        if (typeof commonPivot === 'object') {
          // it means user given common pivot is { px : number , py : number }
          const { px: x, py: y } = commonPivot as Pivot;
          (x !== 0 || y !== 0) && ([px, py] = [x, y] as NumericPair);
        }

        /**
         * String anchor pivot.
         * Must be resolved against OBB.
         */
        if (typeof commonPivot === 'string') {
          // it means user given common pivot is PivotAnchors i.e "TL" , "BR" etc.

          const { px: x, py: y } = resolvePivots(commonPivot, bounds);
          (x !== 0 || y !== 0) && ([px, py] = [x, y] as NumericPair);
        }

        /**
         * Apply resolved common pivot only
         * if the transform does not already have a pivot.
         */
        if (px && py) {
          fg.rotate.px = px;
          fg.rotate.py = py;

          fg.scale.px = px;
          fg.scale.py = py;

          fg.skew.px = px;
          fg.skew.py = py;
        }
      } else {
        /**
         * ---------------------------------------------------
         * INDIVIDUAL PIVOT RESOLUTION
         * ---------------------------------------------------
         *
         * Each transform resolves its pivot independently.
         */

        const { rotatePivot, scalePivot, skewPivot } = pivot;

        // Rotate pivot
        if (
          rotatePivot &&
          (typeof rotatePivot !== 'object' ||
            (rotatePivot.px === 0 && rotatePivot.py === 0))
        ) {
          /**
           * String anchor resolution or fallback to origin.
           */
          if (typeof pivot.rotatePivot === 'string') {
            const { px, py } = resolvePivots(
              pivot.rotatePivot as PivotAnchors,
              bounds
            );
            fg.rotate.px = px;
            fg.rotate.py = py;
          }
        }

        // scale pivot
        if (
          scalePivot &&
          (typeof scalePivot !== 'object' ||
            (scalePivot.px === 0 && scalePivot.py === 0))
        ) {
          /**
           * String anchor resolution or fallback to origin.
           */
          if (typeof pivot.scalePivot === 'string') {
            const { px, py } = resolvePivots(
              pivot.rotatePivot as PivotAnchors,
              bounds
            );
            fg.scale.px = px;
            fg.scale.py = py;
          }
        }

        // skew pivot
        if (
          skewPivot &&
          (typeof skewPivot !== 'object' ||
            (skewPivot.px === 0 && skewPivot.py === 0))
        ) {
          /**
           * String anchor resolution or fallback to origin.
           */
          if (typeof pivot.skewPivot === 'string') {
            const { px, py } = resolvePivots(
              pivot.rotatePivot as PivotAnchors,
              bounds
            );
            fg.skew.px = px;
            fg.skew.py = py;
          }
        }
      }
    }

    /**
     * Return translation existence and final pivot mode.
     * These values are consumed by downstream animation logic.
     */
    return [isTranslation, pivot.mode as PivotMode];
  }

  /**
   * Pre-computes curve path data for translation-based animations.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function generates and prepares all data required
   * to animate translation along a curve instead of a straight line.
   *
   * It converts:
   * - User-provided curve intent (curve type, stiffness, smoothness)
   * - Translation vector (tx, ty)
   *
   * into:
   * - Discrete curve sample points
   * - Arc-length lookup table
   * - Total curve length
   *
   * These precomputed values are later consumed by the animation
   * update loop to produce smooth, time-consistent motion.
   *
   * -------------------------------------------------------------
   * WHY PRECOMPUTATION IS REQUIRED
   * -------------------------------------------------------------
   * Curve-based motion cannot be efficiently computed per frame.
   * Doing so would:
   * - Increase CPU cost
   * - Introduce floating-point drift
   * - Break uniform speed along the curve
   *
   * Therefore, the entire curve geometry is resolved ONCE
   * before animation starts.
   *
   * -------------------------------------------------------------
   * TRANSLATION MODE INTERACTION
   * -------------------------------------------------------------
   * The translation pivot mode determines how the curve
   * is positioned relative to the shape.
   *
   * - Relative mode → curve originates from top-left
   * - Center mode   → curve originates from center
   *
   * This ensures visual correctness when combining
   * translation with other transforms.
   */
  #preComputeCurvePath(translateMode: PivotMode) {
    /**
     * User-provided curve configuration.
     * This object represents intent, not resolved runtime data.
     */
    const curve = this.#advanceOptions.curve as CurveMotionOptions;

    /**
     * Ensure curve-based motion is enabled.
     * If translation exists but user did not explicitly enable
     * curve path motion, the system enables it automatically.
     *
     * This is a defensive design choice to preserve animation intent.
     */
    !curve.enabled && (curve.enabled = true);

    /**
     * If curve stiffness is zero, force linear path.
     *
     * Even if curve motion is enabled:
     * - Zero stiffness implies no curvature
     * - Therefore linear interpolation is semantically correct
     *
     * Also acts as a fallback when curve type is not explicitly provided.
     */
    curve.curvature == 0 && (curve.path = 'linear');

    // const { p1, p2 } = this.#getControlPointsOfCurve(translateMode as string);

    // --- Get object bounding info ---

    /**
     * Oriented Bounding Box (OBB) of the element.
     * Used to resolve pivot placement for curve formation.
     *
     * Treated strictly as read-only geometric input.
     */
    const bounds = this.#el.geometry.bounds as Float32Array;

    /**
     * Translation vector extracted from resolved geometry.
     * This defines the start and end points of the curve.
     */
    const { x: tx, y: ty } = this.#finalGeometry.translate;

    /**
     * Generate curve sample points, arc-length lookup table,
     * and total curve length.
     *
     * P1 is always the local origin [0, 0].
     * P2 is the translation target [tx, ty].
     *
     * Bend direction is inverted to align
     * with internal coordinate conventions.
     */
    [this.#curvePoints, this.#arcTable, this.#totalLength] =
      generateCurvePoints({
        P1: { x: 0, y: 0 },
        P2: { x: tx, y: ty },
        bend: (curve.curvature as number) * -1,
        smoothness: curve.samples as number,
        curveName: curve.path as CurveType,
        pointsOnly: false,
        continuous: false,
        continuousCount: 1
      }) as [Point2D[], ArcLengthTableEntry[], number];

    /**
     * Determine pivot resolution mode for translation.
     *
     * - Relative translation → top-left anchor
     * - Center-based translation → center anchor
     *
     * This ensures the curve is spatially aligned
     * with the chosen translation semantics.
     */

    let anchor: PivotAnchors = 'c'; // center

    // make anchor top left
    (translateMode == 'r' || translateMode == 'relative') && (anchor = 'tm');

    /**
     * Pivot reference point used for curve formation.
     * This determines where the curve is anchored
     * relative to the shape.
     */
    const pivot = resolvePivots(anchor, bounds);

    /**
     * Apply curve formation logic.
     *
     * This step aligns the generated curve points
     * with the element geometry and resolved pivot.
     *
     * The resulting curve data is now fully ready
     * for time-based interpolation during animation.
     */
    this.#curveFormation(this.#curvePoints, pivot);
  }

  /**
   * Normalizes a color-based property into a format suitable
   * for linear interpolation during animation.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * Color values provided by users may come in many forms:
   * - color names
   * - hex strings
   * - rgb / rgba strings
   * - other supported color formats
   *
   * Direct interpolation on such raw values is not possible.
   * This function converts a color property into a normalized,
   * numeric representation that can be linearly interpolated
   * frame-by-frame by the animation system.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * The animation engine operates on numeric interpolation.
   * Color animation therefore requires an upfront conversion
   * from symbolic or string-based color representations
   * into a numeric form (e.g., RGBA arrays).
   *
   * This function performs that conversion *in-place*
   * on the target object to avoid:
   * - repeated parsing per frame
   * - unnecessary allocations
   * - runtime overhead during animation updates
   *
   * -------------------------------------------------------------
   * BEHAVIORAL GUARANTEES
   * -------------------------------------------------------------
   * - If the property does not exist, nothing is modified
   * - If the property exists, it is replaced with a parsed color
   * - Invalid or missing color values fall back safely
   *
   * -------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------
   * @param p - Property name expected to contain a color value
   * @param o - Object holding animatable properties
   */

  #lerpColor(p: string, o: Record<string, unknown>): void {
    /**
     * Check whether the provided object actually contains
     * the target property.
     *
     * This prevents accidental mutation of unrelated objects
     * and avoids runtime errors.
     */

    const isP = p in o;
    /**
     * Retrieve the raw color value if present.
     * If not present, use a neutral placeholder.
     */

    const lp = isP ? o[p] : 'none';

    /**
     * Color parser instance.
     * Initialized with a neutral value to ensure
     * predictable fallback behavior.
     */
    const colorTest = new Colors('none');

    /**
     * Parse the color value and replace the original property
     * with its numeric representation.
     *
     * This prepares the property for linear interpolation
     * during animation frames.
     */

    if (isP) {
      o[p] = colorTest.parseColor(lp as string);
    }
  }

  /**
   * Converts an absolute scale value into a normalized scale factor
   * relative to the shape's intrinsic geometric dimension.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * Different shapes have different intrinsic dimensions
   * (e.g., width, height, radius).
   *
   * This function ensures that scale animations behave
   * consistently across shapes by converting user-provided
   * absolute values into dimension-relative scale factors.
   *
   * Without this conversion:
   * - Scaling would behave differently for different shapes
   * - Animations would feel inconsistent and unpredictable
   *
   * -------------------------------------------------------------
   * WHY THIS IS REQUIRED
   * -------------------------------------------------------------
   * Scale transformations in animation systems are multiplicative.
   * However, users often think in absolute terms (pixels, units),
   * not in scale ratios.
   *
   * This function bridges that semantic gap by normalizing
   * scale input against the shape's base geometry.
   *
   * -------------------------------------------------------------
   * FALLBACK BEHAVIOR
   * -------------------------------------------------------------
   * If the requested geometric property does not exist,
   * a fallback value of 1 is used to prevent division errors
   * and ensure safe execution.
   *
   * -------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------
   * @param prop - Geometry property name (e.g., width, height, radius)
   * @param v    - Absolute scale value provided by the user
   *
   * @returns Normalized scale factor suitable for affine transforms
   */
  #scaleConvertion(prop: string, v: number): number {
    /**
     * Retrieve the intrinsic geometric dimension
     * associated with the given property.
     *
     * Optional chaining is used to safely access geometry,
     * as not all shapes expose the same properties.
     *
     * Fallback to 1 ensures:
     * - No division by zero
     * - Stable animation behavior
     */
    const geom = this.#el.geometry?.[prop] || 1;

    /**
     * Convert absolute value into relative scale factor.
     * This value can now be safely applied to the
     * scale transformation pipeline.
     */
    return v / geom;
  }

  /**
   * Associates and accumulates all geometry-related animation properties
   * into the internal `finalGeometry` state.
   *
   * -------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------
   * This function acts as a *geometry normalizer and accumulator*.
   *
   * Different shapes expose different animatable geometry properties
   * (e.g., translate, rotate, scale, skew, width-based translation,
   * height-based scaling, etc.).
   *
   * This method:
   * - Reads all geometry-related animation inputs
   * - Normalizes them into a unified affine representation
   * - Accumulates them into `finalGeometry`
   *
   * After this step, the animation engine works exclusively with
   * `finalGeometry`, regardless of the original property names
   * or shape-specific semantics.
   *
   * -------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------
   * Shapes do not share a single geometric vocabulary.
   * For example:
   * - Some shapes express translation via `x` / `y`
   * - Others via width/height deltas
   * - Scale may be expressed in absolute or relative terms
   *
   * This function resolves that heterogeneity and enforces
   * a single internal affine model:
   *
   *   Translate → [x, y]
   *   Rotate    → angle
   *   Scale     → [sx, sy]
   *   Skew      → [kx, ky]
   *
   * -------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------
   * - All transforms are accumulated, not overwritten
   * - Missing values default safely
   * - Scale must never be zero (identity enforced)
   * - User-facing property names are never used beyond this point
   *
   * -------------------------------------------------------------
   * INPUT
   * -------------------------------------------------------------
   * gProps represents shape-specific animatable geometry properties.
   * It may contain:
   * - Explicit transform blocks (translate, rotate, scale, skew)
   * - Shape-specific shorthand properties
   *
   * This function mutates `finalGeometry` as part of animation setup.
   */
  #associate(gProps: BaseTransformations | GeometricalAnimatableProperties) {
    /**
     * Direct transform association.
     * If the user explicitly provided transform blocks,
     * initialize the corresponding finalGeometry components.
     */

    'translate' in gProps &&
      ((this.#finalGeometry.translate.x = gProps?.translate?.x || 0),
      (this.#finalGeometry.translate.y = gProps?.translate?.y || 0));

    'rotate' in gProps &&
      (this.#finalGeometry.rotate.angle = gProps?.rotate?.angle || 0);

    'scale' in gProps &&
      ((this.#finalGeometry.scale.sx = gProps?.scale?.sx || 1),
      (this.#finalGeometry.scale.sy = gProps?.scale?.sy || 1));

    'skew' in gProps &&
      ((this.#finalGeometry.skew.sx = gProps?.skew?.sx || 0),
      (this.#finalGeometry.skew.sy = gProps?.skew?.sy || 0));

    /**
     * Process remaining geometry-related properties.
     *
     * These may be:
     * - Shape-specific aliases
     * - Width/height based motion
     * - Indirect transform contributors
     *
     * Explicit transform blocks are skipped here
     * to avoid double application.
     */
    for (let k in gProps) {
      /**
       * Skip explicit transform keys.
       * These are already handled above.
       */
      const isTeansforms =
        k == 'translate' || k == 'rotate' || k == 'scale' || k == 'skew';

      if (!gProps.hasOwnProperty(k) || isTeansforms) continue;

      /**
       * Raw property value associated with this key.
       * Treated as a numeric contribution to geometry.
       */
      const v = (gProps as any)[k];

      /**
       * Translation accumulation (x-axis).
       * Certain shape properties implicitly contribute
       * to horizontal translation.
       */
      if (
        PROPERTY_TRANSFORMATION_MAP[
          ((TX_PROPERTIES as readonly string[]).includes(k)
            ? k
            : 'not') as keyof typeof PROPERTY_TRANSFORMATION_MAP
        ] === 'Translate'
      ) {
        this.#finalGeometry.translate.x += v;
        continue;
      }

      /**
       * Translation accumulation (y-axis).
       * Certain shape properties implicitly contribute
       * to vertical translation.
       */
      if (
        PROPERTY_TRANSFORMATION_MAP[
          ((TY_PROPERTIES as readonly string[]).includes(k)
            ? k
            : 'not') as keyof typeof PROPERTY_TRANSFORMATION_MAP
        ] === 'Translate'
      ) {
        this.#finalGeometry.translate.y += v;
        continue;
      }

      /**
       * Scale accumulation (x-axis).
       * Absolute values are normalized via scale conversion
       * before being applied.
       */
      if (
        PROPERTY_TRANSFORMATION_MAP[
          ((SX_PROPERTIES as readonly string[]).includes(k)
            ? k
            : 'not') as keyof typeof PROPERTY_TRANSFORMATION_MAP
        ] === 'Scale'
      ) {
        this.#finalGeometry.scale.sx += this.#scaleConvertion(k, v);
        continue;
      }

      /**
       * Scale accumulation (y-axis).
       * Absolute values are normalized via scale conversion
       * before being applied.
       */
      if (
        PROPERTY_TRANSFORMATION_MAP[
          ((SY_PROPERTIES as readonly string[]).includes(k)
            ? k
            : 'not') as keyof typeof PROPERTY_TRANSFORMATION_MAP
        ] === 'Scale'
      ) {
        this.#finalGeometry.scale.sy += this.#scaleConvertion(k, v);
      }
    }

    /**
     * Enforce scale identity invariants.
     *
     * Scale values must never be zero, as that would:
     * - Collapse geometry
     * - Break affine math
     * - Cause undefined animation behavior
     *
     * Default identity scale is enforced if required.
     */
    this.#finalGeometry.scale.sx == 0 && (this.#finalGeometry.scale.sx = 1);
    this.#finalGeometry.scale.sy == 0 && (this.#finalGeometry.scale.sy = 1);
  }
}
