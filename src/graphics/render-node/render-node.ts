import type { ValidGraphicsShapes } from '../../models/types/graphics-model';
import type {
  GraphicsRenderNode,
  IRenderNode
} from '../../models/interfaces/render-node';

import type {
  TranslateMethodProps,
  ScaleMethodProps,
  RotateMethodProps,
  SkewMethodProps,
  BaseTransformationMeta
} from '../../models/types/geometry/transform';

import type { BboxProps } from '../../models/types/geometry/types';

import type {
  GraphicsNode,
  GetInternalGraphicsAccessor,
  GetParentAccessor
} from '../../models/interfaces/graphics-container';
import type {
  InternalGeometryAccessor,
  InternalStyleAccessor,
  InternalComputedStyleAccessor
} from '../../models/types/graphics-model';
import type {
  TransformStack,
  AttrsMethodPropsTypes,
  AttrsMethodReturnTypes
} from '../../models/types/common';

import type { ComponentsRegistry } from '../../models/types/components';
import type { IAnimationOptions } from '../../models/types/animation/options';
import type { IAnimation } from '../../models/interfaces/animation';
import type { Handler, SupportedEvents } from '../../models/interfaces/event';

type GraphicsNodeWithInternalAccessMethods = GraphicsNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  InternalComputedStyleAccessor &
  GetInternalGraphicsAccessor &
  GetParentAccessor;

type GraphicsRenderNodeWithInternals = GraphicsRenderNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  GetInternalGraphicsAccessor;

import { GraphicsModel } from '../../core/graphics-model/graphics-model.js';

import {
  assertAccess,
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_COMPUTED_STYLE_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  GET_PARENT_METHOD
} from '../../internal/keys/dev-keys.js';

import {
  GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD,
  RESTORE_DIMENSION_METHOD,
  UPDATE_ANIMATION_METHOD,
  UPDATE_TRANSFORM_METHOD
} from '../../internal/keys/render-node-keys.js';
import {
  InvalidInternalStateError,
  OperationInProgressError
} from '../../errors/index.js';

import { Warn, Log } from '../../utils/helpers/helpers.js';

import {
  GraphicalElementProperties,
  type IGraphicalElementProperties
} from '../../property-definitions/specific/specific-properties.js';
import { AllGShapeStyleProperties } from '../../property-definitions/common/common-properties.js';

import { composeAffineTransformations } from '../../utils/math/affine/affine-composition.js';
import {
  affineMatrixMultiply,
  applyTransformToHomogeneousBuffer
} from '../../utils/math/matrix/matrix-multiplication.js';

import { Transformation } from '../../components/transformation/transformation.js';
import { Animation } from '../../components/animation/animation.js';
import { EventTargets } from '../../components/event/event-target.js';

