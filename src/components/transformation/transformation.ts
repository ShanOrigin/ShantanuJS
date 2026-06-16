/**
 * ============================================================================
 * TYPE IMPORTS
 * ============================================================================
 *
 * Type-only imports used exclusively for static type checking and
 * compile-time validation.
 *
 * These imports:
 * - do NOT contribute to runtime output
 * - define the structural contracts for transformation inputs and outputs
 * - ensure strict typing across the transformation pipeline
 */

import type {
  BboxProps,
  CreateTransformationMatrixProps,
  ParsedDaTa,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps,
  TranslateMethodProps,
  TransformTypes,
  CenterType
} from '../../models/types/affine-transformations';

import type {
  GetInternalGraphicsAccessor,
  GraphicsNode
} from '../../models/interfaces/graphics-container';
import type { TransformStack } from '../../models/types/common';
import type { InternalGeometryAccessor } from '../../models/types/graphics-model';
import type {
  ICommonGeometricProperties,
  IShapeStyleProperties
} from '../../property-definitions/common/common-properties';

/**
 * ============================================================================
 * ERROR CLASSES
 * ============================================================================
 *
 * Engine-defined error types used to enforce:
 * - correct API usage
 * - valid lifecycle sequencing
 * - internal state invariants
 *
 * These errors are part of the public diagnostic contract and must be thrown
 * instead of generic Error objects.
 */

import {
  InvalidArgumentError,
  InvalidFormatError,
  InvalidInternalStateError,
  OperationInProgressError
} from '../../errors/index.js';

/**
 * ============================================================================
 * CORE HELPERS & VALIDATION UTILITIES
 * ============================================================================
 *
 * Shared helper utilities responsible for:
 * - runtime parameter validation
 * - matrix initialization and reset
 * - low-level type and property checks
 */

import { resetMatrix } from '../../utils/math/matrix/matrix-utils.js';
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_GRAPHICS_METHOD
} from '../../internal/keys/dev-keys.js';

import {
  affineMatrixMultiplyUsingDOMMatrix,
  applyTransformToHomogeneousBuffer
} from '../../utils/math/matrix/matrix-multiplication.js';
import { composeAffineTransformations } from '../../utils/math/affine/affine-composition.js';
import { computeAABBPoints } from '../../utils/geometry/bounding-box/axis-aligned-bounding-box.js';
import {
  parameterTypeValidator,
  propTypes,
  typeCheck
} from '../../utils/helpers/helpers.js';
import { translate } from '../../utils/math/affine/transformations/translation.js';
import { scale } from '../../utils/math/affine/transformations/scale.js';
import { rotate } from '../../utils/math/affine/transformations/rotate.js';
import { skew } from '../../utils/math/affine/transformations/skew.js';
import { parseExpression } from '../../utils/math/affine/affine-expression-parser.js';
import type { ITransformation } from '../../models/interfaces/transformation';
import { resolvePivots } from '../../utils/geometry/pivot-resolution/pivot-utils.js';

/**
 * ============================================================================
 * ACTUAL CLASS IMPLEMENTATION
 * ============================================================================
 *
 */
