import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import {
  parameterTypeValidator,
  animationChecks,
  getTransformationMatrix,
  cwarn
} from '../../utils/provider/utils.js';

import { Animation } from '../../utils/provider/utils.js';
import { Filter } from '../../utils/provider/utils.js';
import { Transformation } from '../../utils/provider/utils.js';

import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/internals/accessKeys.js';

// ------ Type Imports ------

import type { animatableProps } from '../../utils/animation/animation.js';
import type { attrsMethodReturnTypes, transformStack } from '../../types/index';
import type {
  IadvanceProps,
  EasingType,
  EasingFunction
} from '../../types/animation';
import type {
  TranslateMethodProps,
  ScaleMethodProps,
  RotateMethodProps,
  SkewMethodProps,
  FlipMethodProps
} from '../../types/transformations';
import type { shapesPropsType } from '../../types/shapes';

import {
  boxShadowProps,
  innerShadowProps,
  colorMatrixProps,
  displacementEffectProps,
  lightEffectProps,
  linearGradientProps,
  radialGradientProps,
  neuMorphProps,
  glassMorphProps
} from '../../types/filters';

import type { IGraphicalElementProperties as IG } from '../../properties/provider/shapeProperties';

import { EventTarget } from '../../core/provider/eventTarget.js';
import { GShpesTages } from '../../core/provider/graphics.js';
import { Log, Warn } from '../../utils/helpers/helpers.js';
import { OperationInProgressError } from '../../utils/errors/provider/shantanuJSErrors.js';

/**
 * Abstract extension layer over `EventTarget` that enriches graphical models
 * with higher-level entity capabilities such as transformation and animation.
 *
 * This class introduces:
 * - Composition with Transformation module
 * - Composition with Animation module
 * - Internal references to base class private state (`#fig`, `#geometry`)
 * - Entity-level control flags (selection, animation state)
 *
 * @template T - Constrained graphical shape tag type
 */
export abstract class GraphicsEntity<
  T extends keyof IG