export abstract class RenderNode<T extends ValidGraphicsShapes>
  extends GraphicsModel<T>
  implements IRenderNode<T>
{
  /**
   * Internal reference to the geometry state from base class.
   *
   * Source:
   * - Retrieved via privileged access (`getIGeo`)
   *
   * Purpose:
   * - Enables direct mutation/control of geometric properties
   * - Used by transformation and animation systems
   *
   * Invariant:
   * - Must remain synchronized with base class geometry
   *
   * Critical Warning:
   * - This bypasses readonly proxy protection
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Filter module instance.
   *
   * Relationship:
   * - Composition ("has-a" relationship)
   *
   * Responsibilities:
   * - Applies visual effects to the rendering element
   * - Handles filter operations such as blur, shadow, gradients, and advanced effects
   * - Acts as the execution layer for all filter-related methods
   *
   * Lifecycle:
   * - Instantiated during entity initialization
   * - Reused across all filter operations
   *
   * Invariant:
   * - Single filter instance is maintained per entity
   * - Does not manage filter state internally (stateless execution)
   */
  // #filter: Filter = new Filter(this);

  /**
   * Internal flag to track animation execution state.
   *
   * Purpose:
   * - Prevents concurrent animation execution
   * - Ensures only one animation runs at a time
   *
   * Behavior:
   * - `true` → animation currently active
   * - `false` → no active animation
   *
   * Design Note:
   * - Acts as a lightweight concurrency control mechanism
   */
  #isAnimation: boolean = false;

  /**
   * Internal class-level properties related to interaction and selection.
   *
   * Structure:
   * - `selectable` → whether entity can be selected
   * - `hasCanvasSelectable` → whether canvas-level selection is enabled
   *
   * Purpose:
   * - Future extension for interaction systems
   * - Enables integration with selection engines or UI systems
   *
   * Default State:
   * - All flags disabled
   *
   * Access:
   * - Private (exposed via controlled accessor)
   */
  #classProp: {
    selectable: boolean;
    hasCanvasSelectable: boolean;
  } = {
    selectable: false,
    hasCanvasSelectable: false
  };

  #components = {} as ComponentsRegistry;
  /**
   * Constructs a new GraphicsEntity instance.
   *
   * Initialization Flow:
   * 1. Delegates base initialization to `EventTarget`
   * 2. Instantiates transformation module
   * 3. Retrieves internal rendering reference (`#fig`)
   *
   * @param shape - Shape identifier (generic type T)
   * @param id - Unique identifier for the entity
   *
   * Side Effects:
   * - Initializes transformation system
   * - Establishes internal references to base class state
   *
   * Invariants Established:
   * - `#transform` is initialized
   * - `#fig` reference is synchronized with base class
   */
  constructor(shape: T, id: string) {
    /**
     * Initialize base graphical model and event system.
     */
    super(shape, id);
  }

  /**
   * Provides privileged access to internal class-level properties.
   *
   * Access Control:
   * - Requires valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * @param accessKey - Symbol used for access validation
   *
   * @returns Internal class property object
   *
   * @throws {Error} If accessKey validation fails
   *
   * Security Model:
   * - Prevents unauthorized mutation of internal interaction flags
   *
   * Critical Warning:
   * - Returned object is mutable
   * - Caller must ensure integrity of state
   */
  protected getClassProps(accessKey: symbol) {
    assertAccess(accessKey);

    return this.#classProp;
  }

  /**
   * ============================================================================
   * ABSTRACT METHODS (SHAPE-SPECIFIC CONTRACT LAYER)
   * ============================================================================
   *
   * These methods define the mandatory implementation contract for all concrete
   * graphical entities.
   *
   * Each subclass (e.g., Rect, Ellipse, Path) must provide its own:
   * - Matrix generation logic
   * - Dimension restoration logic
   * - Matrix validation logic
   *
   * These methods collectively define the **shape-specific behavior layer** of the system.
   *
   * Access Control:
   * - All methods require `accessKeys` (symbol-based privileged access)
   * - Enforced via internal access control system (`assertAccess`)
   *
   * Design Principle:
   * - Core engine defines structure
   * - Subclasses define behavior
   *
   * ============================================================================
   */

  /**
   * Generates the transformation matrix representation for the specific shape.
   *
   * Responsibility:
   * - Constructs or updates the internal transformation matrix based on:
   *   - Shape geometry
   *   - Current transformation state
   *   - Shape-specific rules
   *
   * Expected Behavior:
   * - Reads geometric properties from internal state
   * - Computes transformation matrix (Float32Array-based)
   * - Updates internal transformation stack or buffer
   *
   * @param accessKeys - Symbol used for privileged access validation
   *
   * @returns void
   *
   * @throws {Error} If access validation fails or matrix computation is invalid
   *
   * Invariants:
   * - Must produce a valid transformation matrix compatible with rendering pipeline
   * - Matrix must align with shape-specific geometry definition
   *
   * Implementation Requirements:
   * - Must be deterministic (same input → same output)
   * - Must not mutate unrelated state
   *
   * Example:
   * - Rect → matrix based on x, y, width, height
   * - Ellipse → matrix based on rx, ry, cx, cy
   *
   * Critical Note:
   * - This method is part of the rendering pipeline preparation phase
   */
  protected abstract generateMatrix(accessKeys: symbol): void;

  /**
   * Updates the shape's cached geometry data from a renderer-provided
   * axis-aligned bounding box (AABB).
   *
   * This method is intended to be invoked exclusively by renderer
   * implementations whenever a geometry update occurs. During the
   * geometry update phase, the renderer computes the most accurate
   * bounding box it can for the shape and passes it to this method.
   *
   * Renderers that cannot determine a bounding box for a particular
   * shape should pass `null`, in which case no cached geometry data
   * is modified.
   *
   * Depending on the value of `setCMatrix`, this method may also update
   * the shape's canonical matrix. This is primarily intended for shapes
   * whose canonical geometry cannot be reconstructed from their logical
   * data alone (for example, paths, text, polygons, or lines).
   *
   * The caller is responsible for ensuring that canonical matrix updates
   * are only requested for compatible geometry buffers. Shapes with
   * incompatible canonical layouts (for example, a point represented by
   * a single homogeneous coordinate) must not enable this option.
   *
   * @param bbox Renderer-computed axis-aligned bounding box, or `null`
   * if no bounding box can be determined.
   * @param setCMatrix Whether the canonical matrix should be regenerated
   * from the supplied bounding box.
   * @param accessKey Internal access key used to restrict invocation to
   * trusted engine and renderer components.
   */
  [GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD](
    bbox: DOMRect | null,
    setCMatrix: boolean,
    accessKey: symbol
  ) {
    assertAccess(accessKey);

    if (!bbox) return;

    const { x: minX, y: minY, width, height } = bbox;

    const maxX = minX + width;
    const maxY = minY + height;

    if (setCMatrix && this.#geometry!.buffer) {
      (this.#geometry!.buffer as Float32Array).set(
        [minX, minY, 1, maxX, minY, 1, maxX, maxY, 1, minX, maxY, 1],
        0
      );
    }

    if (this.#geometry!.bounds) {
      (this.#geometry!.bounds as Float32Array).set([minX, minY, maxX, maxY], 0);
    }
  }

  /**
   * Restores geometric dimensions of the shape from a given transformation state.
   *
   * Responsibility:
   * - Converts transformation matrix/state back into shape-specific dimensions
   * - Used for reverse-mapping transformations (e.g., scaling, rotation adjustments)
   *

   * @param temporaryState - Transformation state (typically matrix representation)

   * @returns void
   *
   * @throws {Error} If access validation fails or restoration logic is invalid
   *
   * Behavior:
   * - Interprets `temporaryState` (Float32Array)
   * - Extracts relevant transformation components
   * - Updates geometry properties accordingly
   *
   * Invariants:
   * - Restored dimensions must remain consistent with shape definition
   * - No invalid geometric state should be produced
   *
   * Modes:
   * - `basic = true`:
   *   → minimal restoration (approximation or partial update)
   *
   * - `basic = false | undefined`:
   *   → full restoration (precise dimension reconstruction)
   *
   * Implementation Requirements:
   * - Must correctly invert transformation effects
   * - Must preserve shape integrity
   *
   * Example:
   * - Rect → derive width/height after scaling
   * - Ellipse → recompute radii after transformation
   *
   * Critical Note:
   * - This is effectively the inverse of `generateMatrix`
   */
  protected abstract restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ): void;

  [RESTORE_DIMENSION_METHOD](key: symbol, temporaryState: Float32Array): void {
    assertAccess(key);
    this.restoreDimension(key, temporaryState);
  }
  /**
   * Validates whether a given matrix (or set of matrices) is valid for the shape.
   *
   * Responsibility:
   * - Ensures transformation matrices conform to shape-specific constraints
   * - Prevents invalid or corrupted transformation states
   *
   * @param accessKeys - Symbol used for privileged access validation
   * @param matrix - Array of transformation matrices to validate
   * @param outputn - Optional flag to control output format
   *
   * @returns
   * - `boolean` → validity status
   * - `number[]` → extracted/processed values
   * - `number` → scalar validation result (e.g., determinant, scale factor)
   *
   * @throws {Error} If access validation fails or matrix structure is invalid
   *
   * Behavior:
   * - Iterates through provided matrices
   * - Applies shape-specific validation rules
   * - Optionally extracts meaningful values
   *
   * Invariants:
   * - Must reject matrices that violate shape constraints
   * - Must not allow invalid transformations into system
   *
   * Output Modes:
   * - `outputn = false | undefined`:
   *   → returns boolean (valid / invalid)
   *
   * - `outputn = true`:
   *   → returns computed values (e.g., normalized parameters)
   *
   * Implementation Requirements:
   * - Must be consistent with `generateMatrix`
   * - Must align with `restoreDimension`
   *
   * Example:
   * - Rect → ensure no skew if not supported
   * - Ellipse → validate radius constraints
   *
   * Critical Note:
   * - This method is a **safety gate** for transformation integrity
   */
  /*
  protected abstract validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[],
    outputn?: boolean
  ): boolean | number[] | number;
*/

  #flattenTransforms(
    applyUserParams: Function,
    userParams: Record<string, string | number>
  ) {
    if (__DEV__) {
      Log('in flatten transform func');
    }

    const geo = this.#geometry as {
      transformStack: TransformStack;
      buffer: Float32Array;
    };

    /**
     * Step 1: Compose full transformation stack into a single matrix.
     */
    const affineComposedMatrix = composeAffineTransformations(
      geo.transformStack,
      true
    );

    /**
     * Step 2: Apply composed matrix to local geometry buffer.
     *
     * Result:
     * - Geometry transformed into world-space coordinates
     */
    applyTransformToHomogeneousBuffer(affineComposedMatrix, geo?.buffer, true);
    /**
     * Step 3: Convert transformed buffer into parametric representation.
     *
     * Delegates to shape-specific logic.
     */
    this.restoreDimension(DEV_INTERNAL_ACCESS_KEY, geo.buffer);

    /**
     * Step 4: Apply user-provided parameter updates.
     *
     * - Forces transform reset (`transform: ''`)
     * - Ensures no residual transformation is reintroduced
     */
    applyUserParams({ ...userParams, transform: '' });

    /**
     * Step 5: Regenerate canonical geometry matrix from updated parameters.
     */
    this.generateMatrix(DEV_INTERNAL_ACCESS_KEY);

    /**
     * Step 6: Reset transformation stack to identity.
     */
    /**
     * Clear all transformation entries except base.
     */
    geo.transformStack.stack.length = 1;

    /**
     * Assign identity matrix to base transformation.
     */
    (geo.transformStack.stack[0] as Float32Array).set(
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      0
    );
  }

  /**
   * Overrides the base `attrs` method to introduce shape-aware validation,
   * transformation flattening, and parametric control.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * This method extends the base attribute system with:
   * - Shape-specific validation (`parameterTypeValidator`)
   * - Separation of geometry and style domains
   * - Conditional transformation flattening for geometry updates
   * - Automatic matrix regeneration
   *
   * ============================================================================
   * BEHAVIOR MODES
   * ============================================================================
   *
   * 1. INITIALIZATION MODE
   *    Trigger:
   *      - `props.initial === true`
   *
   *    Behavior:
   *      - Applies attributes directly via base class
   *      - Skips validation and flattening
   *      - Regenerates matrix immediately
   *
   *    Use Case:
   *      - First-time shape setup
   *      - Internal system initialization
   *
   *
   * 2. STANDARD MUTATION MODE
   *    Trigger:
   *      - `props` is an object (without `initial`)
   *
   *    Behavior:
   *      - Validates properties against shape definitions
   *      - Separates properties into:
   *          → Geometry (`g`)
   *          → Style (`s`)
   *      - Applies style properties directly
   *      - Applies geometry properties via flattening pipeline
   *
   *
   * 3. GETTER MODE
   *    Trigger:
   *      - `props` is a string
   *
   *    Behavior:
   *      - Delegates to base `attrs`
   *      - Returns result if available
   *
   * ============================================================================
   * @param props
   * - Object → setter mode
   * - String → getter mode
   *
   * @returns
   * - Getter mode → value or array
   * - Setter mode → void (undefined)
   *
   * ============================================================================
   * VALIDATION PIPELINE
   * ============================================================================
   *
   * - `parameterTypeValidator` ensures:
   *   - Property belongs to shape domain
   *   - Property type is valid
   *   - Property respects class-level constraints
   *
   * ============================================================================
   * DOMAIN SEPARATION
   * ============================================================================
   *
   * Properties are split into:
   *
   * - Geometry (`g`)
   *   → affects shape structure
   *   → triggers flattening
   *
   * - Style (`s`)
   *   → affects visual appearance
   *   → applied directly
   *
   * Special Case:
   * - Rect:
   *   - `rx`, `ry` treated as style properties
   *
   * ============================================================================
   * TRANSFORMATION HANDLING
   * ============================================================================
   *
   * Geometry updates:
   *
   *   → invoke `#flattenTransforms`
   *
   * This ensures:
   * - Existing transforms are collapsed into geometry
   * - New geometry is applied in canonical space
   * - Transform stack is reset
   *
   * ============================================================================
   * MATRIX REGENERATION
   * ============================================================================
   *
   * - Always triggered after initialization mode
   * - Triggered indirectly after flattening
   *
   * ============================================================================
   * SIDE EFFECTS
   * ============================================================================
   *
   * - Mutates geometry and/or style
   * - May collapse transformation stack
   * - Regenerates shape matrix
   * - Updates rendering state
   *
   * ============================================================================
   * FAILURE MODES
   * ============================================================================
   *
   * - Undefined shape → throws error
   * - Invalid property → validator throws
   * - Invalid transformation → flattening corruption
   *
   * ============================================================================
   * CRITICAL INVARIANTS
   * ============================================================================
   *
   * - Geometry must remain consistent after mutation
   * - Transform stack must be reset after flattening
   * - Style mutations must not affect geometry integrity
   *
   * ============================================================================
   * DESIGN INTENT
   * ============================================================================
   *
   * This method acts as:
   *
   *   → Shape-aware mutation controller
   *   → Transformation normalization gateway
   *   → Validation enforcement layer
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Geometry updates are destructive to transform history
   * - Partial mutation possible if error occurs mid-processing
   * - No transactional rollback mechanism
   */

  public override attrs(
    props: AttrsMethodPropsTypes<T> | string | string[]
  ): AttrsMethodReturnTypes {
    try {
      /**
       * Validate shape existence.
       */
      const shape = this.#geometry?.shape;
      if (!shape || shape == '') {
        throw new Error('Shape is not difined');
      }
      /**
       * Retrieve shape-specific property registries.
       */
      const geometryProps =
        GraphicalElementProperties[shape as keyof IGraphicalElementProperties];
      /**
       * ============================
       * SETTER MODE
       * ============================
       */
      if (typeof props === 'object') {
        /**
         * Initialization mode:
         * - Bypasses validation and flattening
         */
        if ('initial' in props && props.initial) {
          delete props.initial;

          /**
           * Apply properties directly.
           */
          super.attrs(props);

          /**
           * Generate canonical matrix.
           */
          this.generateMatrix(DEV_INTERNAL_ACCESS_KEY);
        } else {
          /**
           * Step 1: Validate input properties.
           */

          /*
          parameterTypeValidator(
            props,
            GraphicalElementProperties,
            AllGShapeStyleProperties,
            this.#classProp,
            shape
          );
					*/

          const styleProps =
            AllGShapeStyleProperties[
              shape as keyof typeof AllGShapeStyleProperties
            ];

          /**
           * Containers for separated properties.
           */
          const g: Record<string, number | string> = {};
          const s: Record<string, string | number | undefined> = {};

          /**
           * Step 2: Split properties into geometry and style domains.
           */
          for (const key in props) {
            if (key in geometryProps) {
              const k = key as keyof typeof geometryProps;
              g[k] = props[k];
            } else if (key in styleProps) {
              const k = key as keyof typeof styleProps;
              s[k] = (props as Record<string, string | number>)[k];
            }
          }

          /**
           * Special case: Rect shape handling.
           * - `rx`, `ry` treated as style instead of geometry
           */
          if (shape === 'rect') {
            'rx' in g && ((s['rx'] = g['rx']), delete g['rx']);
            'ry' in g && ((s['ry'] = g['ry']), delete g['ry']);
          }

          /**
           * Step 3: Apply style properties directly.
           */
          super.attrs(s);

          /**
           * Step 4: Apply geometry properties via flattening.
           *
           * Only executed if geometry updates exist.
           */
          Object.keys(g).length > 0 &&
            this.#flattenTransforms(super.attrs.bind(this), g);

          /**
           * Final state:
           * - Geometry updated
           * - Transform stack reset (if flattening occurred)
           * - Style applied
           */
          this.#geometry!.renderUpdateType = 'LOCAL';
        }
      } else if (typeof props === 'string' || Array.isArray(props)) {
        /**
         * ============================
         * GETTER MODE
         * ============================
         */
        const isThereGeometryParameter =
          Array.isArray(props) && props.some((p) => p in geometryProps);

        if (isThereGeometryParameter) {
          // trigger lazy query synchronization first
          this.#lazyQuerySynchronization();
        }

        let result = super.attrs(props);

        /**
         * Return result if available.
         */

        return result;
      }

      /**
       * Default return for setter mode.
       */
      return undefined;
    } catch (e) {
      /**
       * Transparent error propagation.
       */
      throw e;
    }
  }

  /**
   * Registers a transformation into the transform stack.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Accepts incoming transformation matrix
   * - Appends transform into stack for later composition
   * - Marks geometry as requiring recomputation
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Validate incoming matrix
   * 2. Push transform into `transformStack`
   * 3. Mark `dirty` and `worldDirty` flags
   *
   * ============================================================================
   * @param transformMatrix
   * - Float32Array → transformation matrix to register
   *
   * @param transformName
   * - Identifier for transform tracking/debugging
   *
   * @param transformType
   * - Classification of transform (e.g., 'batched', 'immediate')
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Transform stack accumulates all local transforms
   * - Composition is deferred to engine phase
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Does NOT perform composition
   * - Only mutates stack and invalidation flags
   */
  #finalizeTransform(transformMatrix: Float32Array) {
    const geo = this.#geometry as {
      localDirty: boolean;
      worldDirty: boolean;
      transformStack: TransformStack;
    };
    const stack = geo.transformStack.stack;

    stack.push(transformMatrix);

    geo.localDirty = true;
    geo.worldDirty = true;
  }

  /**
   * Composes and updates the local transformation matrix.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Resolves full local transformation stack
   * - Produces a single composed matrix
   * - Stores result as local base matrix
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Compose all transforms from `transformStack`
   * 2. Extract affine components from DOMMatrix
   * 3. Write values into base `localMatrix`
   *
   * ============================================================================
   * @param key
   * - Internal access control token
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - `stack[0].transformMatrix` always holds latest composed matrix
   * - Composition affects only local transform (no parent influence)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Must be invoked by engine before world resolution
   * - Uses DOMMatrix as composition backend
   */

  [UPDATE_TRANSFORM_METHOD](key: symbol): void {
    assertAccess(key);

    this.#resolveLocalMatrix();
  }

  /**
   * Computes the bounding box of the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Returns spatial bounds of the transformed geometry
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Delegates computation to transformation module
   * - Accounts for applied transformations
   *
   * ============================================================================
   * @param includeStroke
   * - `true` → includes stroke width in bounds (default)
   * - `false` → geometry-only bounds
   *
   * @returns Bounding box representation (implementation-dependent)
   */
  //   public getBBox(includeStroke: boolean = true) {
  //     return this.#transformComponent.getBBox(includeStroke);
  //   }

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
  public getBBox(includeStroke = true): BboxProps {
    // -----------------------------------------------------------
    // STEP 1: Validate required internal state
    // -----------------------------------------------------------

    if (!this.#geometry) {
      throw new InvalidInternalStateError(
        this.#geometry,
        'proper object of GraphicsModel class',
        'Cannot compute bounding box.',
        'transformation.getBBox()'
      );
    }

    this.#lazyQuerySynchronization();

    // -----------------------------------------------------------
    // STEP 2: Resolve stroke expansion
    // -----------------------------------------------------------

    let sw = includeStroke ? (this.style['stroke-width'] ?? 0) / 2 : 0;

    // -----------------------------------------------------------
    // STEP 6: Compute axis-aligned bounding box (AABB)
    // -----------------------------------------------------------

    const [minX, minY, maxX, maxY] = this.#geometry.bounds as Float32Array;

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

  #lazyQuerySynchronization() {
    this.#resolveLocalMatrix();
    this.#resolveWorldRecursive(this as GraphicsNodeWithInternalAccessMethods);
    this.#geometry!.renderUpdateType = 'TRANSFORM';

    const buffer = this.#geometry!.buffer as Float32Array;
    const worldMatrix = this.#geometry!.worldMatrix as Float32Array;
    const tempState = applyTransformToHomogeneousBuffer(worldMatrix, buffer);

    // restore dimension of shape
    this.restoreDimension(DEV_INTERNAL_ACCESS_KEY, tempState);
  }
  /**
   * Recursively resolves world state (transform + inherited style) for a shape.
   *
   * ============================================================================
   * PURPOSE
   * ============================================================================
   * Ensures correct hierarchical evaluation:
   *   parent → child
   *
   * Extends world resolution to include:
   * - transformation propagation (worldMatrix)
   * - styling inheritance (group → children)
   *
   * ============================================================================
   * LOGIC
   * ============================================================================
   * 1. Skip if already resolved
   * 2. Resolve parent first (if exists)
   * 3. Compute world matrix (transform propagation)
   * 4. Apply inherited style (if parent is a Group, not Canvas)
   *
   * ============================================================================
   * STYLE PROPAGATION RULES
   * ============================================================================
   * - Only Group styles propagate to children
   * - Canvas styles are NOT propagated
   * - Only inheritable style properties are applied
   * - Child-local style always overrides inherited style
   *
   * ============================================================================
   * TERMINATION GUARANTEE
   * ============================================================================
   * - worldDirty flag ensures each shape is resolved only once
   * - prevents infinite recursion (assuming no cyclic parent)
   *
   * ============================================================================
   * @param shape - Target shape to resolve
   */
  #resolveWorldRecursive(shape: GraphicsNodeWithInternalAccessMethods) {
    const geo = shape[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

    // Skip if already resolved and not dirty
    if (!geo?.worldDirty) return;

    //    const inside = shape.style.inside;

    let parent: GraphicsNodeWithInternalAccessMethods | null = null;
    /*
    if (inside) {
      const parentId = inside.slice(inside.indexOf('-') + 1);
      parent = this.#shapeIdMap.get(parentId) || null;
    }
*/
    parent = shape[GET_PARENT_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    ) as GraphicsNodeWithInternalAccessMethods;

    // Resolve parent first
    if (parent) {
      this.#resolveWorldRecursive(parent);
    }

    // -----------------------------------------------------------
    // TRANSFORM PROPAGATION
    // -----------------------------------------------------------
    this.#resolveWorldMatrix(shape, parent);

    // -----------------------------------------------------------
    // STYLE PROPAGATION (Group only, NOT Canvas)
    // -----------------------------------------------------------
    if (parent && parent.geometry?.shape === 'g') {
      this.#resolveWorldStyle(shape, parent);
    }

    geo.worldDirty = false;
  }

  /**
   * Computes inherited styling into computedStyle.
   *
   * ============================================================================
   * PURPOSE
   * ============================================================================
   * Resolves final visual style for a shape by combining:
   * - parent computed style (if parent is a Group)
   * - local style overrides
   *
   * ============================================================================
   * LOGIC
   * ============================================================================
   * 1. Copy parent computed style (if applicable)
   * 2. Override with local style (always wins)
   *
   * ============================================================================
   * DESIGN STRATEGY
   * ============================================================================
   * - Uses in-place overwrite model (NO object reset or deletion)
   * - Assumes monotonic property accumulation (no property removal)
   * - Ensures minimal allocation and maximum performance
   *
   * ============================================================================
   * RULES
   * ============================================================================
   * - No mutation of local style
   * - No per-property condition checks (direct overwrite)
   * - Canvas does NOT propagate style
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   * - computedStyle always converges to correct final state via overwrite
   * - Previously written keys are safely overridden each frame
   *
   * ============================================================================
   * @param shape  - Target shape
   * @param parent - Parent shape (nullable)
   */
  #resolveWorldStyle(
    shape: GraphicsNodeWithInternalAccessMethods,
    parent: GraphicsNodeWithInternalAccessMethods | null
  ) {
    const computed = shape[GET_INTERNAL_COMPUTED_STYLE_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    ) as Record<string, string | number | boolean>;

    const local = shape[GET_INTERNAL_STYLE_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    ) as Record<string, string | number | boolean>;

    // -----------------------------------------------------------
    // STEP 1: Inherit from parent (Group only)
    // -----------------------------------------------------------
    if (parent && parent.geometry?.shape === 'g') {
      const parentComputed = parent[GET_INTERNAL_COMPUTED_STYLE_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      ) as Record<string, any>;

      for (const k in parentComputed) {
        computed[k] = parentComputed[k];
      }
    }

    // -----------------------------------------------------------
    // STEP 2: Override with local style
    // -----------------------------------------------------------
    for (const k in local) {
      computed[k] = local[k];
    }
  }

  #resolveLocalMatrix() {
    const geo = this.#geometry as {
      transformStack: TransformStack;
    };

    // compose ONLY local transforms

    const affineComposedMatrix = composeAffineTransformations(
      geo.transformStack,
      true
    );

    const localMatrix = geo.transformStack.stack[0];

    localMatrix.set(affineComposedMatrix, 0);
  }
  /**
   * Computes world matrix for a shape.
   *
   * ============================================================================
   * FORMULA
   * ============================================================================
   * worldMatrix = localMatrix × parent.worldMatrix
   *
   * ============================================================================
   * DATA FLOW
   * ==================→ multiply → Float32Array (world)
   *
   * ============================================================================
   * DESIGN NOTES
   * ============================================================================
   * - DOMMatrix used only for multiplication
   * - Final result stored back into Float32Array for consistency
   *
   * ============================================================================
   * @param shape  - Target shape
   * @param parent - Parent shape (nullable)
   */
  #resolveWorldMatrix(
    shape: GraphicsNodeWithInternalAccessMethods,
    parent: GraphicsNodeWithInternalAccessMethods | null
  ) {
    const childGeometry = shape[GET_INTERNAL_GEOMETRY_METHOD](
      DEV_INTERNAL_ACCESS_KEY
    ) as {
      shape: string;
      localMatrix: Float32Array;
      worldMatrix: Float32Array;
    };

    const childLocalMatrix = childGeometry?.localMatrix as Float32Array;

    if (parent) {
      const parentGeometry = parent[GET_INTERNAL_GEOMETRY_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      );
      const parentWorldMatrix = parentGeometry?.worldMatrix as Float32Array;
      const childWorldMatrix = childGeometry?.worldMatrix as Float32Array;

      affineMatrixMultiply(
        parentWorldMatrix,
        childLocalMatrix,
        childWorldMatrix
      );

      if (childGeometry.shape == 'rect') {
        Log('worldMatrix', JSON.stringify(childWorldMatrix));
      }
    }
  }

  // * ============================================================================
  // * COMPONENT SECTION
  // * ============================================================================

  /**
   * Normalizes transformation mode before execution.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Validates and adjusts transformation mode based on pivot inputs
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - If pivot mode is requested but pivot point is (0,0):
   *   → converts mode to relative ('r')
   *   → optionally emits warning in development mode
   *
   * ============================================================================
   * @param mode
   * - Transformation mode (e.g., 'p', 'pivot', 'r')
   *
   * @param px
   * @param py
   * - Pivot coordinates
   *
   * ============================================================================
   * @returns string
   *
   * - Normalized transformation mode
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Pivot mode is only meaningful when pivot ≠ (0,0)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Optimization step to avoid unnecessary pivot computation
   */
  #preTransformChecks(
    baseOpt: Partial<BaseTransformationMeta> | null = null
  ): void {
    // defaults
    if (baseOpt) {
      baseOpt.tType ??= 'r';
      baseOpt.px ??= 0;
      baseOpt.py ??= 0;
      const mode = baseOpt.tType.toLowerCase();

      if (
        (mode == 'p' || mode == 'pivot') &&
        baseOpt.px == 0 &&
        baseOpt.py == 0
      ) {
        if (__DEV__)
          Warn(
            "pivot px , py both are zero so effect is same as relative transformation even if type is 'pivot' or 'p' , falling to 'relative' type to save computations."
          );
        baseOpt.tType = 'r';
      }
    }
    /**
     * Prevent transformation during active animation.
     */
    if (this.#isAnimation) {
      throw new OperationInProgressError(
        'transformation',
        'animation.animation',
        'RenderNode.#preChecks()'
      );
    }

    this.#initOrGetComponent('transformation');
  }

  #initOrGetComponent(
    component: 'transformation' | 'animation' | 'event' | 'filter'
  ) {
    if (!this.#components?.[component]) {
      switch (component) {
        case 'transformation': {
          this.#components[component] = new Transformation(
            this as GraphicsNodeWithInternalAccessMethods
          );
          break;
        }
        case 'animation': {
          this.#components[component] = new Animation(
            this as GraphicsNodeWithInternalAccessMethods,
            this.#parentAnimationStatus.bind(this),
            () => {
              this.#isAnimation = false;
            }
          );

          break;
        }
        case 'event': {
          this.#components[component] = new EventTargets();

          break;
        }
      }
    }
  }

  // start batching of the transformations and accumulate all mattresses internally
  public beginT(): this {
    this.#preTransformChecks();
    this.#components.transformation.beginT();
    return this;
  }

  // stop the batching of the transformations and apply that combined a matrix to the shape
  public endT(): this {
    this.#preTransformChecks();
    this.#components.transformation.endT();
    return this;
  }

  /**
   * Applies a translation transform to the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Moves the entity by `(x, y)` in coordinate space
   * - Integrates translation into transformation pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Validates that no animation is currently active
   * 2. Normalizes transformation type and pivot via pre-checks
   * 3. Generates translation matrix using transformation module
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param x
   * - Translation along X-axis
   *
   * @param y
   * - Translation along Y-axis
   *
   * @param tType
   * - Transformation type (default: 'a')
   * - Controls how transform is applied (e.g., batched/immediate)
   *
   * @param px
   * @param py
   * - Pivot point for translation (default: 0, 0)
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Transformation is not applied if animation is active
   * - Geometry is updated via transformation pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.Translate({ x: 10, y: 20 })
   * entity.beginT().Translate({ x: 5, y: 5 }).endT()
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Throws error if animation is in progress
   * - Mutates geometry and updates visual state
   */
  public translate(translateProps: TranslateMethodProps): this {
    this.#preTransformChecks(translateProps as object);

    const matrix = this.#components.transformation.translate(
      translateProps
    ) as Float32Array | void;
    if (matrix) {
      this.#finalizeTransform(matrix);
    }

    return this;
  }

  /**
   * Applies a scaling transform to the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Scales the entity along X and Y axes
   * - Integrates scaling into transformation pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Prevents execution if animation is active
   * 2. Normalizes transformation mode and pivot
   * 3. Generates scaling matrix via transformation module
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param sx
   * - Scale factor along X-axis (default: 1)
   *
   * @param sy
   * - Scale factor along Y-axis (default: 1)
   *
   * @param tType
   * - Transformation type (default: 'a')
   *
   * @param px
   * @param py
   * - Pivot point for scaling (default: 0, 0)
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Scaling is blocked during active animation
   * - Geometry is updated through transformation pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.Scale({ sx: 2, sy: 2 })
   * entity.Scale({ sx: 1.5, sy: 1, px: 50, py: 50 })
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates geometry and updates visual transform
   * - Throws error if animation is in progress
   */

  public scale(scaleProps: ScaleMethodProps): this {
    this.#preTransformChecks(scaleProps as object);

    const matrix = this.#components.transformation.scale(
      scaleProps
    ) as Float32Array | void;
    if (matrix) {
      this.#finalizeTransform(matrix);
    }

    return this;
  }

  /**
   * Applies a rotation transform to the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Rotates the entity by a given angle
   * - Integrates rotation into transformation pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Prevents execution if animation is active
   * 2. Normalizes transformation mode and pivot
   * 3. Generates rotation matrix via transformation module
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param angle
   * - Rotation angle (typically in degrees, depends on implementation)
   *
   * @param tType
   * - Transformation type (default: 'a')
   *
   * @param px
   * @param py
   * - Pivot point for rotation (default: 0, 0)
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Rotation is blocked during active animation
   * - Geometry is updated through transformation pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.Rotate({ angle: 45 })
   * entity.Rotate({ angle: 90, px: 50, py: 50 })
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates geometry and updates visual transform
   * - Throws error if animation is in progress
   */

  public rotate(rotateProps: RotateMethodProps): this {
    this.#preTransformChecks(rotateProps as object);

    const matrix = this.#components.transformation.rotate(
      rotateProps
    ) as Float32Array | void;
    if (matrix) {
      this.#finalizeTransform(matrix);
    }

    return this;
  }

  /**
   * Applies a skew (shear) transform to the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Skews the entity along X and/or Y axes
   * - Integrates skew transformation into the pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Prevents execution if animation is active
   * 2. Normalizes transformation mode and pivot
   * 3. Generates skew matrix via transformation module
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param sx
   * - Skew factor along X-axis
   *
   * @param sy
   * - Skew factor along Y-axis
   *
   * @param tType
   * - Transformation type (default: 'a')
   *
   * @param px
   * @param py
   * - Pivot point for skew (default: 0, 0)
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Skew is blocked during active animation
   * - Geometry is updated via transformation pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.Skew({ sx: 10, sy: 0 })
   * entity.Skew({ sx: 0, sy: 15, px: 50, py: 50 })
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates geometry and updates visual transform
   * - Throws error if animation is in progress
   */

  public skew(skewProps: SkewMethodProps): this {
    this.#preTransformChecks(skewProps as object);

    const matrix = this.#components.transformation.skew(
      skewProps
    ) as Float32Array | void;
    if (matrix) {
      this.#finalizeTransform(matrix);
    }

    return this;
  }

  /**
   * Applies a transformation using a raw transform string.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Parses and applies transformation defined as a string
   * - Acts as a flexible entry point for custom or combined transforms
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Prevents execution if animation is active
   * 2. Performs basic normalization via pre-checks
   * 3. Parses input string into transformation matrix
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param input
   * - Transformation string (e.g., "translate(10,20) rotate(45)")
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Transformation is blocked during active animation
   * - Parsed transformation is applied through standard pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.transform("translate(10,20) rotate(45)")
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Input must be valid transform syntax
   * - Mutates geometry and updates visual state
   */

  public transform(dsl: string): this {
    this.#preTransformChecks();
    this.#components.transformation.transform(dsl);
    return this;
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Animation Section
  //++++++++++++++++++++++++++++++++++++++++++++

  #parentAnimationStatus(changeAnimationStatus: boolean = false): boolean {
    if (changeAnimationStatus) this.#isAnimation = !this.#isAnimation;
    return this.#isAnimation;
  }

  public animate(animatableProps: IAnimationOptions<T>) {
    if (this.#isAnimation) {
      Warn(
        'Animation is already going on this shape , please wait untill animation finish or cancel the animation.'
      );

      return;
    }
    this.#initOrGetComponent('animation');

    animatableProps.start = true;
    this.#components.animation.animate(animatableProps);
  }

  public animation(
    animatableProps: IAnimationOptions<T>
  ): Omit<IAnimation, 'animate' | 'update'> {
    if (this.#isAnimation) {
      Warn(
        'Animation is already going on this shape , please wait untill animation finish or cancel the animation.'
      );

      return this.#components.animation;
    }
    this.#initOrGetComponent('animation');

    animatableProps.start = true;
    this.#components.animation.animate(animatableProps);

    return this.#components.animation;
  }

  /**
   * updateAnimation
   */
  [UPDATE_ANIMATION_METHOD](time: number, accessKey: symbol) {
    assertAccess(accessKey);

    this.#isAnimation && this.#components.animation.update(time);
  }

  /**
   * Registers an event handler.
   *
   * Multiple handlers may be registered for the same event.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke when the event is dispatched.
   */
  public on(event: SupportedEvents, callback: Handler) {
    this.#initOrGetComponent('event');
    this.#components.event.on(event, callback);
  }

  /**
   * Removes event handlers associated with an event.
   *
   * If `callback` is provided, only that handler is removed.
   * Otherwise, all handlers registered for the event are removed.
   *
   * @param event The event to unsubscribe from.
   * @param callback Optional handler to remove.
   */
  public off(event: SupportedEvents) {
    this.#initOrGetComponent('event');
    this.#components.event.off(event);
  }

  /**
   * Registers an event handler that is invoked at most once.
   *
   * After the first invocation, the handler is automatically removed.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke once.
   */
  public once(event: SupportedEvents, callback: Handler) {
    this.#initOrGetComponent('event');
    this.#components.event.once(event, callback);
  }

  /**
   * Returns handler for given event type.
   *
   * IMPORTANT:
   * - Intended ONLY for EventSystem usage
   * - Not part of public contract
   *
   * @param type Event type
   * @returns Handler or undefined
   *
   */

  public getEventHandler(type: SupportedEvents): Handler | void {
    this.#initOrGetComponent('event');
    const handler = this.#components.event.getEventHandler(type);

    if (handler) return handler;
    return;
  }

  /**
   * Checks whether a handler exists for given event type.
   *
   * Useful for fast path skipping in dispatcher.
   */
  public hasEventHandler(type: SupportedEvents): boolean {
    this.#initOrGetComponent('event');
    return this.#components.event.hasEventHandler(type);
  }
}
