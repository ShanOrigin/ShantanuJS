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
  bboxProps,
  createTransformationMatrixProps,
  FlipMethodProps,
  ParsedDaTa,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps,
  TranslateMethodProps
} from '../../types/transformations';

import type { iShape } from '../../shapes/provider/shapesTypes';
import type { transformStack } from '../../types/index';

import type {
  ICommonGeometricProperties,
  IShapeStyleProperties
} from '../../properties/common/commonProperties';

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
} from '../errors/provider/shantanuJSErrors.js';

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

import { parameterTypeValidator } from '../helpers/helpers.js';

import {
  propTypes,
  resetMatrix,
  typeCheck
} from './preBuilds/helpers/helpers.js';

/**
 * ============================================================================
 * TRANSFORMATION PRIMITIVES
 * ============================================================================
 *
 * Atomic transformation implementations.
 *
 * Each module encapsulates the logic for a single affine transformation
 * and is composed by higher-level orchestration logic.
 */

import { Flip } from './preBuilds/transformations/flip.js';
import { Rotate } from './preBuilds/transformations/rotate.js';
import { Scale } from './preBuilds/transformations/scale.js';
import { Skew } from './preBuilds/transformations/skew.js';
import { Translate } from './preBuilds/transformations/translation.js';

/**
 * ============================================================================
 * TRANSFORMATION DSL & GEOMETRY PROCESSING
 * ============================================================================
 *
 * Modules responsible for:
 * - parsing transformation expressions
 * - applying matrix math to geometry buffers
 * - computing spatial bounds in screen space
 */

import { parseExpression } from './preBuilds/transformDSL/parsingAndApply.js';
import { computeAABBPoints } from './preBuilds/boundingBoxes/axisAlignedBoundingBox.js';
import { applyTransformToHomogeneousBuffer } from './preBuilds/matrix/matrixMultiplication.js';

/**
 * ============================================================================
 * ACCESS CONTROL
 * ============================================================================
 *
 * Internal access keys and guards used to enforce controlled access
 * to engine-internal geometry and style state.
 *
 * These imports are strictly for trusted engine modules and must never
 * be exposed to userland APIs.
 */

import { assertAccess, DEV_INTERNAL_ACCESS } from '../provider/accesskeys.js';

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

export class Transformation {
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
  readonly #gModel!: iShape;

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
  readonly #style: Partial<IShapeStyleProperties>;

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
  #__batchedComposeTMatrix: DOMMatrix = new DOMMatrix();

  /**
   * Composed transformation matrix for non-batched operations.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Represents the final composed affine transformation matrix
   * derived from individual transform operations such as:
   * - translate
   * - rotate
   * - scale
   * - skew
   *
   * -------------------------------------------------------------------------
   * USAGE
   * -------------------------------------------------------------------------
   * - Used by all affine transformation methods
   * - Represents the authoritative transformation state
   *   when batching is disabled
   */
  #__composeTMatrix: DOMMatrix = new DOMMatrix();

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
  #__tempTMatrix: DOMMatrix = new DOMMatrix();

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

  constructor(gModel: iShape) {
    this.#gModel = gModel;

    this.#geometry = this.#gModel.getIGeo(DEV_INTERNAL_ACCESS);
    this.#style = this.#gModel.getIStyle(DEV_INTERNAL_ACCESS);
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
   * Resets a transformation matrix to the identity state.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Clears all accumulated transformation data from the given matrix,
   * restoring it to a neutral identity matrix.
   *
   * This is used internally to:
   * - reset composed matrices
   * - clear batched transformation state
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param mat - The DOMMatrix instance to reset.
   *              Defaults to the primary composed transformation matrix.
   */

  #resetMatrix(mat: DOMMatrix = this.#__composeTMatrix): void {
    resetMatrix(mat);
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

  public endT(): void | Float32Array {
    if (!this.#isBatching) return;

    this.#isBatching = false;

    const finalMat: Float32Array | void =
      this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__batchedComposeTMatrix
      });

    this.#resetMatrix(this.#__batchedComposeTMatrix);
    return finalMat;
  }