/**
 * Central transformation engine responsible for applying, composing,
 * batching, and finalizing geometric transformations on a shape.
 *
 * -------------------------------------------------------------------------
 * CORE RESPONSIBILITY
 * -------------------------------------------------------------------------
 * The Transformation class provides the complete transformation pipeline
 * for a shape by:
 * - exposing public transformation APIs (translate, scale, rotate, skew, flip)
 * - validating and normalizing transformation inputs
 * - managing transformation batching and lifecycle
 * - composing transformation matrices deterministically
 * - applying finalized transformations to geometry buffers
 * - synchronizing geometric and visual state
 *
 * It acts as the single authoritative layer for all transformation logic.
 *
 * -------------------------------------------------------------------------
 * WHY THIS CLASS EXISTS
 * -------------------------------------------------------------------------
 * Transformations are not isolated operations; they are stateful, order-
 * dependent, and often accumulated over time (e.g. batching, animations,
 * declarative transform sequences).
 *
 * This class centralizes all transformation concerns to:
 * - avoid duplicated logic across shape APIs
 * - enforce transformation invariants consistently
 * - provide a unified execution model for immediate and batched transforms
 * - ensure performance through matrix reuse and zero-allocation hot paths
 *
 * -------------------------------------------------------------------------
 * DESIGN INVARIANTS
 * -------------------------------------------------------------------------
 * - All transformations are represented internally as homogeneous matrices
 * - Transformation order is strictly preserved
 * - Readonly Geometry buffers are treated as reading buffer.
 * - Matrix composition is the single source of truth
 * - Batching must be explicitly begun and finalized
 * - Visual state must always reflect finalized transformations
 *
 * -------------------------------------------------------------------------
 * ARCHITECTURAL ROLE
 * -------------------------------------------------------------------------
 * This class is not a utility or helper.
 *
 * It functions as:
 * - a transformation state machine
 * - a matrix composition engine
 * - an execution router between batching and immediate application
 *
 * Other modules (shape, animation, parsing) delegate transformation
 * responsibility to this class rather than reimplementing logic.
 *
 * -------------------------------------------------------------------------
 * ERROR MODEL
 * -------------------------------------------------------------------------
 * This class enforces strict correctness through explicit error signaling:
 * - UsageError        : invalid arguments or formats
 * - StateError        : invalid lifecycle or incomplete state transitions
 * - InvalidInternalStateError : internal invariant violations
 *
 * Errors are thrown at the layer that owns the invariant and are never
 * silently ignored or auto-corrected.
 *
 * -------------------------------------------------------------------------
 * PERFORMANCE CONSIDERATIONS
 * -------------------------------------------------------------------------
 * - DOMMatrix instances are reused to avoid allocations
 * - Float32Array buffers are used for predictable numeric performance
 * - Matrix composition avoids intermediate object creation
 * - Hot paths are optimized for repeated transformations
 *
 * -------------------------------------------------------------------------
 * EXTENSIBILITY
 * -------------------------------------------------------------------------
 * The Transformation class is designed to be extensible:
 * - new transformation types can be added without breaking existing APIs
 * - batching semantics can be extended or specialized
 * - animation systems can integrate without duplicating logic
 *
 * It forms a stable foundation for future rendering backends and
 * transformation features.
 */

export class Transformation implements ITransformation {
  /**
   * Readonly Reference to the original shape instance associated with this engine.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Holds a strong reference to the concrete shape object for which
   * geometry, style, and transformations are being managed.
   *
   * This reference is established during construction and never changes
   * throughout the lifecycle of this instance.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Assigned during constructor execution
   * - Used as the authoritative source for internal geometry and style access
   * - Never reassigned or mutated
   */
  readonly #gModel!: GraphicsNode;

  /**
   * Readonly Internal geometry state of the associated shape.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the engine-level geometry object backing the shape.
   * This is NOT a public-facing geometry representation.
   *
   * It exposes low-level positional, dimensional, and transformation-related
   * data required for animation and batching.
   *
   * -------------------------------------------------------------------------
   * ACCESS MODEL
   * -------------------------------------------------------------------------
   * - Retrieved using DEV_INTERNAL_ACCESS
   * - Bypasses public API safety layers intentionally
   * - Intended strictly for engine-internal use
   */
  readonly #geometry: ICommonGeometricProperties['geometry'];

  /**
   * Readonly Internal style state of the associated shape.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the engine-level style object backing the shape.
   * Contains normalized, animatable style properties such as:
   * - fill
   * - stroke
   * - opacity
   * - strokeWidth
   *
   * -------------------------------------------------------------------------
   * ACCESS MODEL
   * -------------------------------------------------------------------------
   * - Retrieved using DEV_INTERNAL_ACCESS
   * - Assumes trusted, validated usage
   * - Must never be exposed directly to users
   */
  // readonly #style: Partial<IShapeStyleProperties>;

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ Transformation Batching  Methods +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Batched transformation matrix used during transformation batching.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Acts as an accumulator matrix during batching mode.
   * Multiple affine transformations are composed into this matrix
   * without immediately mutating the target geometry.
   *
   * -------------------------------------------------------------------------
   * WHY THIS EXISTS
   * -------------------------------------------------------------------------
   * Batching avoids repeated DOM or geometry updates by:
   * - accumulating transformations
   * - applying them in a single composed operation
   *
   * This matrix is reset or finalized when batching ends.
   */
  #composedMatrix: DOMMatrix = new DOMMatrix();