> extends EventTarget<T> {
  /**
   * Internal reference to the rendering primitive (`#fig`) from base class.
   *
   * Source:
   * - Retrieved via privileged access (`getIFig`)
   *
   * Purpose:
   * - Direct access to rendering object (e.g., SVGElement)
   * - Used for advanced operations (transform, animation, DOM interaction)
   *
   * Invariant:
   * - Must always remain consistent with base class `#fig`
   *
   * Access:
   * - Private (controlled via access key system)
   */
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);

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
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

  /**
   * Transformation module instance.
   *
   * Relationship:
   * - Composition ("has-a" relationship)
   *
   * Responsibilities:
   * - Manages transformation stack
   * - Applies matrix operations
   * - Updates geometry transform state
   *
   * Lifecycle:
   * - Instantiated during construction
   * - Bound to current entity instance
   *
   * Invariant:
   * - Must always exist after constructor execution
   */
  #transform!: Transformation;

  /**
   * Animation module instance.
   *
   * Relationship:
   * - Composition ("has-a" relationship)
   *
   * Responsibilities:
   * - Handles animation lifecycle
   * - Controls timing and frame updates
   *
   * State:
   * - `null` → no active animation
   * - instance → active animation handler
   *
   * Invariant:
   * - At most one active animation per entity
   */
  #animation!: Animation | null;

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
  #filter: Filter = new Filter();

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

    /**
     * Initialize transformation module with current entity context.
     */
    this.#transform = new Transformation(this);

    /**
     * Refresh internal reference to rendering primitive.
     *
     * Note:
     * - Ensures latest reference after base class initialization
     */
    this.#fig = this.getIFig(DEV_INTERNAL_ACCESS);
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
   * Restores geometric dimensions of the shape from a given transformation state.
   *
   * Responsibility:
   * - Converts transformation matrix/state back into shape-specific dimensions
   * - Used for reverse-mapping transformations (e.g., scaling, rotation adjustments)
   *
   * @param accessKeys - Symbol used for privileged access validation
   * @param temporaryState - Transformation state (typically matrix representation)
   * @param basic - Optional flag indicating simplified restoration mode
   *
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
    accessKeys: symbol,
    temporaryState: Float32Array,
    basic?: boolean
  ): void;

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
  protected abstract validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[],
    outputn?: boolean
  ): boolean | number[] | number;

  /**
   * Flattens the entire transformation stack into the geometry, converting
   * transformed (world-space) state into a new canonical local representation.
   *
   * ============================================================================
   * CONCEPTUAL MODEL
   * ============================================================================
   *
   * Flattening is a transformation collapse operation:
   *
   *   LOCAL (canonical geometry)
   *        ↓ apply full transform stack
   *   WORLD (rendered geometry)
   *        ↓ derive parametric attributes
   *   PARAMETRIC (semantic representation)
   *        ↓ apply user modifications
   *   WORLD (updated geometry)
   *        ↓ flatten into new canonical form
   *   LOCAL (new canonical geometry)
   *
   * Effectively:
   * - Removes all accumulated transforms
   * - Embeds their effect directly into geometry
   * - Resets transform stack to identity
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Converts transformation stack → geometry mutation
   * - Rewrites geometry in world-space coordinates
   * - Applies user-specified parametric updates
   * - Recomputes canonical shape definition
   * - Resets transformation stack
   *
   * ============================================================================
   * EXECUTION FLOW
   * ============================================================================
   *
   * 1. Compose all transformations into a single matrix
   * 2. Apply composed matrix to local geometry buffer
   * 3. Convert transformed buffer → parametric representation
   * 4. Apply user-provided parameter updates
   * 5. Regenerate canonical geometry matrix
   * 6. Reset transformation stack to identity
   *
   * ============================================================================
   * @param applyUserParams
   * Function responsible for applying user-defined parametric updates.
   *
   * Expected Behavior:
   * - Accepts parameter object
   * - Mutates geometry via standard mutation pipeline (likely `attrs`)
   * - Must NOT bypass validation layers
   *
   * @param userParams
   * Key-value pairs representing user-specified attribute changes.
   *
   * Notes:
   * - Automatically overrides `transform` to empty string (`''`)
   *   → ensures transform stack is not reintroduced
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * SIDE EFFECTS
   * ============================================================================
   *
   * - Mutates internal geometry representation
   * - Rewrites canonical coordinate system
   * - Clears transformation stack (except identity)
   * - Forces geometry into world-space alignment
   *
   * ============================================================================
   * INVARIANTS ENFORCED
   * ============================================================================
   *
   * - After execution:
   *   - Geometry reflects fully transformed state
   *   - Transformation stack contains only identity matrix
   *   - No residual transformations remain
   *
   * - Canonical geometry becomes equivalent to previously rendered geometry
   *
   * ============================================================================
   * CRITICAL GUARANTEES
   * ============================================================================
   *
   * - No transformation loss (all transforms are preserved in geometry)
   * - Shape integrity must remain valid post-flattening
   * - Parametric consistency must be maintained
   *
   * ============================================================================
   * FAILURE MODES
   * ============================================================================
   *
   * - Invalid transformation matrix → incorrect geometry reconstruction
   * - Invalid `restoreDimension` implementation → corrupted parametric state
   * - Invalid `generateMatrix` implementation → inconsistent canonical form
   *
   * ============================================================================
   * DESIGN INTENT
   * ============================================================================
   *
   * This method exists to:
   * - Normalize transformation-heavy states
   * - Prevent accumulation of transformation stack complexity
   * - Enable stable parametric editing after transformations
   *
   * It is a critical operation for:
   * - Editing workflows
   * - Export pipelines
   * - Geometry normalization
   *
   * ============================================================================
   * PERFORMANCE CHARACTERISTICS
   * ============================================================================
   *
   * - Matrix composition cost: O(n) (n = transform stack size)
   * - Buffer transformation cost: O(m) (m = geometry points)
   * - Additional overhead from regeneration and validation
   *
   * ============================================================================
   * SECURITY MODEL
   * ============================================================================
   *
   * - Relies on internal privileged methods:
   *   - `restoreDimension`
   *   - `generateMatrix`
   *
   * - Requires correct implementation of abstract methods in subclasses
   *
   * ============================================================================
   * IMPLEMENTATION NOTES
   * ============================================================================
   *
   * - Uses DOMMatrix for transformation composition
   * - Converts matrix operations into Float32Array buffer representation
   * - Ensures identity reset using explicit matrix overwrite
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * This operation is destructive to the original local coordinate system.
   *
   * After execution:
   * - Original local geometry cannot be recovered
   * - Transform history is permanently lost
   *
   * Use only when:
   * - Transform stack must be collapsed
   * - Geometry normalization is required
   */
  #flattenTransforms(
    applyUserParams: Function,
    userParams: Record<string, string | number>
  ) {
    if (__DEV__) {
      Log('in flatten transform func');
    }

    /**
     * Step 1: Compose full transformation stack into a single matrix.
     */
    const composedMatrix = this.#transform.composeTransforms(true) as DOMMatrix;

    /**
     * Step 2: Apply composed matrix to local geometry buffer.
     *
     * Result:
     * - Geometry transformed into world-space coordinates
     */
    const updatedBuffer = this.#transform.matrixProductTxM(
      composedMatrix
    ) as Float32Array;

    /**
     * Step 3: Convert transformed buffer into parametric representation.
     *
     * Delegates to shape-specific logic.
     */
    this.restoreDimension(DEV_INTERNAL_ACCESS, updatedBuffer);

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
    this.generateMatrix(DEV_INTERNAL_ACCESS);

    /**
     * Step 6: Reset transformation stack to identity.
     */
    const geo = this.#geometry as {
      transformStack: transformStack;
    };

    /**
     * Clear all transformation entries except base.
     */
    geo.transformStack.stack.length = 1;

    /**
     * Assign identity matrix to base transformation.
     */
    (geo.transformStack.stack[0].transformMatrix as Float32Array).set(
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
    props: shapesPropsType | string
  ): attrsMethodReturnTypes {
    try {
      /**
       * Validate shape existence.
       */
      const shape = this.#geometry?.shape;
      if (!shape || shape == '') {
        throw new Error('Shape is not difined');
      }

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
          this.generateMatrix(DEV_INTERNAL_ACCESS);
        } else {
          /**
           * Step 1: Validate input properties.
           */
          parameterTypeValidator(
            props,
            GraphicalElementProperties,
            AllGShapeStyleProperties,
            this.#classProp,
            shape
          );

          /**
           * Retrieve shape-specific property registries.
           */
          const elementProps = GraphicalElementProperties[shape as keyof IG];

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
            if (key in elementProps) {
              const k = key as keyof typeof elementProps;
              g[k] = props[k];
            } else if (key in styleProps) {
              const k = key as keyof typeof styleProps;
              s[k] = props[k];
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
        }
      } else if (typeof props === 'string') {
        /**
         * ============================
         * GETTER MODE
         * ============================
         */
        let result = super.attrs(props);

        /**
         * Return result if available.
         */
        if (result != null) {
          return result;
        }
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
   * Retrieves a transformation matrix from the internal transformation stack.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Exposes transformation matrices applied to the entity
   * - Supports both single transform retrieval and composed matrix
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Reads transformation stack from internal geometry
   * - Delegates extraction/composition to `getTransformationMatrix`
   * - Returns matrix in requested format (row/column major)
   *
   * ============================================================================
   * @param which
   * - number → index of transform in stack
   * - default: 0
   *
   * @param major
   * - 'r' → row-major (default)
   * - 'c' → column-major
   *
   * ============================================================================
   * @returns number[][]
   *
   * - 2D matrix representation of the transformation
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Returned matrix reflects current transform stack
   * - No mutation of internal state occurs
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * getTMatrix(0)          // specific transform
   * getTMatrix(3 , "c") // column-major
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Relies on `getTransformationMatrix` for actual computation
   * - Returned matrix should be treated as read-only
   */
  public getTMatrix(
    which: string | number = 0,
    major: 'r' | 'c' = 'r'
  ): number[][] {
    return getTransformationMatrix(
      (this.#geometry as { transformStack: transformStack }).transformStack
        .stack,
      which,
      major
    ) as number[][];
  }

  /**
   * Finalizes the transformation pipeline and applies it to geometry.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Adds incoming transform to stack
   * - Composes all transforms into a single matrix
   * - Applies final matrix to geometry buffer
   * - Syncs visual transform state
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Push incoming transform into stack (if provided)
   * 2. Compose full transformation stack
   * 3. Store composed matrix as base transform
   * 4. Apply matrix to geometry buffer
   * 5. Update geometry + visual transform (`transform` attr)
   *
   * ============================================================================
   * @param transformMatrix
   * - Float32Array → transformation matrix to apply
   *
   * @param transformName
   * - Identifier for the transform (tracking/debugging)
   *
   * @param transformType
   * - Type of transform (e.g., 'batched', 'immediate')
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Transform stack always resolves to a single composed base matrix
   * - Geometry reflects latest composed transformation
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * finalize({ matrix, "translate", "immediate" })
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Relies on `composeTransforms` and `matrixProductTxM`
   * - Mutates geometry and updates visual transform state
   */
  #finalizeTransformAndApply({
    transformMatrix,
    transformName,
    transformType
  }: {
    transformMatrix: Float32Array | void;
    transformName: string;
    transformType: string;
  }) {
    if (transformMatrix == undefined || transformMatrix == null) {
      return;
    }

    let temporaryState!: Float32Array;

    const geo = this.#geometry as { transformStack: transformStack };
    const stack = geo.transformStack.stack;

    /**
     * Step 1: Push incoming transform
     */
    if (transformMatrix instanceof Float32Array) {
      stack.push({
        transformMatrix: transformMatrix,
        transformName,
        transformType
      });
    }

    /**
     * Step 2: Compose transforms
     */
    const composedMat = this.#transform.composeTransforms(true) as DOMMatrix;
    const { a, b, m31, c, d, m32, e, f } = composedMat;

    /**
     * Step 3: Set base (finalized) matrix
     */
    const finalizedMatrix = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);
    stack[0].transformMatrix = finalizedMatrix;

    /**
     * Step 4: Apply matrix to geometry buffer
     */
    (transformType !== 'batched' &&
      (temporaryState = this.#transform.matrixProductTxM(
        composedMat,
        false
      ))) ||
      (temporaryState = this.#transform.matrixProductTxM(composedMat, false));

    /**
     * Step 5: Sync geometry + visual state
     */
    this.restoreDimension(DEV_INTERNAL_ACCESS, temporaryState);

    const t = `${a} , ${b} , ${c} , ${d} , ${e} , ${f}`;
    this.attrs({ transform: t });
  }

  /**
   * Starts a transformation batching session.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Initializes batching mode for transformations
   * - Defers application of transforms until `endT()` is called
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Delegates to transformation module
   * - Accumulates transforms instead of applying immediately
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   */
  public beginT(): this {
    this.#transform.beginT();
    return this;
  }

  /**
   * Ends batching session and applies accumulated transformations.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Finalizes all batched transforms
   * - Applies them to geometry via internal pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Retrieves composed matrix from transform module
   * - Passes it to finalization pipeline
   *
   * ============================================================================
   * @returns this
   *
   * - Enables method chaining
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Triggers geometry update and visual synchronization
   */
  public endT(): this {
    const transformMatrix = this.#transform.endT() as Float32Array | void;

    this.#finalizeTransformAndApply({
      transformMatrix,
      transformName: 'accumulated',
      transformType: 'batched'
    });

    return this;
  }

  /**
   * Checks whether transformation batching is active.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Indicates if transforms are currently being accumulated
   *
   * ============================================================================
   * @returns boolean
   *
   * - `true` → batching active
   * - `false` → immediate mode
   */
  public isBatching(): boolean {
    return this.#transform.isBatching();
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
  public getBBox(includeStroke: boolean = true) {
    return this.#transform.getBBox(includeStroke);
  }

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
  #preChecks(mode: string, px: number, py: number) {
    if ((mode == 'p' || mode == 'pivot') && px == 0 && py == 0) {
      if (__DEV__)
        Warn(
          "pivot px , py both are zero so effect is same as relative transformation even if type is 'pivot' or 'p' , falling to 'relative' type to save computations."
        );
      mode = 'r';
    }
    return mode;
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
  public Translate({
    x,
    y,
    tType = 'a',
    px = 0,
    py = 0
  }: Required<Pick<TranslateMethodProps, 'x' | 'y'>> &
    Partial<Omit<TranslateMethodProps, 'x' | 'y'>>): this {
    try {
      /**
       * Prevent transformation during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.Translate',
          'animation.animation',
          'GraphicsEntity.Translate()'
        );
      }

      /**
       * Normalize transformation type and pivot.
       */
      tType = this.#preChecks(tType, px, py);

      /**
       * Generate translation matrix.
       */
      const transformMatrix = this.#transform.Translate({
        x,
        y,
        tType,
        px,
        py
      }) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'translate',
        transformType: tType
      });

      return this;
    } catch (e) {
      throw e;
    }
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
  public Scale({
    sx = 1,
    sy = 1,
    tType = 'a',
    px = 0,
    py = 0
  }: ScaleMethodProps): this {
    try {
      /**
       * Prevent scaling during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.Scale',
          'animation.animation',
          'GraphicsEntity.Scale()'
        );
      }

      /**
       * Normalize transformation mode and pivot.
       */
      tType = this.#preChecks(tType, px, py);

      /**
       * Generate scaling matrix.
       */
      const transformMatrix = this.#transform.Scale({
        sx,
        sy,
        tType,
        px,
        py
      }) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'scale',
        transformType: tType
      });

      return this;
    } catch (e) {
      throw e;
    }
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
  public Rotate({
    angle,
    tType = 'a',
    px = 0,
    py = 0
  }: RotateMethodProps): this {
    try {
      /**
       * Prevent rotation during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.Rotate',
          'animation.animation',
          'GraphicsEntity.Rotate()'
        );
      }

      /**
       * Normalize transformation mode and pivot.
       */
      tType = this.#preChecks(tType, px, py);

      /**
       * Generate rotation matrix.
       */
      const transformMatrix = this.#transform.Rotate({
        angle,
        tType,
        px,
        py
      }) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'rotate',
        transformType: tType
      });

      return this;
    } catch (e) {
      throw e;
    }
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
  public Skew({ sx, sy, tType = 'a', px = 0, py = 0 }: SkewMethodProps): this {
    try {
      /**
       * Prevent skew during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.Skew',
          'animation.animation',
          'GraphicsEntity.Skew()'
        );
      }

      /**
       * Normalize transformation mode and pivot.
       */
      tType = this.#preChecks(tType, px, py);

      /**
       * Generate skew matrix.
       */
      const transformMatrix = this.#transform.Skew({
        sx,
        sy,
        tType,
        px,
        py
      }) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'skew',
        transformType: tType
      });

      return this;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Applies a flip (reflection) transform to the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Reflects the entity across X and/or Y axes
   * - Integrates flip transformation into the pipeline
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Prevents execution if animation is active
   * 2. Performs basic normalization via pre-checks
   * 3. Generates flip matrix using transformation module
   * 4. Finalizes and applies transformation to geometry
   *
   * ============================================================================
   * @param flipX
   * - Enables flip along X-axis
   *
   * @param flipY
   * - Enables flip along Y-axis
   *
   * @param dirX
   * - Direction for X-axis flip (default: 'x+')
   *
   * @param dirY
   * - Direction for Y-axis flip (default: 'y+')
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
   * - Flip is blocked during active animation
   * - Geometry is updated through transformation pipeline
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.Flip({ flipX: true })
   * entity.Flip({ flipY: true, dirY: 'y-' })
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates geometry and updates visual transform
   * - Throws error if animation is in progress
   */
  public Flip({
    flipX,
    flipY,
    dirX = 'x+',
    dirY = 'y+'
  }: FlipMethodProps): this {
    try {
      /**
       * Prevent flip during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.Flip',
          'animation.animation',
          'GraphicsEntity.Flip()'
        );
      }

      /**
       * Basic normalization (no pivot logic used here).
       */
      this.#preChecks('', 1, 1);

      /**
       * Generate flip matrix.
       */
      const transformMatrix = this.#transform.Flip({
        flipX,
        flipY,
        dirX,
        dirY
      }) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'flip',
        transformType: `${dirX} , ${dirY}`
      });

      return this;
    } catch (e) {
      throw e;
    }
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
  public transform(input: string): this {
    try {
      /**
       * Prevent transform during active animation.
       */
      if (this.#isAnimation) {
        throw new OperationInProgressError(
          'transform.transform',
          'animation.animation',
          'GraphicsEntity.transform()'
        );
      }

      /**
       * Basic normalization (no pivot-specific logic).
       */
      this.#preChecks('', 1, 1);

      /**
       * Parse and generate transformation matrix.
       */
      const transformMatrix = this.#transform.transform(
        input
      ) as Float32Array | void;

      /**
       * Apply transformation to geometry.
       */
      this.#finalizeTransformAndApply({
        transformMatrix,
        transformName: 'batched',
        transformType: 'batched'
      });

      return this;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Internal helper to get/set animation state.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Tracks whether an animation is currently active
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - If `arg` is falsy → returns current animation state
   * - If `arg` is truthy → toggles animation state
   *
   * ============================================================================
   * @param arg
   * - Control flag for read/toggle behavior
   *
   * @returns boolean | undefined
   *
   * - Current animation state (when reading)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Used internally by Animation module for lifecycle control
   */
  #isAnimationsGoingOn(arg: boolean): boolean | undefined | void {
    if (!arg) return this.#isAnimation;
    this.#isAnimation = !this.#isAnimation;
  }

  /**
   * Starts an animation on the entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Initializes and executes animation on geometry and/or style properties
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Ensures no animation is already running
   * 2. Validates animation inputs
   * 3. Creates Animation instance (if not existing)
   * 4. Passes required hooks and callbacks
   * 5. Starts animation execution
   *
   * ============================================================================
   * @param attrs
   * - Target properties to animate
   *
   * @param avdProp
   * - Advanced animation configuration (optional)
   *
   * @param duration
   * - Duration of animation in milliseconds
   *
   * @param ease
   * - Easing function or type (optional)
   *
   * @param onComplete
   * - Callback executed after animation completes (optional)
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Only one animation can run at a time per entity
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.animate({ x: 100, y: 50 }, null, 1000)
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Throws error if another animation is already running
   * - Mutates geometry and/or style over time
   */
  public animate(
    attrs: animatableProps & IG[T],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): void {
    if (!this.#animation) {
      /**
       * Basic normalization (no pivot-specific logic).
       */
      this.#preChecks('', 1, 1);

      /**
       * Validate animation inputs.
       */
      animationChecks(attrs, avdProp, duration, ease, onComplete);

      /**
       * Create animation instance with required hooks.
       */
      this.#animation = new Animation(
        this,
        this.#isAnimationsGoingOn.bind(this),
        this.#transform.createTransformMatrix.bind(this.#transform),
        this.#transform.getBBox.bind(this.#transform),
        () => {
          this.#animation = null;
          this.#isAnimation = false;
        }
      );

      /**
       * Start animation.
       */
      this.#animation.animate(attrs, avdProp, duration, ease, onComplete, true);
    } else {
      /**
       * Prevent concurrent animations.
       */
      throw new OperationInProgressError(
        'animation.animation',
        'animation.animation',
        'GraphicsEntity.animation()'
      );
    }
  }

  /**
   * Initializes an animation and returns control handlers.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Starts an animation on the entity
   * - Exposes control methods (start, pause, resume, etc.)
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Ensures no animation is currently running
   * 2. Validates animation inputs
   * 3. Creates Animation instance with required hooks
   * 4. Starts animation execution
   * 5. Returns control interface bound to animation instance
   *
   * ============================================================================
   * @param attrs
   * - Target properties to animate
   *
   * @param avdProp
   * - Advanced animation configuration (optional)
   *
   * @param duration
   * - Animation duration (ms)
   *
   * @param ease
   * - Easing function or type (optional)
   *
   * @param onComplete
   * - Callback executed after completion (optional)
   *
   * ============================================================================
   * @returns
   *
   * - Object with animation controls:
   *   - start()
   *   - pause()
   *   - resume()
   *   - isPaused()
   *   - isRunning()
   *   - cancelAnimation()
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Only one animation instance can exist per entity
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * const ctrl = entity.animation({ x: 100 }, null, 1000)
   * ctrl.pause()
   * ctrl.resume()
   * ```
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Throws error if another animation is active
   * - Mutates geometry and/or style over time
   */
  public animation(
    attrs: animatableProps & IG[T],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): {
    start: () => void;
    pause: () => void;
    resume: () => void;
    isPaused: () => boolean;
    isRunning: () => boolean;
    cancelAnimation: () => void;
  } {
    if (!this.#animation) {
      /**
       * Basic normalization (no pivot-specific logic).
       */
      this.#preChecks('', 1, 1);

      /**
       * Validate animation inputs.
       */
      animationChecks(attrs, avdProp, duration, ease, onComplete);

      /**
       * Create animation instance.
       */
      this.#animation = new Animation(
        this,
        this.#isAnimationsGoingOn.bind(this),
        this.#transform.createTransformMatrix.bind(this.#transform),
        this.#transform.getBBox.bind(this.#transform),
        () => {
          this.#animation = null;
          this.#isAnimation = false;
        }
      );

      /**
       * Start animation immediately.
       */
      this.#animation.animate(attrs, avdProp, duration, ease, onComplete, true);
    } else {
      throw new OperationInProgressError(
        'animation.animation',
        'animation.animation',
        'GraphicsEntity.animation()'
      );
    }

    /**
     * Return control interface.
     */
    return {
      start: this.#animation.start.bind(this.#animation),
      pause: this.#animation.pause.bind(this.#animation),
      resume: this.#animation.resume.bind(this.#animation),
      isPaused: this.#animation.isPaused.bind(this.#animation),
      isRunning: this.#animation.isRunning.bind(this.#animation),
      cancelAnimation: this.#animation.cancelAnimation.bind(this.#animation)
    };
  }

  /**
   * Updates the current animation frame.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Advances the active animation using the provided time value
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Validates access using internal access key
   * - Checks if animation exists and is active
   * - Delegates update to animation instance
   *
   * ============================================================================
   * @param key
   * - Access key for internal method authorization
   *
   * @param time
   * - Current time or frame timestamp used for animation progression
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Animation updates only when an active animation exists
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * entity.updateAnimation(key, performance.now())
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Intended for internal or engine-driven update loops
   */
  public updateAnimation(key: symbol, time: number) {
    assertAccess(key);

    this.#animation && this.#isAnimation && this.#animation.update(time);
  }

  /**
   * ============================================================================
   * FILTER METHODS
   * ============================================================================
   *
   * Applies visual effects to the underlying rendering element.
   * All methods delegate to the `Filter` module.
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Creates a new Filter instance
   * - Applies effect directly on internal rendering element (`#fig`)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Effects are visual-only and do not modify geometry
   * - Requires element to be attached to rendering context
   */

  /**
   * Applies box shadow effect.
   *
   * @param props - Shadow configuration
   */
  public boxShadow(props: boxShadowProps) {
    this.#filter.boxShadow(this.#fig, props);
  }

  /**
   * Applies inner shadow effect.
   *
   * @param props - Inner shadow configuration
   */
  public innerShadow(props: innerShadowProps) {
    this.#filter.innerShadow(this.#fig, props);
  }

  /**
   * Applies blur effect.
   *
   * @param blur - Blur intensity
   */
  public blur(blur: number) {
    this.#filter.blur(this.#fig, blur);
  }

  /**
   * Applies glow effect.
   *
   * @param bright - Glow intensity
   */
  public glow(bright: number) {
    this.#filter.glow(this.#fig, bright);
  }

  /**
   * Applies linear gradient fill.
   *
   * @param props - Gradient configuration
   */
  public linearGradient(
    props: linearGradientProps = { direction: 'LR', stops: [] }
  ) {
    this.#filter.linearGradient(this.#fig, props);
  }

  /**
   * Applies radial gradient fill.
   *
   * @param props - Gradient configuration
   */
  public radialGradient(
    props: radialGradientProps = {
      direction: 'CENTER',
      stops: []
    }
  ) {
    this.#filter.radialGradient(this.#fig, props);
  }

  /**
   * ============================================================================
   * ADVANCED FILTER EFFECTS
   * ============================================================================
   *
   * Applies advanced visual effects using the Filter module.
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Instantiates Filter
   * - Applies effect directly on rendering element (`#fig`)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Effects are visual-only (no geometry impact)
   * - No internal state tracking for applied filters
   */

  /**
   * Applies lighting effect to simulate surface illumination.
   *
   * @param props - Lighting configuration (color, intensity, angles, etc.)
   */
  public lightEffect(
    props: lightEffectProps = {
      lightingColor: 'red',
      surfaceScale: 1,
      intensityOfLight: 1,
      horizontalAngleOfLight: 45,
      verticalAngleOfLight: 45
    }
  ) {
    this.#filter.lightEffect(this.#fig, props);
  }

  /**
   * Applies displacement (distortion) effect.
   *
   * @param props - Distortion configuration (pattern, frequency, scale, etc.)
   */
  public displacementEffect(
    props: displacementEffectProps = {
      patternStyle: 'turbulence',
      waveFrequency: 0.6,
      detailLevel: 3,
      distortionAmount: 5,
      distortDirectionX: 'B',
      distortDirectionY: 'G'
    }
  ) {
    this.#filter.displacementEffect(this.#fig, props);
  }

  /**
   * Applies color matrix transformation.
   *
   * @param props - Color transformation configuration
   */
  public colorMatrixTransformation(
    props: colorMatrixProps = {
      type: 'saturate',
      values: 1,
      inSource: 'SourceGraphic'
    }
  ) {
    this.#filter.colorMatrixTransformation(this.#fig, props);
  }

  /**
   * ============================================================================
   * DESIGN EFFECTS (UI-STYLE FILTERS)
   * ============================================================================
   *
   * Applies composite visual effects for modern UI styles.
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Instantiates Filter
   * - Applies effect directly on rendering element (`#fig`)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Effects are purely visual (no geometry changes)
   * - Built as combination of multiple filter primitives
   */

  /**
   * Applies neumorphism effect (soft UI shadow-based design).
   *
   * @param props - Neumorphism configuration (colors, blur, offsets, opacity)
   */
  public neuMorph(
    props: neuMorphProps = {
      backgroundColor: '#e6eef6',
      outerShadowColor: '#b8c9db',
      highlightColor: '#ffffff',
      innerShadowColor: '#000000',

      outerBlur: 10,
      outerOffsetX: 8,
      outerOffsetY: 8,
      outerShadowOpacity: 0.85,

      highlightBlur: 6,
      highlightOffsetX: -6,
      highlightOffsetY: -6,
      highlightOpacity: 0.9,

      innerBlur: 6,
      innerOffsetX: 4,
      innerOffsetY: 4,
      innerShadowOpacity: 0.12
    }
  ) {
    this.#filter.neuMorph(this.#fig, props);
  }

  /**
   * Applies glassmorphism effect (frosted glass appearance).
   *
   * @param props - Glass effect configuration (blur, opacity, edge highlights)
   */
  public glassMorph(
    props: glassMorphProps = {
      blurAmount: 10,
      frostOpacity: 0.05,
      edgeBlur: 1.2,
      edgeHighlightOpacity: 0.35
    }
  ) {
    this.#filter.glassMorph(this.#fig, props);
  }
}