  /**
   * Accumulates a transformation matrix into the current batching buffer.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Composes the provided transformation matrix into the internal
   * batched transformation matrix when batching is active.
   *
   * This method affects ONLY the internal transformation buffer
   * and does NOT trigger any visual updates.
   *
   * -------------------------------------------------------------------------
   * SAFETY CHECKS
   * -------------------------------------------------------------------------
   * The operation proceeds only if:
   * - Batching mode is active
   * - The provided matrix is a valid DOMMatrix instance
   * - The internal batched matrix is valid
   *
   * Invalid input is silently ignored to preserve engine stability.
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param T - Transformation matrix to be composed into the batch buffer.
   */

  #batch__composeTMatrix(T: DOMMatrix): void {
    if (
      this.#isBatching &&
      T &&
      T instanceof DOMMatrix &&
      this.#__batchedComposeTMatrix &&
      this.#__batchedComposeTMatrix instanceof DOMMatrix
    ) {
      this.#__batchedComposeTMatrix.multiplySelf(T);
    }
  }

  /**
   * Creates a composed 2D transformation matrix from declarative transform input.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method translates a high-level transformation description into a
   * concrete 3×3 affine transformation matrix.
   *
   * It supports:
   * - selective application of scale, skew, rotate, and translate
   * - optional multiplication with an existing base matrix
   * - configurable output layout (row-major / column-major)
   * - configurable output type (Float32Array / nested arrays)
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * The transformation engine operates internally using DOMMatrix for accuracy
   * and composability.
   *
   * This method acts as a controlled export layer that:
   * - executes transformations through the engine pipeline
   * - extracts final matrix values from a single source of truth
   * - serializes the result into user-consumable formats
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - DOMMatrix is the authoritative internal representation
   * - All transformations are composed through batching
   * - No visual side-effects occur during matrix creation
   * - Output always represents a valid 3×3 affine matrix
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param transformations   Declarative transform instructions (scale, rotate, etc.)
   * @param baseTMatrix       Optional base transformation matrix
   * @param multiplyWithBase  Whether to multiply composed matrix with base
   * @param major             Matrix layout convention ('row' | 'column')
   * @param arrayType         Output representation ('float32' | 'normal')
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * A 3×3 affine transformation matrix in the requested format.
   */

  public createTransformMatrix({
    transformations,
    baseTMatrix,
    multiplyWithBase = false,
    major = 'row',
    arrayType = 'normal'
  }: createTransformationMatrixProps): Float32Array | number[][] {
    // -----------------------------------------------------------
    // STEP 1: Resolve transformation presence flags
    // -----------------------------------------------------------

    // quick flags
    const hasTransforms = !!transformations;
    const doScale =
      hasTransforms && 'scale' in transformations && transformations.scale;
    const doSkew =
      hasTransforms && 'skew' in transformations && transformations.skew;
    const doRotate =
      hasTransforms && 'rotate' in transformations && transformations.rotate;
    const doTranslate =
      hasTransforms &&
      'translate' in transformations &&
      transformations.translate;

    // -----------------------------------------------------------
    // STEP 2: Reset internal matrices and initialize batching
    // -----------------------------------------------------------

    // reset temp matrices once up-front and begin batching only if needed
    this.#resetMatrix(this.#__batchedComposeTMatrix);
    this.#resetMatrix(this.#__tempTMatrix);

    if (doScale || doSkew || doRotate || doTranslate) {
      this.beginT();

      doSkew && this.Skew(transformations.skew as SkewMethodProps);
      doScale && this.Scale(transformations.scale as ScaleMethodProps);
      doRotate && this.Rotate(transformations.rotate as RotateMethodProps);
      doTranslate &&
        this.Translate(transformations.translate as TranslateMethodProps);
    }

    // -----------------------------------------------------------
    // STEP 3: Extract composed matrix values from DOMMatrix
    // -----------------------------------------------------------

    // Extract composed matrix elements from the batched DOMMatrix (single source of truth)
    // DOMMatrix 2D properties: a, b, c, d, e, f (and m31,m32 for translation in 3x3 form)
    const composed = this.#__batchedComposeTMatrix as DOMMatrix;

    // If no transforms were applied, composed should be identity; still safe to read properties.
    let a = composed.a as number;
    let b = composed.b as number;
    let c = composed.c as number;
    let d = composed.d as number;
    let e = composed.e as number;
    let f = composed.f as number;
    let m31 = composed.m31 as number;
    let m32 = composed.m32 as number;

    // -----------------------------------------------------------
    // STEP 4: Multiply with base matrix if requested
    // -----------------------------------------------------------

    // If baseTMatrix is provided and we must multiply with base, do a 3x3 multiplication:
    // result = base * composed
    if (baseTMatrix instanceof Float32Array && multiplyWithBase) {
      // Interpret baseTMatrix as 'column' major 1D matrix

      // COLUMN-major output layout (major === 'column'):
      //  [ a, b, m31,
      //    c, d, m32,
      //    e, f, 1 ]
      //
      // We'll extract base elements consistently into baseA..baseM32 and perform base * composed.
      let ba: number,
        bb: number,
        bc: number,
        bd: number,
        be: number,
        bf: number,
        bm31: number,
        bm32: number;

      // column-major layout
      // index mapping:
      // [0]=a_b, [1]=b_b, [2]=m31_b, [3]=c_b, [4]=d_b, [5]=m32_b, [6]=e_b, [7]=f_b, [8]=1
      ba = baseTMatrix[0] as number;
      bb = baseTMatrix[1] as number;
      bm31 = baseTMatrix[2] as number;
      bc = baseTMatrix[3] as number;
      bd = baseTMatrix[4] as number;
      bm32 = baseTMatrix[5] as number;
      be = baseTMatrix[6] as number;
      bf = baseTMatrix[7] as number;

      // Build base 3x3:
      // base 3x3 matrix (row-major conceptual):
      // [ ba  bc  be ]
      // [ bb  bd  bf ]
      // [ bm31 bm32 1 ]

      // composed 3x3 matrix (row-major conceptual):
      // [ a  c  e ]
      // [ b  d  f ]
      // [ m31 m32 1 ]

      // Multiply base * composed (3x3)
      const r00 = ba * a + bc * b + be * m31;
      const r01 = ba * c + bc * d + be * m32;
      const r02 = ba * e + bc * f + be * 1;

      const r10 = bb * a + bd * b + bf * m31;
      const r11 = bb * c + bd * d + bf * m32;
      const r12 = bb * e + bd * f + bf * 1;

      const r20 = bm31 * a + bm32 * b + 1 * m31;
      const r21 = bm31 * c + bm32 * d + 1 * m32;
      //const r22 = bm31 * e + bm32 * f + 1 * 1;

      // Now assign back to the a..f,m31,m32 in the same variable names expected later
      a = r00;
      c = r01;
      e = r02;

      b = r10;
      d = r11;
      f = r12;

      m31 = r20;
      m32 = r21;
      // r22 should be 1 (or close), ignore
    }

    // -----------------------------------------------------------
    // STEP 5: Cleanup batching state
    // -----------------------------------------------------------

    // Clean-up batching state once
    this.#resetMatrix(this.#__batchedComposeTMatrix);
    this.#resetMatrix(this.#__tempTMatrix);
    this.#isBatching = false;

    // -----------------------------------------------------------
    // STEP 6: Build output in requested format
    // -----------------------------------------------------------

    // Build output in requested format
    if (arrayType === 'float32') {
      let out!: Float32Array;

      major === 'row' &&
        (out = new Float32Array([a, c, e, b, d, f, m31, m32, 1]));
      major === 'column' &&
        (out = new Float32Array([a, b, m31, c, d, m32, e, f, 1]));

      return out;
    } else {
      // normal nested arrays
      const tM: number[][] = [];

      if (major === 'row') {
        // rows: [ [a, c, e], [b, d, f], [m31, m32, 1] ]
        tM[0] = [a, c, e];
        tM[1] = [b, d, f];
        tM[2] = [m31, m32, 1];
      } else {
        // columns interpreted as rows here: [ [a, b, m31], [c, d, m32], [e, f, 1] ]
        tM[0] = [a, b, m31];
        tM[1] = [c, d, m32];
        tM[2] = [e, f, 1];
      }
      return tM;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //++++++++++++++ Healper  Methods +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a transformation matrix to the shape's geometry buffer
   * and returns the transformed result.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method performs a matrix–geometry multiplication by:
   * - validating internal geometry availability
   * - extracting the underlying homogeneous coordinate buffer
   * - applying the provided transformation matrix
   *
   * The operation is executed against the shape’s internal geometry state
   * and may optionally mutate the buffer based on the `assign` flag.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Geometry is stored internally in homogeneous buffer form for performance
   * and mathematical correctness. Transform operations require applying a
   * DOMMatrix to this buffer in a controlled and validated manner.
   *
   * This method centralizes that logic to ensure:
   * - invariant enforcement
   * - consistent transform application
   * - isolation of low-level math operations
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Geometry must be initialized before transformation
   * - Geometry buffer must be a valid Float32Array
   * - Buffer length must be non-zero
   * - Transformation is applied via homogeneous coordinates
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param T      - Transformation matrix to apply.
   * @param assign - Whether the transformation mutates the internal buffer
   *                 or produces a derived result.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * The result of applying the transformation matrix to the geometry buffer.
   */
  public matrixProductTxM(T: DOMMatrix, assign: boolean = false) {
    if (!this.#geometry) {
      throw new InvalidInternalStateError(
        this.#geometry,
        'proper object of GraphicsModel class',
        'Cannot perform matrix multiplication.',
        'transformation.#matrixProductTxM()'
      );
    }

    const buffer = this.#geometry.buffer as Float32Array;

    if (!(buffer instanceof Float32Array) || buffer.length < 1) {
      throw new InvalidInternalStateError(
        buffer,
        'non-empty Float32Array geometry buffer',
        'Cannot perform matrix multiplication.',
        'transformation.#matrixProductTxM()'
      );
    }

    // Delegate the actual math operation to the transform utility
    return applyTransformToHomogeneousBuffer(T, buffer, assign);
  }

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
      this.#batch__composeTMatrix(transformMatrix);

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

  /**
   * Composes transformation matrices from the internal transform stack
   * into a single DOMMatrix.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method resolves the current transformation state by:
   * - reading transformation matrices from the transform stack
   * - optionally skipping composition when not required
   * - multiplying matrices in correct sequence
   * - returning a reusable DOMMatrix representing the composed result
   *
   * It serves as the single source of truth for transform composition.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Transformations may be accumulated incrementally (e.g. batching,
   * animations, chained transforms). Rendering and geometry application
   * require a single resolved matrix.
   *
   * This method performs that resolution efficiently without allocating
   * new matrix objects.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Transform stack must contain a valid base matrix at index 0
   * - Matrices are stored as homogeneous Float32Array representations
   * - Matrix multiplication order is preserved
   * - Reusable matrices are reset before use
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param required - Whether full composition of the transform stack
   *                   is required. If false, only the base transform
   *                   is returned.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * A DOMMatrix representing the composed transformation.
   */
  public composeTransforms(required = false) {
    const { stack, skip } = (
      this.#geometry as { transformStack: transformStack }
    ).transformStack;

    /* ---------------------------------------------------------------------
     * STEP 1: Reset reusable matrices
     * ---------------------------------------------------------------------
     * Ensure all scratch and composition matrices start from identity
     * before loading or multiplying transforms.
     */
    this.#resetMatrix(this.#__tempTMatrix);

    /* ---------------------------------------------------------------------
     * STEP 2: Fast-path when full composition is not required
     * ---------------------------------------------------------------------
     * If only the base transform is needed, load it directly into the
     * reusable DOMMatrix and return early.
     */
    if (!required) {
      const t = stack[0].transformMatrix as Float32Array;

      this.#resetMatrix(this.#__tempTMatrix);

      // Load base transform into reusable DOMMatrix
      this.#__tempTMatrix.a = t[0] as number;
      this.#__tempTMatrix.b = t[1] as number;
      this.#__tempTMatrix.c = t[3] as number;
      this.#__tempTMatrix.d = t[4] as number;
      this.#__tempTMatrix.e = t[6] as number;
      this.#__tempTMatrix.f = t[7] as number;

      return this.#__tempTMatrix;
    }

    /* ---------------------------------------------------------------------
     * STEP 3: Reset composition matrix for full transform resolution
     * ---------------------------------------------------------------------
     * Prepare the reusable composition matrix to accumulate transforms.
     */
    this.#resetMatrix();

    /* ---------------------------------------------------------------------
     * STEP 4: Iterate and compose active transforms
     * ---------------------------------------------------------------------
     * Sequentially load each transform matrix from the stack (excluding
     * skipped entries) and multiply it into the composition matrix.
     */
    for (let i = 1; i < stack.length - skip; i++) {
      const t = stack?.[i]?.transformMatrix as Float32Array;

      // Load current transform into scratch matrix (no allocation)
      this.#__tempTMatrix.a = t[0] as number;
      this.#__tempTMatrix.b = t[1] as number;
      this.#__tempTMatrix.c = t[3] as number;
      this.#__tempTMatrix.d = t[4] as number;
      this.#__tempTMatrix.e = t[6] as number;
      this.#__tempTMatrix.f = t[7] as number;

      // Multiply into reusable composition matrix
      this.#__composeTMatrix.multiplySelf(this.#__tempTMatrix);
    }

    /* ---------------------------------------------------------------------
     * STEP 5: Return composed transformation
     * ---------------------------------------------------------------------
     * The composition matrix now represents the cumulative transformation
     * of all active transforms.
     */
    return this.#__composeTMatrix;
  }

  /**
   * Computes the axis-aligned bounding box (AABB) of the shape
   * in screen space after applying all active transformations.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method calculates the final bounding rectangle of the shape by:
   * - transforming canonical geometry into screen space
   * - computing the axis-aligned bounds
   * - optionally expanding bounds to account for stroke width
   *
   * The result represents the visual footprint of the shape
   * after all transformations are applied.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Geometry is stored internally in canonical (local) space.
   * Rendering, hit-testing, and layout require bounds in screen space.
   *
   * This method bridges that gap in a deterministic and reusable way.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Geometry buffer is treated as immutable input
   * - Transform composition is the single source of truth
   * - Bounding box is always axis-aligned (not oriented)
   * - Stroke expansion is applied in screen space
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param includeStroke - Whether stroke width should be included
   *                        in the bounding box computation.
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * An object containing:
   * - x, y           : top-left corner of the bounding box
   * - width, height  : dimensions of the bounding box
   * - matrix         : 4-corner homogeneous representation of the AABB
   */
  public getBBox(includeStroke = true): bboxProps {
    // -----------------------------------------------------------
    // STEP 1: Validate required internal state
    // -----------------------------------------------------------

    if (!this.#geometry || !this.#style) {
      throw new InvalidInternalStateError(
        this.#geometry ?? this.#style,
        'proper object of GraphicsModel class',
        'Cannot compute bounding box.',
        'transformation.getBBox()'
      );
    }

    // -----------------------------------------------------------
    // STEP 2: Resolve stroke expansion
    // -----------------------------------------------------------

    const sw = includeStroke ? (this.#style['stroke-width'] ?? 0) / 2 : 0;

    // -----------------------------------------------------------
    // STEP 3: Extract canonical geometry and composed transform
    // -----------------------------------------------------------

    const canonical = this.#geometry.buffer as Float32Array;
    const M = this.composeTransforms(true) as DOMMatrix;

    // -----------------------------------------------------------
    // STEP 4: Transform canonical points into screen space
    // -----------------------------------------------------------

    const transformed = applyTransformToHomogeneousBuffer(M, canonical);

    // -----------------------------------------------------------
    // STEP 5: Cleanup internal transformation matrices
    // -----------------------------------------------------------

    this.#resetMatrix(this.#__composeTMatrix);
    this.#resetMatrix(this.#__tempTMatrix);

    // -----------------------------------------------------------
    // STEP 6: Compute axis-aligned bounding box (AABB)
    // -----------------------------------------------------------

    const { minX, minY, maxX, maxY } = computeAABBPoints(transformed);

    // -----------------------------------------------------------
    // STEP 7: Apply stroke expansion in screen space
    // -----------------------------------------------------------

    const x = minX - sw;
    const y = minY - sw;
    const width = maxX + sw - x;
    const height = maxY + sw - y;

    // -----------------------------------------------------------
    // STEP 8: Construct user-friendly corner matrix
    // -----------------------------------------------------------

    // Extra user-friendly 4-corner matrix (optional but valid for AABB)
    const matrix = [
      [x, y, 1],
      [x + width, y, 1],
      [x + width, y + height, 1],
      [x, y + height, 1]
    ];

    return { x, y, width, height, matrix };
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
  public Translate({
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
      tType = tType == 'c' || tType == 'center' ? 'c' : typeCheck(tType);

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
      if (
        tType == 'a' ||
        tType == 'absolute' ||
        tType == 'c' ||
        tType == 'center'
      ) {
        const obb = this.getBBox(false) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };

        (tType == 'a' || tType == 'absolute') && ([px, py] = [obb.x, obb.y]);

        (tType == 'c' || tType == 'center') &&
          ([px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2]);
      }

      /* ---------------------------------------------------------------------
       * STEP 4: Generate translation matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the translation
       * transformation.
       */
      this.#resetMatrix(this.#__tempTMatrix);
      Translate({ x, y, tType, px, py, oMatrix: this.#__tempTMatrix });

      /* ---------------------------------------------------------------------
       * STEP 5: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */

      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__tempTMatrix
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
  public Scale({
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
      tType = typeCheck(tType);

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
      if (tType == 'a' || tType == 'absolute') {
        const obb = this.getBBox(false) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };

        [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      }

      /* ---------------------------------------------------------------------
       * STEP 4: Generate scaling matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the scale
       * transformation.
       */
      this.#resetMatrix(this.#__tempTMatrix);
      Scale({ sx, sy, tType, px, py, oMatrix: this.#__tempTMatrix });

      /* ---------------------------------------------------------------------
       * STEP 5: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__tempTMatrix
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
  public Rotate({
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
      tType = typeCheck(tType);

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

      /* ---------------------------------------------------------------------
       * STEP 4: Resolve pivot coordinates for absolute rotation
       * ---------------------------------------------------------------------
       * When rotation is absolute, the pivot is derived from the shape’s
       * bounding box center.
       */
      if (tType == 'a' || tType == 'absolute') {
        const obb = this.getBBox(false) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };

        [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      }

      /* ---------------------------------------------------------------------
       * STEP 5: Generate rotation matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the rotation
       * transformation.
       */
      this.#resetMatrix(this.#__tempTMatrix);
      Rotate({ angle, tType, px, py, oMatrix: this.#__tempTMatrix });

      /* ---------------------------------------------------------------------
       * STEP 6: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__tempTMatrix
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
  public Skew({
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
      tType = typeCheck(tType);

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
      if (tType == 'a' || tType == 'absolute') {
        const obb = this.getBBox(false) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };

        [px, py] = [obb.x + obb.width / 2, obb.y + obb.height / 2];
      }

      /* ---------------------------------------------------------------------
       * STEP 5: Generate skew matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the skew
       * transformation.
       */
      this.#resetMatrix(this.#__tempTMatrix);
      Skew({ sx, sy, tType, px, py, oMatrix: this.#__tempTMatrix });

      /* ---------------------------------------------------------------------
       * STEP 6: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__tempTMatrix
      }) as Float32Array | void;
    } catch (e) {
      // Preserve original error semantics
      throw e;
    }
  }

  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //+++++++++++++ FLIP METHOD +++++++++++++++
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  /**
   * Applies a flip (mirror) transformation to the shape.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * This method computes and applies a flip transformation by:
   * - validating input parameters
   * - resolving flip directions along each axis
   * - deriving geometric bounds required for flip computation
   * - generating a flip transformation matrix
   * - routing the transformation through batching or immediate finalization
   *
   * It serves as the public entry point for flip and mirror operations.
   *
   * -------------------------------------------------------------------------
   * WHY THIS FUNCTION EXISTS
   * -------------------------------------------------------------------------
   * Flipping a shape requires knowledge of its current spatial bounds in order
   * to correctly mirror geometry around the desired axis or direction.
   *
   * This method provides a consistent, validated interface for flip operations
   * while integrating seamlessly with batching, animation, and transform
   * composition pipelines.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Parameters must conform to expected type contracts
   * - Bounding box must be resolved before flip computation
   * - Flip direction semantics must remain consistent
   * - Transformation must go through the unified finalization pipeline
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param flipX    - Whether to apply flip along the x-axis.
   * @param flipY    - Whether to apply flip along the y-axis.
   * @param dirX     - Direction indicator for x-axis flipping.
   * @param dirY     - Direction indicator for y-axis flipping..
   *
   * -------------------------------------------------------------------------
   * RETURNS
   * -------------------------------------------------------------------------
   * Depending on the execution context:
   * - returns `void` when batching is active
   * - return a Float32Array  when used in deferred contexts
   */
  public Flip({
    flipX,
    flipY,
    dirX = 'x+',
    dirY = 'y+'
  }: FlipMethodProps): void | Float32Array {
    try {
      /* ---------------------------------------------------------------------
       * STEP 1: Validate parameter types
       * ---------------------------------------------------------------------
       * Ensure all flip-related inputs conform to the expected type contracts.
       */
      parameterTypeValidator(
        { flipX, flipY, dirX, dirY },
        propTypes,
        {},
        {},
        ''
      );

      /* ---------------------------------------------------------------------
       * STEP 2: Resolve geometric bounds
       * ---------------------------------------------------------------------
       * Obtain the current bounding box to determine the spatial region
       * around which the flip transformation will be applied.
       */
      const { x, y, width, height } = this.getBBox() as {
        height: number;
        width: number;
        x: number;
        y: number;
      };

      /* ---------------------------------------------------------------------
       * STEP 3: Generate flip matrix
       * ---------------------------------------------------------------------
       * Reset the reusable matrix and populate it with the flip
       * transformation based on direction and bounds.
       */
      this.#resetMatrix(this.#__tempTMatrix);
      Flip({
        flipX,
        flipY,
        dirX,
        dirY,
        x,
        y,
        width,
        height,
        oMatrix: this.#__tempTMatrix
      });

      /* ---------------------------------------------------------------------
       * STEP 4: Route transformation through batching or finalization
       * ---------------------------------------------------------------------
       * Delegate to the batching/finalization handler to ensure consistent
       * transformation lifecycle handling.
       */
      return this.#batchingAndFinalizeTransformHandler({
        transformMatrix: this.#__tempTMatrix
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