  /**
   * Temporary transformation matrix used during matrix multiplication.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Serves as a scratch matrix to avoid unnecessary allocations
   * during chained matrix multiplication.
   *
   * -------------------------------------------------------------------------
   * PERFORMANCE NOTE
   * -------------------------------------------------------------------------
   * Reusing a temporary matrix significantly reduces GC pressure
   * during high-frequency transformation operations.
   */
  #tempMatrix: DOMMatrix = new DOMMatrix();

  /**
   * Flag indicating whether transformation batching is currently active.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Controls whether transformation methods:
   * - apply changes immediately, or
   * - defer and accumulate them into the batched matrix
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Set to true when batching starts
   * - Reset to false when batching completes or is cancelled
   */
  #isBatching: boolean = false;

  /**
   * Creates a new transformation controller bound to a specific shape.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Establishes the association between this transformation module
   * and the concrete shape instance it operates on.
   *
   * This constructor does NOT perform any validation, normalization,
   * or state mutation beyond reference binding.
   *
   * -------------------------------------------------------------------------
   * DESIGN DECISION
   * -------------------------------------------------------------------------
   * The transformation system assumes the shape instance has already
   * been validated and initialized by higher-level orchestration logic.
   *
   * Any invalid shape state is expected to be caught earlier in the pipeline.
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param gModel - Concrete shape instance whose geometry and style
   *                 will be transformed by this module.
   */

  constructor(gModel: GraphicsNode) {
    this.#gModel = gModel;

    this.#geometry = (this.#gModel as GraphicsNode & InternalGeometryAccessor)[
      GET_INTERNAL_GEOMETRY_METHOD
    ](DEV_INTERNAL_ACCESS_KEY);
    //   this.#style = this.#gModel.getIStyle(DEV_INTERNAL_ACCESS);
  }

  /**
   * Begins transformation batching mode.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Enables batching of multiple affine transformation operations
   * into a single composed transformation matrix.
   *
   * While batching is active:
   * - Individual transformation methods do NOT immediately apply changes
   * - All transformations are accumulated internally
   *
   * -------------------------------------------------------------------------
   * STATE INVARIANTS
   * -------------------------------------------------------------------------
   * - Only one batching session may be active at a time
   * - Nested or overlapping batching is explicitly forbidden
   *
   * -------------------------------------------------------------------------
   * ERROR CONDITIONS
   * -------------------------------------------------------------------------
   * Throws OperationInProgressError if batching is already active.
   *
   * This enforces strict lifecycle discipline and prevents
   * ambiguous transformation state.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * @returns this - Enables fluent chaining of transformation calls.
   */

  public beginT(): this {
    if (this.#isBatching)
      throw new OperationInProgressError(
        ' .beginT() Transformation batching is already active Call .endT() before invoking .beginT() again.',
        'Cannot apply any new transformation',
        'transformation.beginT()'
      );

    this.#isBatching = true;
    return this;
  }

  /**
   * Indicates whether transformation batching is currently active.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Exposes the current batching state for internal coordination
   * and conditional execution paths.
   *
   * -------------------------------------------------------------------------
   * DESIGN NOTE
   * -------------------------------------------------------------------------
   * This method is intentionally read-only and side-effect free.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * @returns true if batching is active, false otherwise.
   */

  public isBatching(): boolean {
    return this.#isBatching;
  }

  /**
   * Ends transformation batching and applies the accumulated transformation.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Finalizes the batching lifecycle by:
   * - Disabling batching mode
   * - Applying the cumulative batched transformation to the visual output
   * - Resetting the internal batched transformation matrix
   *
   * -------------------------------------------------------------------------
   * BEHAVIORAL NOTES
   * -------------------------------------------------------------------------
   * - If batching is not active, this method performs a safe no-op
   * - No error is thrown for redundant end calls
   *
   * This design allows idempotent usage without forcing
   * the caller to track batching state explicitly.
   *
   * -------------------------------------------------------------------------
   * FINALIZATION STRATEGY
   * -------------------------------------------------------------------------
   * The accumulated matrix is applied using a single
   * finalizeTransform invocation with:
   * - transformName: 'cumulative'
   * - transformType: 'batched'
   *
   * This ensures correct semantic tagging downstream.
   */

  public endT(): Float32Array {
    if (!this.#isBatching) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    this.#isBatching = false;

    const finalMatrix = this.#batchingAndFinalizeTransformHandler({
      transformMatrix: this.#composedMatrix
    }) as Float32Array;

    resetMatrix(this.#composedMatrix);

    return finalMatrix;
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ Healper  Methods +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Handles transformation application by routing between batched and
   * immediate finalization logic.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method determines how a transformation should be applied based on
   * the current batching state. It either:
   * - accumulates the transformation into an active batch, or
   * - finalizes the transformation immediately
   *
   * It acts as a central decision point for transformation lifecycle control.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Transformations may be applied incrementally during batching to avoid
   * repeated geometry updates. Once batching is complete, transformations
   * must be finalized and applied deterministically.
   *
   * This method abstracts that conditional logic to keep calling code clean
   * and consistent.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Only one batching session may be active at a time
   * - Batched transformations must not be finalized prematurely
   * - Finalization must always go through the same pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param transformMatrix - Transformation matrix to apply or batch.
   * @param transformName   - Name of the transformation being processed.
   * @param transformType   - Type of transformation (e.g. batched or immediate).
   * @param callback        - Callback to be invoked upon finalization.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Returns the current instance when batching is active, otherwise returns void.
   */
  #batchingAndFinalizeTransformHandler({
    transformMatrix
  }: {
    transformMatrix: DOMMatrix;
  }): Float32Array | void {
    /* ---------------------------------------------------------------------
     * STEP 1: Check for active batching state
     * ---------------------------------------------------------------------
     * If batching is enabled, transformations are accumulated rather than
     * finalized immediately.
     */
    if (this.#isBatching) {
      // Accumulate transformation into the batch composition matrix
      affineMatrixMultiplyUsingDOMMatrix(this.#composedMatrix, transformMatrix);

      // Enable chaining while batching
      return;
    }

    /* ---------------------------------------------------------------------
     * STEP 2: Finalize transformation immediately
     * ---------------------------------------------------------------------
     * When not batching, the transformation is applied directly through
     * the standard finalization pipeline.
     */

    /*
    this.#finalizeTransform({
      transformMatrix,
      transformName,
      transformType
    });
		*/

    if (transformMatrix instanceof DOMMatrix) {
      const { a, b, m31, c, d, m32, e, f } = transformMatrix;

      // Column-major representation used for compatibility
      // with internal row-major geometry buffer handling
      const tm = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

      return tm;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ TRANSLATE METHOD  +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a translation transformation to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method computes and applies a translation transform by:
   * - validating input parameters
   * - resolving translation reference type (absolute, center, etc.)
   * - computing pivot coordinates when required
   * - generating a translation matrix
   * - routing the transformation through batching or immediate finalization
   *
   * It serves as the public entry point for translation operations.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Translation is a fundamental transformation that may depend on the
   * shape’s current geometry (e.g. center-based translation).
   *
   * This method provides a consistent, validated interface for translation
   * while integrating seamlessly with batching, animation, and transform
   * composition pipelines.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Parameters must conform to expected types
   * - Translation reference type must be normalized
   * - Geometry bounds must be resolved when pivot-based translation is used
   * - Transformation must go through the unified finalization pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param x        - Translation distance along the x-axis.
   * @param y        - Translation distance along the y-axis.
   * @param tType    - Translation type (absolute, center, or relative).
   * @param px       - Pivot x-coordinate (used for pivot-based translation).
   * @param py       - Pivot y-coordinate (used for pivot-based translation).
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Depending on the execution context:
   * - returns `void` when batching is active
   * - return a Float32Array  when used in deferred contexts
   */
  public translate({
    x,
    y,
    tType = 'a',
    px = 0,
    py = 0
  }: TranslateMethodProps): void | Float32Array {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Normalize translation type
       * ---------------------------------------------------------------------
       * Resolve shorthand and alias forms into canonical translation types.
       */
      //   tType = tType == 'c' || tType == 'center' ? 'c' : typeCheck(tType);

      /* ---------------------------------------------------------------------
       * STEP 2: Validate parameter types
       * ---------------------------------------------------------------------
       * Ensure all translation inputs conform to the expected type contracts.
       */
      parameterTypeValidator({ x, y, tType, px, py }, propTypes, {}, {}, '');

      /* ---------------------------------------------------------------------
       * STEP 3: Resolve pivot coordinates for absolute or center translation
       * ---------------------------------------------------------------------
       * When translation depends on shape geometry, compute the pivot
       * point using the current bounding box.
       */
      //       if (
      //         tType == 'a' ||
      //         tType == 'absolute' ||
      //         tType == 'c' ||
      //         tType == 'center'
      //       ) {
      //         const obb = this.getBBox(false) as {
      //           x: number;
      //           y: number;
      //           width: number;
      //           height: number;
      //         };
      //
      //         (tType == 'a' || tType == 'absolute') && ([px, py] = [obb.x, obb.y]);
      //
      //         (tType == 'c' || tType == 'center') &&
      //           ([px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2]);
      //       }
      //
      [px, py] = resolvePivots(tType, this.#geometry?.bounds as Float32Array);

      /* ---------------------------------------------------------------------
       * STEP 4: Generate translation matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the translation
       * transformation.
       */
      resetMatrix(this.#tempMatrix);
      translate({ x, y, tType, px, py, oMatrix: this.#tempMatrix });

      /* ---------------------------------------------------------------------
       * STEP 5: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */

      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#tempMatrix
      }) as Float32Array | void;
    } catch (e) {
      // Propagate errors without interception to preserve original semantics
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ SCALE METHOD  +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a scaling transformation to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method computes and applies a scale transform by:
   * - validating input parameters
   * - resolving the scaling reference type
   * - computing pivot coordinates when required
   * - generating a scaling transformation matrix
   * - routing the transformation through batching or immediate finalization
   *
   * It serves as the public entry point for scale operations.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Scaling often depends on the shape’s geometry, especially when performed
   * relative to its center or bounding region.
   *
   * This method provides a consistent and validated interface for scaling
   * while integrating seamlessly with batching, animation, and transform
   * composition pipelines.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Parameters must conform to expected type contracts
   * - Scaling reference type must be normalized
   * - Pivot coordinates must be resolved before matrix generation
   * - Transformation must go through the unified finalization pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param sx       - Scaling factor along the x-axis.
   * @param sy       - Scaling factor along the y-axis.
   * @param tType    - Scaling type (absolute or relative).
   * @param px       - Pivot x-coordinate used for scaling.
   * @param py       - Pivot y-coordinate used for scaling.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Depending on the execution context:
   * - returns `void` when batching is active
   * - return a Float32Array  when used in deferred contexts
   */
  public scale({
    sx,
    sy,
    tType = 'a',
    px = 0,
    py = 0
  }: ScaleMethodProps): void | Float32Array {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Normalize scaling type
       * ---------------------------------------------------------------------
       * Resolve shorthand and alias forms into canonical scaling types.
       */
      // tType = typeCheck(tType);

      /* ---------------------------------------------------------------------
       * STEP 2: Validate parameter types
       * ---------------------------------------------------------------------
       * Ensure all scale inputs conform to the expected type contracts.
       */
      parameterTypeValidator({ sx, sy, tType, px, py }, propTypes, {}, {}, '');

      /* ---------------------------------------------------------------------
       * STEP 3: Resolve pivot coordinates for absolute scaling
       * ---------------------------------------------------------------------
       * When scaling is absolute, the pivot is derived from the shape’s
       * bounding box center.
       */
      //       if (tType == 'a' || tType == 'absolute') {
      //         const obb = this.getBBox(false) as {
      //           x: number;
      //           y: number;
      //           width: number;
      //           height: number;
      //         };
      //
      //         [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      //       }
      [px, py] = resolvePivots(tType, this.#geometry?.bounds as Float32Array);
      /* ---------------------------------------------------------------------
       * STEP 4: Generate scaling matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the scale
       * transformation.
       */
      resetMatrix(this.#tempMatrix);
      scale({ sx, sy, tType, px, py, oMatrix: this.#tempMatrix });

      /* ---------------------------------------------------------------------
       * STEP 5: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#tempMatrix
      }) as Float32Array | void;
    } catch (e) {
      // Preserve original error semantics
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ ROTATE METHOD +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a rotation transformation to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method computes and applies a rotation transform by:
   * - validating input parameters
   * - normalizing the rotation angle
   * - resolving the rotation reference type
   * - computing pivot coordinates when required
   * - generating a rotation transformation matrix
   * - routing the transformation through batching or immediate finalization
   *
   * It serves as the public entry point for rotation operations.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Rotation frequently depends on the shape’s geometry, especially when
   * performed around its center or another reference point.
   *
   * This method provides a consistent, validated interface for rotation
   * while integrating seamlessly with batching, animation, and transform
   * composition pipelines.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Parameters must conform to expected type contracts
   * - Rotation angle is normalized to a bounded range
   * - Pivot coordinates must be resolved before matrix generation
   * - Transformation must go through the unified finalization pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param angle    - Rotation angle in degrees.
   * @param tType    - Rotation type (absolute or relative).
   * @param px       - Pivot x-coordinate used for rotation.
   * @param py       - Pivot y-coordinate used for rotation.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Depending on the execution context:
   * - returns `void` when batching is active
   * - return a Float32Array  when used in deferred contexts
   */
  public rotate({
    angle,
    tType = 'a',
    px = 0,
    py = 0
  }: RotateMethodProps): void | Float32Array {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Normalize rotation type
       * ---------------------------------------------------------------------
       * Resolve shorthand and alias forms into canonical rotation types.
       */
      //  tType = typeCheck(tType);

      /* ---------------------------------------------------------------------
       * STEP 2: Validate parameter types
       * ---------------------------------------------------------------------
       * Ensure all rotation inputs conform to the expected type contracts.
       */
      parameterTypeValidator({ angle, tType, px, py }, propTypes, {}, {}, '');

      /* ---------------------------------------------------------------------
       * STEP 3: Normalize rotation angle
       * ---------------------------------------------------------------------
       * Constrain the rotation angle to a standard 0–360 degree range
       * to avoid unbounded accumulation.
       */
      angle = angle % 360;
      [px, py] = resolvePivots(tType, this.#geometry?.bounds as Float32Array);
      /* ---------------------------------------------------------------------
       * STEP 4: Resolve pivot coordinates for absolute rotation
       * ---------------------------------------------------------------------
       * When rotation is absolute, the pivot is derived from the shape’s
       * bounding box center.
       */
      //       if (tType == 'a' || tType == 'absolute') {
      //         const obb = this.getBBox(false) as {
      //           x: number;
      //           y: number;
      //           width: number;
      //           height: number;
      //         };
      //
      //         [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      //       }
      [px, py] = resolvePivots(tType, this.#geometry?.bounds as Float32Array);
      /* ---------------------------------------------------------------------
       * STEP 5: Generate rotation matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the rotation
       * transformation.
       */
      resetMatrix(this.#tempMatrix);
      rotate({ angle, tType, px, py, oMatrix: this.#tempMatrix });

      /* ---------------------------------------------------------------------
       * STEP 6: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#tempMatrix
      }) as Float32Array | void;
    } catch (e) {
      // Preserve original error semantics
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ SKWE METHOD  +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a skew (shear) transformation to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method computes and applies a skew transform by:
   * - validating input parameters
   * - normalizing skew angles
   * - resolving the skew reference type
   * - computing pivot coordinates when required
   * - generating a skew transformation matrix
   * - routing the transformation through batching or immediate finalization
   *
   * It serves as the public entry point for skew operations.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Skewing alters the shape by shearing it along one or both axes, which often
   * requires a well-defined pivot point and bounded angle values.
   *
   * This method provides a consistent and validated interface for skew
   * transformations while integrating seamlessly with batching, animation,
   * and transform composition pipelines.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Parameters must conform to expected type contracts
   * - Skew angles are normalized to a bounded range
   * - Pivot coordinates must be resolved before matrix generation
   * - Transformation must go through the unified finalization pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param sx       - Skew angle along the x-axis (in degrees).
   * @param sy       - Skew angle along the y-axis (in degrees).
   * @param tType    - Skew type (absolute or relative).
   * @param px       - Pivot x-coordinate used for skewing.
   * @param py       - Pivot y-coordinate used for skewing.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Depending on the execution context:
   * - returns `void` when batching is active
   * - return a Float32Array  when used in deferred contexts
   */
  public skew({
    sx,
    sy,
    tType = 'a',
    px = 0,
    py = 0
  }: SkewMethodProps): void | Float32Array {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Normalize skew type
       * ---------------------------------------------------------------------
       * Resolve shorthand and alias forms into canonical skew types.
       */
      // tType = typeCheck(tType);

      /* ---------------------------------------------------------------------
       * STEP 2: Validate parameter types
       * ---------------------------------------------------------------------
       * Ensure all skew inputs conform to the expected type contracts.
       */
      parameterTypeValidator({ sx, sy, tType, px, py }, propTypes, {}, {}, '');

      /* ---------------------------------------------------------------------
       * STEP 3: Normalize skew angles
       * ---------------------------------------------------------------------
       * Constrain skew angles to a bounded 0–360 degree range to prevent
       * unbounded accumulation.
       */
      [sx, sy] = [sx % 360, sy % 360];

      /* ---------------------------------------------------------------------
       * STEP 4: Resolve pivot coordinates for absolute skew
       * ---------------------------------------------------------------------
       * When skew is absolute, the pivot is derived from the shape’s
       * bounding box center.
       */
      //       if (tType == 'a' || tType == 'absolute') {
      //         const obb = this.getBBox(false) as {
      //           x: number;
      //           y: number;
      //           width: number;
      //           height: number;
      //         };
      //
      //         [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      //       }
      [px, py] = resolvePivots(tType, this.#geometry?.bounds as Float32Array);
      /* ---------------------------------------------------------------------
       * STEP 5: Generate skew matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the skew
       * transformation.
       */
      resetMatrix(this.#tempMatrix);
      skew({ sx, sy, tType, px, py, oMatrix: this.#tempMatrix });

      /* ---------------------------------------------------------------------
       * STEP 6: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#tempMatrix
      }) as Float32Array | void;
    } catch (e) {
      // Preserve original error semantics
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ METHOD  to applying combine T matrix via transform method +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a sequence of parsed transformation instructions to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method iterates over a list of pre-parsed transformation descriptors
   * and invokes the corresponding transformation methods on the shape.
   *
   * It acts as an execution layer that bridges declarative transformation
   * data with imperative transformation APIs.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Transformations may be defined in a declarative or parsed form
   * (e.g. animation timelines, command sequences, serialized transforms).
   *
   * This method provides a centralized mechanism to:
   * - map parsed transformation names to concrete methods
   * - inject shared execution context (callback)
   * - execute transformations in a deterministic order
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Transformation descriptors must be pre-validated before execution
   * - Transformation methods must exist on the shape instance
   * - Execution order must be preserved
   * - Callback must be consistently passed to each transformation
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param TranslateOptions - Ordered list of parsed transformation descriptors.
   * @param callback         - Callback invoked by each transformation during execution.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * This method does not return a value. Transformations are applied as side effects.
   */
  #applyTransformations(TranslateOptions: ParsedDaTa[]): void {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Iterate over transformation descriptors
       * ---------------------------------------------------------------------
       * Process each parsed transformation in the order provided to ensure
       * deterministic application.
       */
      for (let index = 0; index < TranslateOptions.length; index++) {
        const element = TranslateOptions[index] as ParsedDaTa;

        /* -------------------------------------------------------------------
         * STEP 2: Construct execution payload
         * -------------------------------------------------------------------
         * Merge the transformation-specific data with the shared callback
         * expected by the transformation methods.
         */
        const Data = element.data;

        /* -------------------------------------------------------------------
         * STEP 3: Resolve transformation method
         * -------------------------------------------------------------------
         * Dynamically map the transformation name to the corresponding
         * method on the shape instance.
         */
        const name = element.tName as keyof Transformation;
        const method = this[name] as Function;

        /* -------------------------------------------------------------------
         * STEP 4: Invoke transformation
         * -------------------------------------------------------------------
         * Execute the resolved transformation method with the constructed
         * payload. Argument spreading is avoided to maintain strict
         * parameter expectations.
         */
        method(Data);
      }
    } catch (e) {
      // Preserve original error semantics and propagation
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ method to apply combine transformations  +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Parses and applies a sequence of transformation expressions to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method acts as a high-level transformation orchestrator by:
   * - parsing a transformation expression string
   * - validating and extracting transformation descriptors
   * - managing batching lifecycle when required
   * - delegating execution to the transformation pipeline
   *
   * It provides a compact, expressive interface for applying multiple
   * transformations in sequence.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Complex transformations are often expressed declaratively as strings
   * (e.g. animation timelines, scripting interfaces, serialized commands).
   *
   * This method bridges that declarative representation with the internal
   * imperative transformation system in a safe and deterministic way.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Input expression must follow supported transformation grammar
   * - Parsed transformation descriptors must be valid
   * - Transformation execution order must be preserved
   * - Batching lifecycle must remain consistent
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param input    - String representation of transformation expressions.
   * @param callback - Optional callback array whose first element must be a function.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Returns `this` when batching is active, otherwise returns void.
   */
  public transform(input: string): void | Float32Array {
    try {
      const isBatching = this.#isBatching;

      /* ---------------------------------------------------------------------
       * STEP 1: Normalize input and detect direct mode
       * ---------------------------------------------------------------------
       * Direct mode is indicated by a trailing 'D' character.
       */
      input.trim();
      let directMode = input[input.length - 1] === 'D' ? true : false;
      input = directMode ? input.slice(0, input.length - 1) : input;

      /* ---------------------------------------------------------------------
       * STEP 2: Extract transformation expressions
       * ---------------------------------------------------------------------
       * Match all supported transformation expressions from the input string.
       */
      const expressions = input.match(/(?:[TSHRF][^)]*)\)/g);

      if (!expressions) {
        throw new InvalidFormatError(
          input,
          'valid transformation expression sequence',
          'transformation.transform()'
        );
      }

      /* ---------------------------------------------------------------------
       * STEP 3: Parse expressions into transformation descriptors
       * ---------------------------------------------------------------------
       * Convert each expression into a structured transformation descriptor.
       */
      const results: ParsedDaTa[] = [];
      let transformation = '',
        Ttype = '';

      for (const expr of expressions) {
        const parsed = parseExpression(expr.trim());

        if (parsed) {
          results.push(parsed);
          transformation += parsed.tName + ' -> ';

          'data' in parsed &&
            'tType' in parsed.data &&
            (Ttype += parsed.data.tType + ' -> ');
        } else {
          throw new InvalidArgumentError(
            'expression',
            expr,
            'valid transformation expression',
            'transformation.transform()'
          );
        }
      }

      /* ---------------------------------------------------------------------
       * STEP 4: Validate callback contract
       * ---------------------------------------------------------------------
       * The transformation pipeline requires a valid callback function.
       */
      /* -------------------------------------------------------------------
       * STEP 5: Manage batching lifecycle
       * -------------------------------------------------------------------
       * Begin batching if not already active.
       */
      !isBatching && this.beginT();

      /* -------------------------------------------------------------------
       * STEP 6: Apply parsed transformations
       * -------------------------------------------------------------------
       * Delegate execution to the transformation application pipeline.
       */
      this.#applyTransformations(results);

      /* -------------------------------------------------------------------
       * STEP 7: Finalize batching lifecycle
       * -------------------------------------------------------------------
       * End batching if it was initiated by this method.
       */
      if (!isBatching) {
        return this.endT() as Float32Array | void;
      }
    } catch (e) {
      // Preserve original error semantics and propagation
      throw e;
    }
  }
}
