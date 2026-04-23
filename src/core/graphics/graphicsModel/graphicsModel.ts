import {
  AllGShapeStyleProperties,
  CommonGeometricProperties,
  GraphicalElementProperties
} from '../../../properties/provider/shapeProperties.js';

import { assertAccess } from '../../../utils/provider/accesskeys.js';

import { Colors, generateId } from '../../../utils/provider/utils.js';

import type {
  ICommonGeometricProperties,
  IGraphicalElementProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag
} from '../../../properties/provider/shapeProperties';

import type {
  getAttrsMethodsReturnTypes,
  attrsMethodReturnTypes,
  transformStack
} from '../../../types/index';

import { SVG_CONTEXT } from '../backends/svg/core/core.js';

import type { CONTEXT, DeepReadonly } from '../../../types/graphicsElements';

import {
  InvalidOptionError,
  InvalidRenderingContextError,
  NotInitializedError,
  ReadOnlyPropertyError
} from '../../../utils/errors/provider/shantanuJSErrors.js';
// unused by this file
export type GShpesTages = keyof IGraphicalElementProperties;

type ValidKeys = Extract<
  keyof IGraphicalElementProperties,
  keyof TagToGShapeStyleKeyMap
>;

type GRAPHICS_TYPES = SVGElement;

/**
 * Abstract base model representing a graphical entity within the rendering system.
 *
 * ============================================================================
 * CORE RESPONSIBILITY
 * ============================================================================
 * This class acts as the foundational state container and control layer for all
 * graphical elements in the system.
 *
 * It is responsible for:
 * - Managing geometric state (position, transforms, shape identity)
 * - Managing styling state (visual properties)
 * - Enforcing controlled mutation through validation layers
 * - Providing a unified public API (`attrs`) for state interaction
 * - Maintaining rendering synchronization via dirty flags
 * - Bridging logical model ↔ rendering backend representation (`#fig`)
 *
 * ============================================================================
 * ARCHITECTURAL ROLE
 * ============================================================================
 * This class sits at the intersection of:
 *
 *   [User API Layer]
 *         ↓
 *      attrs()
 *         ↓
 *   -------------------
 *   | Validation Layer |
 *   | (geo/style)      |
 *   -------------------
 *         ↓
 *   -------------------
 *   | Mutation Engine  |
 *   | (#setAttrs)      |
 *   -------------------
 *         ↓
 *   -------------------
 *   | Internal State   |
 *   | (#geometry/#style)
 *   -------------------
 *         ↓
 *   -------------------
 *   | Rendering Layer  |
 *   | (#fig + context) |
 *   -------------------
 *
 * Additionally:
 * - Structural operations (z-order) bypass attribute system and directly mutate
 *   rendering tree (e.g., `toFront`, `toBack`)
 *
 * ============================================================================
 * INTERNAL STATE MODEL
 * ============================================================================
 *
 * 1. Geometry State (`#geometry`)
 * --------------------------------
 * Contains:
 * - Shape identity (immutable after initialization)
 * - Transformation stack (matrix-based composition)
 * - Dirty flag (render invalidation trigger)
 * - Shape-specific geometric properties
 * - Rendering context reference (e.g., SVG)
 *
 * Invariants:
 * - `shape` is immutable once defined
 * - `transformStack` always initialized with identity matrix
 * - `dirty` reflects whether re-render is required
 *
 *
 * 2. Style State (`#style`)
 * --------------------------
 * Contains:
 * - Visual properties (stroke, fill, etc.)
 * - Immutable identifier (`id`)
 *
 * Invariants:
 * - `id` is immutable after initialization
 * - Style mutations must pass validation layer
 *
 *
 * 3. Rendering Binding (`#fig`)
 * ------------------------------
 * Represents the actual rendering primitive:
 * - SVGElement (current)
 * - Future: Canvas / WebGL objects
 *
 * Invariants:
 * - Must match the assigned rendering context
 * - Must remain consistent with geometry context
 *
 *
 * ============================================================================
 * ACCESS CONTROL MODEL
 * ============================================================================
 *
 * The class enforces a dual-layer access system:
 *
 * 1. Public Safe Access:
 *    - `geometry`, `style` (readonly proxies)
 *    - Prevents direct mutation
 *
 * 2. Privileged Internal Access:
 *    - `getIGeo`, `getIStyle`, `getIFig`
 *    - Requires `accessKey` (symbol-based capability control)
 *    - Returns mutable internal references
 *
 * Security Model:
 * - Based on capability tokens (`symbol`)
 * - If accessKey is leaked → full internal mutation is possible
 *
 *
 * ============================================================================
 * MUTATION MODEL
 * ============================================================================
 *
 * All controlled mutations flow through:
 *
 *   attrs() → #setAttrs() → validators → state mutation
 *
 * Validation Layers:
 * - `#isGeometricProp` → geometry domain enforcement
 * - `#isStyleProp` → style domain enforcement
 *
 * Mutation Rules:
 * - Geometry and style domains are validated separately
 * - Certain properties are immutable (e.g., `id`, system geometry props)
 * - Invalid mutations throw errors
 *
 * Dirty Flag:
 * - Any mutation triggers `#geometry.dirty = true`
 * - Signals rendering pipeline for update
 *
 *
 * ============================================================================
 * READ MODEL
 * ============================================================================
 *
 * Attribute access flows through:
 *
 *   attrs(string) → #getAttr()
 *
 * Behavior:
 * - Style properties take precedence over geometry
 * - Some values are defensively copied (e.g., buffers)
 * - Others are returned directly (partial immutability guarantee)
 *
 * Limitation:
 * - Read-side protection is inconsistent (not fully immutable)
 *
 *
 * ============================================================================
 * RENDERING INTERACTION MODEL
 * ============================================================================
 *
 * 1. Binding:
 *    - `setIFig()` links logical model to rendering primitive
 *
 * 2. Context:
 *    - Stored in geometry
 *    - Currently supports SVG
 *    - Designed for extensibility (Canvas/WebGL)
 *
 * 3. Z-Order Control:
 *    - `toFront`, `toBack`
 *    - Direct DOM manipulation (SVG-specific)
 *    - Bypasses mutation pipeline
 *
 *
 * ============================================================================
 * TRANSFORMATION SYSTEM
 * ============================================================================
 *
 * - Maintains a transformation stack (`transformStack`)
 * - Each entry:
 *   - transformName
 *   - transformType
 *   - transformMatrix (Float32Array)
 *
 * - Initialized with identity matrix
 * - Designed for compositional transformations
 *
 *
 * ============================================================================
 * API SURFACE
 * ============================================================================
 *
 * Public Methods:
 * - attrs()      → unified getter/setter
 * - hide()       → sets visibility hidden
 * - show()       → sets visibility visible
 * - toFront()    → move forward in z-order
 * - toBack()     → move backward in z-order
 * - getContext() → retrieve rendering context
 *
 * Internal Methods:
 * - #setAttrs()
 * - #getAttr()
 * - #isGeometricProp()
 * - #isStyleProp()
 * - #createReadonlyProxy()
 *
 *
 * ============================================================================
 * DESIGN CHARACTERISTICS
 * ============================================================================
 *
 * - Hybrid Architecture:
 *   - Declarative (attrs-based state)
 *   - Imperative (DOM manipulation for structure)
 *
 * - Encapsulation:
 *   - Strong internal/private state separation
 *   - Controlled exposure via proxies
 *
 * - Validation-Driven Mutation:
 *   - All attribute changes are validated before mutation
 *
 * - Context-Aware:
 *   - Behavior varies based on rendering backend
 *
 *
 * ============================================================================
 * LIMITATIONS / KNOWN WEAKNESSES
 * ============================================================================
 *
 * 1. Inconsistent Immutability:
 *    - Write-side is controlled
 *    - Read-side partially exposed
 *
 * 2. No Transactional Safety:
 *    - Partial mutations possible on failure
 *
 * 3. Context Coupling:
 *    - SVG-specific logic embedded in core class
 *
 * 4. Domain Overlap Risk:
 *    - No strict enforcement between geometry and style domains
 *
 * 5. Performance Concerns:
 *    - Proxy creation overhead
 *    - Repeated validation per attribute
 *
 *
 *
 *
 * ============================================================================
 * EXTENSIBILITY MODEL
 * ============================================================================
 *
 * Designed to support:
 * - Multiple rendering backends (SVG, Canvas, WebGL)
 * - Additional shape types via generic parameter `T`
 * - Expanded property registries
 *
 * Requires:
 * - Context abstraction layer (not yet implemented)
 * - Centralized property registry
 *
 *
 *
 * ============================================================================
 * FINAL CHARACTERIZATION
 * ============================================================================
 *
 * This class represents a:
 *
 *   "Controlled state engine for graphical entities with partial rendering abstraction"
 *
 * It is:
 * - Structurally sound at core
 * - Complete in abstraction layers
 * - Sensitive to misuse due to mixed paradigms
 *
 * ============================================================================
 *
 * @template T - Constrained key representing a valid graphical shape type.
 */
export abstract class GraphicsModel<T extends ValidKeys> {
  /**
   * Internal graphical representation reference.
   *
   * Future Role:
   * - May hold underlying rendering primitive depending on backend:
   *   - HTMLCanvasElement
   *   - WebGL buffers / objects
   *   - SVG DOM node
   *
   * Current State:
   * - Declared but not initialized in this context.
   *
   * Access: Strictly private (encapsulation of rendering backend binding)
   */
  #fig!: GRAPHICS_TYPES;

  /**
   * Internal geometry state container.
   *
   * Composition:
   * - Common geometric properties (position, transform stack, etc.)
   * - Shape-specific geometric properties derived from `IGraphicalElementProperties<T>`
   *
   * Responsibilities:
   * - Holds transformation stack
   * - Maintains shape identity (immutable after initialization)
   * - Tracks "dirty" state for rendering invalidation
   *
   * Invariants:
   * - Must be initialized before constructor logic proceeds
   * - `shape` property becomes immutable post-definition
   *
   * Access: Private (mutations controlled internally only)
   */
  #geometry: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T] = {};

  /**
   * Internal style state container.
   *
   * Composition:
   * - Represents styling attributes applicable to the graphical node
   * - Strongly typed via `StyleForGShapeTag<T>`
   *
   * Responsibilities:
   * - Stores visual properties (stroke, fill, vector-effect, etc.)
   * - Maintains unique identifier (`id`) as immutable property
   *
   * Access: Private (exposed via readonly proxy externally)
   */
  #style: StyleForGShapeTag<T> = {} as StyleForGShapeTag<T>;

  /**
   * Internal computed style state container.
   *
   * Composition:
   * - Represents the fully resolved visual style after hierarchical propagation
   * - Strongly typed via `StyleForGShapeTag<T>`
   *
   * Responsibilities:
   * - Stores final styling attributes derived from:
   *   parent group styles + local style overrides
   * - Acts as the single source of truth for renderer consumption
   *
   * Access: Private (exposed via privileged accessor only)
   *
   * Design Notes:
   * - Derived at runtime by Engine during world resolution phase
   * - Does NOT mutate or replace original `#style`
   * - Recomputed whenever hierarchy or local style changes
   *
   * Invariant:
   * - Always reflects final visual state for the current frame
   * - No external system should write directly except Engine
   */
  #computedStyle: StyleForGShapeTag<T> = {} as StyleForGShapeTag<T>;

  /**
   * Internal z-order operation flag.
   *
   * ----------------------------------------------------------------------------
   * ROLE
   * ----------------------------------------------------------------------------
   * Represents a transient, per-frame instruction indicating how this shape
   * intends to modify its stacking order relative to sibling elements.
   *
   * ----------------------------------------------------------------------------
   * VALUE SEMANTICS
   * ----------------------------------------------------------------------------
   * -  1 → Move to front (highest z-index)
   * - -1 → Move to back (lowest z-index)
   * -  0 → No operation (default state)
   *
   * ----------------------------------------------------------------------------
   * DESIGN INTENT
   * ----------------------------------------------------------------------------
   * This is NOT a persistent state. It is a command buffer consumed by the Canvas
   * during the z-order resolution phase.
   *
   * ----------------------------------------------------------------------------
   * LIFECYCLE
   * ----------------------------------------------------------------------------
   * - Set by public APIs (`toFront`, `toBack`)
   * - Read and resolved by Canvas via internal access
   * - Cleared immediately after processing
   *
   * ----------------------------------------------------------------------------
   * INVARIANT
   * ----------------------------------------------------------------------------
   * This value must never be used directly for rendering decisions.
   * Only `style.zIndex` is authoritative for ordering.
   */
  #zOrderOp: -1 | 0 | 1 = 0;

  /**
   * Public readonly proxy for geometry.
   *
   * Characteristics:
   * - Prevents external mutation
   * - Reflects internal `#geometry` state
   *
   * Design Intent:
   * - Enforces strict separation between internal mutation logic and external consumption
   */
  public geometry!: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T];

  /**
   * Public readonly proxy for style.
   *
   * Characteristics:
   * - Prevents external mutation
   * - Reflects internal `#style` state
   *
   * Design Intent:
   * - Ensures styling is controlled via defined APIs, not direct mutation
   */
  public style!: StyleForGShapeTag<T>;

  /**
   * Constructs a new graphical model instance.
   *
   * Initialization Pipeline:
   * 1. Validates geometry container existence
   * 2. Generates unique identifier
   * 3. Defines immutable shape identity
   * 4. Initializes default styling attributes
   * 5. Defines immutable style `id`
   * 6. Initializes transformation stack with identity matrix
   * 7. Creates readonly proxies for controlled external access
   *
   * @param shapeName - Logical identifier of the shape type (immutable once assigned)
   * @param ID - Optional external identifier seed; passed through `generateId`
   *
   * @throws {Error} If geometry initialization fails
   * @throws {Error} If internal state invariants are violated
   *
   * Critical Invariants:
   * - `#geometry` must exist before mutation
   * - `shape` is immutable after definition
   * - `style.id` is immutable after assignment
   * - Transformation stack always initialized with identity matrix
   */
  constructor(shapeName: T, ID: string = '') {
    try {
      /**
       * Type assertion to ensure expected structural fields exist.
       * No runtime enforcement — purely for type system alignment.
       */
      this.#geometry as {
        transformStack: transformStack;
        shape: string;
      };

      /**
       * Defensive validation: geometry container must exist.
       */
      if (!this.#geometry) {
        throw new NotInitializedError(
          'this.#geometry',

          'Internal geometry is not initialized due to internal state corruption (internal bug).',
          'core.graphicsModel.constructor()'
        );
      }

      /**
       * Generate unique identifier for the graphical element.
       */
      const id = generateId(ID);

      /**
       * Initialize mutable fields before locking critical properties.
       */
      this.#geometry['shape'] = '';
      this.#geometry['dirty'] = true;

      /**
       * Define immutable shape identity.
       *
       * Once assigned, cannot be:
       * - Modified
       * - Reconfigured
       */
      Object.defineProperty(this.#geometry, 'shape', {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true
      });

      /**
       * Apply default styling attributes via internal attribute handler.
       *
       * Includes:
       * - Stroke width
       * - Stroke color
       * - Fill color
       * - Vector effect behavior
       */
      GraphicsModel.prototype.attrs.call(this, {
        'stroke-width': 0.5,
        stroke: new Colors('rgb(0,0,0)').isColor(),
        fill: new Colors('none').isColor(),
        'vector-effect': 'non-scaling-stroke'
      });

      /**
       * Define immutable identifier on style object.
       *
       * Acts as:
       * - DOM reference key
       * - Internal tracking identifier
       */
      Object.defineProperty(this.#style, 'id', {
        value: id,
        writable: false,
        configurable: false,
        enumerable: true
      });

      /**
       * Initialize transformation stack.
       *
       * Structure:
       * - stack: ordered list of transformation operations
       * - skip: optimization flag for transformation application
       *
       * Default State:
       * - Single identity matrix (no transformation applied)
       */
      this.#geometry['transformStack'] = {
        stack: [
          {
            transformName: 'composed',
            transformType: 'all',
            transformMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) // Identity matrix
          }
        ],
        skip: 0
      };

      this.#geometry['worldMatrix'] = new Float32Array([
        1, 0, 0, 0, 1, 0, 0, 0, 1
      ]); // Identity matrix

      this.#geometry['localMatrix'] = new Float32Array([
        1, 0, 0, 0, 1, 0, 0, 0, 1
      ]); // Identity matrix

      // ============================================================
      // Proxy Creation Phase
      // ============================================================

      /**
       * Create readonly proxy for geometry.
       *
       * Prevents:
       * - External mutation
       * - Direct state corruption
       */
      this.geometry = this.#createReadonlyProxy(this.#geometry as object);

      /**
       * Create readonly proxy for style.
       *
       * Ensures controlled styling mutations via internal APIs only.
       */
      this.style = this.#createReadonlyProxy(
        this.#style as object
      ) as StyleForGShapeTag<T>;

      // ============================================================
    } catch (e) {
      /**
       * Transparent error propagation.
       *
       * Note:
       * - No transformation of error type
       * - Caller is responsible for handling
       */
      throw e;
    }
  }

  /**
   * Retrieves the rendering context associated with this graphical model.
   *
   * Context Semantics:
   * - Represents the rendering backend context (e.g., SVG, Canvas, WebGL in future)
   * - Stored internally within the geometry state
   *
   * Behavior:
   * - Uses optional chaining to safely access `context`
   * - Returns `null` if context is undefined or not yet initialized
   *
   * @returns The rendering context if available, otherwise `null`
   *
   * Design Note:
   * - This is a safe, non-privileged accessor (no access key required)
   * - Intended for read-only contextual awareness, not mutation
   */
  public getContext() {
    return this.#geometry?.context || null;
  }

  /**
   * Provides privileged access to the internal graphical representation (`#fig`).
   *
   * Access Control:
   * - Requires a valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * Responsibilities:
   * - Exposes low-level rendering primitive
   * - Used internally by rendering subsystems or trusted modules
   *
   * @param accessKey - Symbol used to validate privileged access
   *
   * @returns Internal graphical representation (backend-specific object)
   *
   * @throws {Error} If accessKey validation fails via `assertAccess`
   *
   * Security Model:
   * - Prevents unauthorized access to rendering internals
   * - Ensures encapsulation of backend-specific implementation details
   */
  public getIFig(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#fig;
  }

  /**
   * Provides privileged access to the internal geometry state.
   *
   * Access Control:
   * - Requires a valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * Responsibilities:
   * - Grants direct mutable access to geometric state
   * - Intended for internal engine subsystems (e.g., transformation pipeline, layout engine)
   *
   * Returned Structure Includes:
   * - Transform stack
   * - Shape identity
   * - Dirty flags
   * - Shape-specific geometric properties
   *
   * @param accessKey - Symbol used to validate privileged access
   *
   * @returns Full internal geometry object (mutable reference)
   *
   * @throws {Error} If accessKey validation fails via `assertAccess`
   *
   * Critical Warning:
   * - This bypasses the readonly proxy system
   * - Any mutation here directly affects internal state
   * - Misuse can corrupt rendering pipeline invariants
   */
  public getIGeo(
    accessKey: symbol
  ): ICommonGeometricProperties['geometry'] & IGraphicalElementProperties[T] {
    assertAccess(accessKey);
    return this.#geometry;
  }

  /**
   * Provides privileged access to the internal style state.
   *
   * Access Control:
   * - Requires a valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * Responsibilities:
   * - Grants direct mutable access to styling properties
   * - Used by styling engine, theming systems, or renderer synchronization layers
   *
   * Returned Structure Includes:
   * - Stroke, fill, vector effects, and other style attributes
   * - Immutable `id` property
   *
   * @param accessKey - Symbol used to validate privileged access
   *
   * @returns Full internal style object (mutable reference)
   *
   * @throws {Error} If accessKey validation fails via `assertAccess`
   *
   * Critical Warning:
   * - Bypasses readonly proxy safeguards
   * - Direct mutation affects rendering output immediately
   * - Must be used only in controlled internal flows
   */
  public getIStyle(accessKey: symbol): StyleForGShapeTag<T> {
    assertAccess(accessKey);
    return this.#style;
  }

  /**
   * Provides privileged access to the internal computed style state.
   *
   * Access Control:
   * - Requires a valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * Responsibilities:
   * - Grants read/write access to resolved visual style
   * - Used by Engine during style resolution
   * - Used by Renderer for final style application
   *
   * Returned Structure Includes:
   * - Fully resolved styling attributes (post inheritance + overrides)
   * - Final values ready for direct rendering
   *
   * @param key - Symbol used to validate privileged access
   *
   * @returns Full computed style object (mutable reference)
   *
   * @throws {Error} If accessKey validation fails via `assertAccess`
   *
   * Critical Warning:
   * - Represents derived state, NOT user input
   * - Must not be mutated outside Engine-controlled flows
   * - Direct mutation may desynchronize visual output
   */
  public getIComputedStyle(key: symbol): StyleForGShapeTag<T> {
    assertAccess(key);
    return this.#computedStyle;
  }

  /**
   * Assigns the internal graphical representation (`#fig`) along with its rendering context.
   *
   * Access Control:
   * - Requires a valid `accessKey`
   * - Enforced via `assertAccess`
   *
   * Responsibilities:
   * - Binds a concrete rendering primitive (`shape`) to this model
   * - Associates the rendering context (`context`) with internal geometry state
   *
   * Context Handling (Current Implementation):
   * - Only supports `SVG_CONTEXT`
   * - Validates that the provided `shape` is an instance of `SVGElement`
   *
   * Behavior:
   * 1. Validates privileged access
   * 2. Checks if the provided context matches `SVG_CONTEXT`
   * 3. Ensures `shape` is a valid SVG DOM element
   * 4. Assigns `#fig` to the provided shape
   * 5. Updates geometry context if:
   *    - Geometry exists
   *    - Shape type is not `'canvas'`
   *
   * @param accessKey - Symbol used to validate privileged access
   * @param context - Rendering context identifier (currently supports SVG only)
   * @param shape - Concrete graphical object corresponding to the context
   *
   * @throws {Error} If accessKey validation fails via `assertAccess`
   * @throws {Error} If `shape` is not a valid instance for the given context
   *
   * Critical Invariants:
   * - `#fig` must always align with the provided `context`
   * - Geometry context must reflect the rendering backend
   *
   * Side Effects:
   * - Mutates internal `#fig`
   * - Mutates `#geometry.context` conditionally
   *
   * Future Extension Note:
   * - This method is explicitly designed to support multiple rendering backends:
   *   - HTML Canvas
   *   - WebGL
   * - Additional context branches must enforce strict type validation similar to SVG
   *
   * Security Note:
   * - Direct mutation of rendering binding is restricted via access key
   * - Prevents unauthorized reassignment of rendering primitives
   */
  public setIFig(accessKey: symbol, context: CONTEXT, shape: GRAPHICS_TYPES) {
    assertAccess(accessKey);

    // ============================================================
    // Context-Specific Binding Logic (Extensible Section)
    // ============================================================

    /**
     * SVG Context Handling:
     *
     * Ensures that:
     * - The rendering primitive is a valid SVG DOM element
     * - Context and shape type are consistent
     */
    if (context == SVG_CONTEXT) {
      /**
       * Runtime type validation:
       * Prevents mismatch between declared context and actual graphical element.
       */
      if (!(shape instanceof SVGElement)) {
        throw new InvalidRenderingContextError(
          shape,
          'SVGElement',
          'core.graphicsModel.setIFig()'
        );
      }

      /**
       * Bind the graphical element to internal state.
       */
      this.#fig = shape;

      /**
       * Conditionally assign context to geometry:
       *
       * Conditions:
       * - Geometry must exist
       * - Shape type must not be `'canvas'`
       *
       * Rationale:
       * - Prevents overwriting context for canvas-based shapes (special-case handling)
       */
      this.#geometry &&
        this.#geometry.shape != 'canvas' &&
        (this.#geometry['context'] = context);
    }
  }

  /**
   * Creates a deeply readonly proxy wrapper over the provided object.
   *
   * Core Mechanism:
   * - Utilizes JavaScript `Proxy` to intercept all mutation attempts
   * - Recursively wraps nested objects on access (lazy deep immutability)
   *
   * Behavior Model:
   * - Read operations (`get`) are allowed
   * - Any mutation attempt results in a runtime error
   *
   * Deep Readonly Strategy:
   * - Lazy wrapping: nested objects are proxied only when accessed
   * - Avoids upfront deep traversal (performance optimization)
   *
   * @template T - Target object type
   *
   * @param obj - The object to be wrapped in a readonly proxy
   *
   * @returns A deeply readonly version of the object (`DeepReadonly<T>`)
   *
   * @throws {Error} If any mutation operation is attempted:
   * - Property assignment
   * - Property deletion
   * - Property definition
   * - Prototype modification
   *
   * Enforced Invariants:
   * - No property of the object (or nested objects) can be mutated
   * - Object structure is frozen at runtime via proxy enforcement
   *
   * Design Intent:
   * - Provide safe external exposure of internal mutable state
   * - Ensure internal invariants cannot be violated by consumers
   *
   * Limitations:
   * - Does not prevent mutation via:
   *   - Internal references (non-proxied access)
   *   - Methods that mutate internal state without triggering proxy traps
   *
   * Performance Characteristics:
   * - Proxy creation is recursive but lazy (on-demand)
   * - May introduce overhead in deeply nested or frequently accessed structures
   *
   * Security Model:
   * - Acts as a defensive boundary, not a complete immutability guarantee
   * - Assumes internal code does not leak raw object references
   */
  #createReadonlyProxy<T extends object>(obj: T): DeepReadonly<T> {
    /**
     * Wraps a given object with the readonly proxy handler.
     *
     * @param value - Object to wrap
     * @returns Proxied object with readonly enforcement
     */
    const wrap = (value: object): object => {
      return new Proxy(value, handler);
    };

    /**
     * Proxy handler defining interception logic for all operations.
     *
     * Traps Implemented:
     * - get → enables recursive readonly wrapping
     * - set → blocks property assignment
     * - deleteProperty → blocks property deletion
     * - defineProperty → blocks property definition
     * - setPrototypeOf → blocks prototype mutation
     */
    const handler: ProxyHandler<object> = {
      /**
       * Intercepts property access.
       *
       * Behavior:
       * - Retrieves property via `Reflect.get`
       * - If value is an object → wraps it in a readonly proxy (lazy recursion)
       * - Otherwise returns primitive value directly
       *
       * @param target - Original object
       * @param prop - Property key being accessed
       * @param receiver - Proxy or object through which property is accessed
       *
       * @returns Property value (proxied if object, raw if primitive)
       */
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        /**
         * Recursive wrapping condition:
         * - Non-null
         * - Object type
         */
        if (value !== null && typeof value === 'object') {
          return wrap(value);
        }

        return value;
      },

      /**
       * Intercepts property assignment attempts.
       *
       * Always throws to enforce immutability.
       *
       * @throws {Error} On any assignment attempt
       */
      set(_, prop) {
        throw new ReadOnlyPropertyError(
          'assign to ',
          String(prop),
          'core.GraphicsModel.#createReadonlyProxy()'
        );
      },

      /**
       * Intercepts property deletion attempts.
       *
       * Always throws to enforce immutability.
       *
       * @throws {Error} On any deletion attempt
       */
      deleteProperty(_, prop) {
        throw new ReadOnlyPropertyError(
          'delete',
          String(prop),
          'core.GraphicsModel.#createReadonlyProxy()'
        );
      },

      /**
       * Intercepts property definition attempts.
       *
       * Always throws to enforce immutability.
       *
       * @throws {Error} On any defineProperty attempt
       */
      defineProperty(_, prop) {
        throw new ReadOnlyPropertyError(
          'define',
          String(prop),
          'core.GraphicsModel.#createReadonlyProxy()'
        );
      },

      /**
       * Intercepts prototype modification attempts.
       *
       * Always throws to prevent structural mutation.
       *
       * @throws {Error} On prototype modification attempt
       */
      setPrototypeOf() {
        throw new ReadOnlyPropertyError(
          'modify prototype of ',
          '',
          'core.GraphicsModel.#createReadonlyProxy()'
        );
      }
    };

    /**
     * Root-level proxy creation.
     *
     * Entry point for readonly enforcement.
     */
    return new Proxy(obj, handler) as DeepReadonly<T>;
  }

  /**
   * Determines whether a given property key belongs to the geometric domain
   * of the current graphical model.
   *
   * Classification Logic:
   * - Checks if the property is part of:
   *   1. Shape-specific geometric properties (derived from `GraphicalElementProperties`)
   *   2. Common geometric properties (derived from `CommonGeometricProperties.geometry`)
   *
   * Behavior:
   * - Returns `true` if the property is a valid, mutable geometric property
   * - Throws an error if the property belongs to readonly system-level geometry
   * - Returns `false` if the property is not part of geometric properties
   *
   * @param prop - Property key to validate (may be undefined)
   *
   * @returns `true` if the property is a valid geometric property, otherwise `false`
   *
   * @throws {Error} If the property belongs to readonly common geometric properties
   *
   * Internal Flow:
   * 1. Rejects undefined or empty property keys
   * 2. Extracts current shape identity from internal geometry
   * 3. Validates against shape-specific geometric property registry
   * 4. Falls back to common geometric properties:
   *    - If found → treated as readonly → throws error
   * 5. Otherwise returns `false`
   *
   * Invariants:
   * - Shape must be defined in `GraphicalElementProperties` for shape-specific checks
   * - Common geometric properties are strictly readonly and cannot be reassigned
   *
   * Design Intent:
   * - Enforces strict separation between:
   *   - Mutable geometric properties (shape-specific)
   *   - Immutable system-level properties (common geometry)
   *
   * Critical Note:
   * - This method does not mutate state
   * - It acts as a gatekeeper for mutation logic elsewhere in the system
   *
   * Error Semantics:
   * - Uses exception to block illegal mutation attempts on readonly properties
   * - Caller must handle this explicitly
   */
  #isGeometricProp(prop: string | undefined): boolean {
    try {
      /**
       * Early exit for invalid property input.
       */
      if (!prop) return false;

      /**
       * Resolve current shape identity from internal geometry.
       *
       * Used to determine shape-specific property scope.
       */
      const shape = this.#geometry?.shape as
        | keyof typeof GraphicalElementProperties
        | undefined;

      /**
       * Case 1: Property belongs to shape-specific geometric properties.
       *
       * Conditions:
       * - Shape is defined
       * - Shape exists in registry
       * - Property exists within that shape's geometric definition
       */
      if (
        shape &&
        shape in GraphicalElementProperties &&
        prop in
          GraphicalElementProperties[shape as keyof IGraphicalElementProperties]
      ) {
        return true;
      } else if (prop in CommonGeometricProperties.geometry) {
        /**
         * Case 2: Property belongs to common geometric properties.
         *
         * These are treated as:
         * - System-level
         * - Immutable
         * - Protected against reassignment
         */

        throw new ReadOnlyPropertyError(
          'assign to',
          String(prop),
          'core.GraphicsModel.#isGeometricProp()'
        );
      }

      /**
       * Case 3: Property is not part of any geometric domain.
       */
      return false;
    } catch (e) {
      /**
       * Transparent error propagation.
       */
      throw e;
    }
  }

  /**
   * Determines whether a given property key belongs to the style domain
   * of the current graphical model.
   *
   * Classification Logic:
   * - Validates property against shape-specific style property registry
   *   (`AllGShapeStyleProperties`)
   *
   * Enforcement Rules:
   * - Certain properties are treated as immutable system-level attributes:
   *   - `id` → immutable identifier
   *   - `inside` → structural/internal reference
   *   - `d` → path definition (restricted to 'path' shape only)
   *
   * Behavior:
   * - Returns `true` if the property is a valid style property for the current shape
   * - Throws an error if the property is restricted (immutable or contextually invalid)
   * - Returns `false` if the property is not part of the style domain
   *
   * @param prop - Property key to validate (may be undefined)
   *
   * @returns `true` if valid style property, otherwise `false`
   *
   * @throws {Error} If:
   * - Attempting to modify immutable properties (`id`, `inside`)
   * - Attempting to modify path definition (`d`) on non-path shapes
   *
   * Internal Flow:
   * 1. Resolves current shape from geometry (defaults to `'path'` if undefined)
   * 2. Rejects invalid or undefined property input
   * 3. Enforces immutability rules for reserved properties
   * 4. Validates property existence within shape-specific style registry
   *
   * Invariants:
   * - `id` is immutable after instantiation
   * - `inside` is system-controlled and not user-modifiable
   * - `d` is only valid for `'path'` shapes
   *
   * Design Intent:
   * - Acts as a gatekeeper for style mutation logic
   * - Enforces structural integrity of graphical elements
   * - Prevents illegal or contextually invalid style assignments
   *
   * Critical Note:
   * - This method is not a pure predicate:
   *   - It performs validation and throws errors for invalid mutation attempts
   * - Callers must handle exceptions explicitly
   *
   * Domain Separation:
   * - Style properties are shape-dependent
   * - Validation relies on `AllGShapeStyleProperties` registry
   */
  #isStyleProp(prop: string | undefined): boolean {
    /**
     * Resolve current shape.
     *
     * Fallback:
     * - Defaults to `'path'` if shape is undefined
     *   (implicit assumption of path-like structure)
     */
    const shape = this.#geometry?.shape ?? 'path';

    /**
     * Early exit for invalid property input.
     */
    if (!prop) return false;

    /**
     * Immutable property enforcement:
     *
     * - `id` → unique identifier (assigned during initialization)
     * - `inside` → internal structural linkage
     */
    if (prop == 'id' || prop == 'inside' || prop == 'transform')
      throw new ReadOnlyPropertyError(
        'assign to',
        String(prop),
        'core.GraphicsModel.#isStyleProp()'
      );

    /**
     * Shape-specific style property validation.
     *
     * Checks if:
     * - Shape exists in style registry
     * - Property belongs to that shape's allowed style properties
     */
    if (shape in AllGShapeStyleProperties) {
      return (
        prop in
        AllGShapeStyleProperties[shape as keyof typeof AllGShapeStyleProperties]
      );
    }

    /**
     * Property does not belong to style domain.
     */
    return false;
  }

  /**
   * Internal mutation entry-point for assigning attributes to the graphical model.
   *
   * Scope of Responsibility:
   * - Routes attribute assignments to either:
   *   - Geometry domain (`#geometry`)
   *   - Style domain (`#style`)
   * - Enforces domain constraints via:
   *   - `#isGeometricProp`
   *   - `#isStyleProp`
   *
   * Input Contract:
   * - Accepts a key-value object containing attribute(s)
   * - Only processes the first entry in the object
   *
   * Behavior:
   * 1. Validates internal geometry existence
   * 2. Validates input object structure and non-emptiness
   * 3. Extracts the first key-value pair from the input
   * 4. Determines domain of the property:
   *    - If geometric → assigns to `#geometry`
   *    - If style → assigns to `#style`
   * 5. Marks geometry as dirty (trigger for re-render/update pipeline)
   *
   * @param prop - Object containing attribute key-value pairs
   *
   * @returns void
   *
   * @throws {Error} If:
   * - Property violates geometric constraints (`#isGeometricProp`)
   * - Property violates style constraints (`#isStyleProp`)
   * - Any internal validation fails
   *
   * Side Effects:
   * - Mutates internal `#geometry` and/or `#style`
   * - Sets `#geometry.dirty = true` unconditionally after processing
   *
   * Critical Invariants:
   * - Only valid geometric properties can mutate `#geometry`
   * - Only valid style properties can mutate `#style`
   * - Invalid or restricted properties trigger exceptions upstream
   *
   * Design Characteristics:
   * - Central mutation gateway for attribute updates
   * - Delegates validation to domain-specific validators
   * - Does not batch-process multiple properties (single-entry processing only)
   *
   * Limitations:
   * - Ignores all entries except the first in the input object
   * - No explicit handling for conflicting keys (geometry vs style overlap)
   * - No type coercion or normalization of values
   *
   * Performance Note:
   * - Minimal overhead per call
   * - Validation cost depends on registry lookups in validator methods
   *
   * Usage Context:
   * - Intended for internal use only
   * - Should not be exposed directly to external consumers
   */
  #setAttrs(prop: { [key: string]: string | number }): void {
    try {
      /**
       * Guard: geometry must exist for mutation to proceed.
       */
      if (!this.#geometry) return;

      /**
       * Guard: input must be a non-empty object.
       */
      if (typeof prop !== 'object' || Object.keys(prop).length == 0) return;

      /**
       * Extract the first key-value pair only.
       *
       * NOTE:
       * - Remaining properties (if any) are ignored.
       */
      let [key, value] = Object.entries(prop)[0]!;

      /**
       * Route to geometry domain if property qualifies.
       *
       * Validator may throw if property is restricted.
       */
      if (this.#isGeometricProp(key)) {
        (this.#geometry as Record<string, string | number>)[key] = value;

        /**
         * Mark geometry as dirty to signal downstream systems
         * (e.g., renderer, layout engine) for update/recalculation.
         */
        this.#geometry.dirty = true;
      } else if (typeof this.#style == 'object' && this.#isStyleProp(key)) {
        /**
         * Route to style domain if property qualifies.
         *
         * Validator may throw if property is restricted.
         */
        (this.#style as Record<string, string | number>)[key] = value;
      } else {
        throw new InvalidOptionError(
          key,
          'undefined',
          [],
          'core.graphicsModel.#setAttrs()'
        );
      }
    } catch (e) {
      /**
       * Transparent error propagation.
       */
      throw e;
    }
  }

  /**
   * Internal accessor for retrieving attribute values from the graphical model.
   *
   * Scope of Responsibility:
   * - Provides unified access to both:
   *   - Style properties (`#style`)
   *   - Geometric properties (`#geometry`)
   *
   * Resolution Priority:
   * 1. Style domain (`#style`)
   * 2. Geometry domain (`#geometry`)
   *
   * Behavior:
   * 1. Validates input key
   * 2. Checks for property in style object:
   *    - If found → returns value directly
   * 3. Otherwise checks in geometry object:
   *    - Applies special handling for specific keys:
   *      - `buffer` → returns a copied `Float32Array`
   *      - `transformStack` → returns a shallow cloned object
   *    - Returns value directly for all other keys
   * 4. Returns `undefined` if key is not found in either domain
   *
   * @param key - Attribute key to retrieve
   *
   * @returns Value corresponding to the key, or `undefined` if not found
   *
   * @throws {Error} Propagates any internal errors encountered during access
   *
   * Domain Rules:
   * - Style properties take precedence over geometry properties if overlap exists
   *
   * Special Handling:
   * - `buffer`:
   *   - Returns a new `Float32Array` via `.slice()`
   *   - Prevents external mutation of internal buffer data
   *
   * - `transformStack`:
   *   - Returns a new object using `Object.create`
   *   - Intended to avoid direct reference exposure (partial isolation)
   *
   * Invariants:
   * - Internal state must not be directly exposed in mutable form
   * - Sensitive structures are returned as copies (or partial copies)
   *
   * Limitations:
   * - Copy strategy is inconsistent:
   *   - `buffer` → deep copy (safe)
   *   - `transformStack` → prototype-based shallow copy (unsafe)
   * - No deep cloning for nested structures within geometry
   * - No validation of key domain before access
   *
   * Design Intent:
   * - Provide controlled read access to internal state
   * - Prevent accidental external mutation of critical structures
   *
   * Security Model:
   * - Partial defensive copying to reduce mutation risk
   * - Relies on caller discipline for non-protected properties
   */
  #getAttr(key: string): getAttrsMethodsReturnTypes {
    try {
      /**
       * Guard: invalid or empty key results in undefined.
       */
      if (!key) return undefined;

      /**
       * Step 1: Check style domain first.
       *
       * Style properties take precedence over geometry properties.
       */
      if (this.#style && key in this.#style) {
        return (this.#style as Record<string, string | number>)[key];
      } else if (this.#geometry && key in this.#geometry) {
        /**
         * Step 2: Check geometry domain.
         */
        const value = (
          this.#geometry as Record<
            string,
            string | number | Float32Array | object
          >
        )[key];

        /**
         * Special Case: buffer
         *
         * Returns a copy of the Float32Array to prevent external mutation.
         */
        if (key === 'buffer') {
          return (value as Float32Array).slice();
        } else if (key == 'transformStack') {
          /**
           * Special Case: transformStack
           *
           * Returns a new object with the original as prototype.
           * Intended to avoid direct reference exposure.
           */
          return Object.create(value as object);
        } else {
          /**
           * Default Case:
           * Return value directly.
           */
          return value;
        }
      } else {
        throw new InvalidOptionError(
          key,
          'undefined',
          [],
          'core.graphicsModel.#setAttrs()'
        );
      }
    } catch (e) {
      /**
       * Transparent error propagation.
       */
      throw e;
    }
  }

  /**
   * Unified public interface for attribute mutation (setter) and retrieval (getter).
   *
   * Dual-Mode Behavior:
   * - Setter Mode → when `props` is an object
   * - Getter Mode → when `props` is a string
   *
   * ---------------------------------------------------------------------------
   * Setter Mode (Write Path)
   * ---------------------------------------------------------------------------
   * Input:
   * - Object containing key-value pairs of attributes
   *
   * Behavior:
   * 1. Validates non-empty object
   * 2. Iterates through all entries
   * 3. Delegates each key-value pair to `#setAttrs`
   *
   * Effects:
   * - Mutates internal state (`#geometry`, `#style`)
   * - Triggers validation via:
   *   - `#isGeometricProp`
   *   - `#isStyleProp`
   * - Marks geometry as dirty (via `#setAttrs`)
   *
   * Notes:
   * - Each property is processed independently
   * - No batching optimization (multiple calls to `#setAttrs`)
   *
   * ---------------------------------------------------------------------------
   * Getter Mode (Read Path)
   * ---------------------------------------------------------------------------
   * Input:
   * - String containing one or more attribute keys separated by spaces
   *
   * Behavior:
   * 1. Splits input string by whitespace
   * 2. If multiple keys:
   *    - Uses two-pointer traversal (front + back)
   *    - Resolves attributes via `#getAttr`
   *    - Returns array of results
   * 3. If single key:
   *    - Returns value directly
   *
   * Return Semantics:
   * - Single key → returns single value
   * - Multiple keys → returns array of values
   *
   * ---------------------------------------------------------------------------
   * @param props - Either:
   * - Object → for setting attributes
   * - String → for retrieving attributes
   *
   * @returns
   * - Setter Mode → `void`
   * - Getter Mode → single value or array of values (`attrsMethodReturnTypes`)
   *
   * @throws {Error} Propagates any errors from:
   * - `#setAttrs`
   * - `#getAttr`
   * - Validation layers
   *
   * ---------------------------------------------------------------------------
   * Guard Conditions:
   * - Empty object → no-op
   * - Empty string → no-op
   *
   * ---------------------------------------------------------------------------
   * Design Intent:
   * - Provide a single unified API for attribute interaction
   * - Minimize external API surface
   * - Abstract internal domain separation (geometry vs style)
   *
   * ---------------------------------------------------------------------------
   * Critical Characteristics:
   * - Overloaded behavior based on runtime type
   * - Delegates all core logic to internal methods
   * - Does not enforce domain-level validation directly
   *
   * ---------------------------------------------------------------------------
   * Limitations:
   * - Ambiguous return type (depends on input structure)
   * - No compile-time safety for getter keys
   * - No batching optimization for setter path
   * - No error differentiation (all errors propagated generically)
   *
   * ---------------------------------------------------------------------------
   * Usage Patterns:
   *
   * Setter:
   *   attrs({ x: 10, y: 20, fill: 'red' })
   *
   * Getter (single):
   *   attrs('x')
   *
   * Getter (multiple):
   *   attrs('x y fill') → [10, 20, 'red']
   */
  public attrs(props: Object | string): attrsMethodReturnTypes {
    try {
      // ============================================================
      // Setter Mode
      // ============================================================

      /**
       * Guard clause:
       * - Ignore empty object or empty string input
       */
      if (
        (typeof props === 'object' && Object.keys(props).length === 0) ||
        (typeof props === 'string' && props.trim() === '')
      )
        return;

      /**
       * Setter Path:
       * - Iterate through all key-value pairs
       * - Delegate each to internal mutation handler
       */
      if (typeof props === 'object') {
        const entries = Object.entries(props);

        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i]!;

          /**
           * Each attribute is processed independently.
           * Validation and mutation handled inside `#setAttrs`.
           */
          this.#setAttrs({ [key]: value });
        }

        // ============================================================
        // Getter Mode
        // ============================================================
      } else if (typeof props === 'string') {
        /**
         * Split input string into attribute keys.
         */
        const result: getAttrsMethodsReturnTypes[] = props.trim().split(' ');

        /**
         * Multi-key retrieval.
         *
         * Uses two-pointer traversal:
         * - Processes from both ends toward center
         * - Reduces iteration overhead marginally
         */
        if (result.length > 1) {
          for (let f = 0, l = result.length - 1; f <= l; f++, l--) {
            if (f == l) {
              result[f] = this.#getAttr((result[f] as string).trim());
              break;
            }

            result[f] = this.#getAttr((result[f] as string).trim());
            result[l] = this.#getAttr((result[l] as string).trim());
          }

          /**
           * Return array if multiple results exist.
           */
          return result.length > 1 ? result : result[0];
        }

        /**
         * Single-key retrieval.
         */
        return this.#getAttr((result[0] as string).trim());
      }
    } catch (e) {
      /**
       * Transparent error propagation.
       */
      throw e;
    }
  }

  /**
   * Sets the visibility of the graphical element to hidden.
   *
   * Behavior:
   * - Delegates attribute mutation to `#setAttrs`
   * - Assigns `visibility: 'hidden'` to the style domain
   *
   * Effects:
   * - Updates internal style state (`#style.visibility`)
   * - Marks geometry as dirty (via `#setAttrs`)
   * - Triggers downstream rendering update pipeline
   *
   * Context Dependency:
   * - Current implementation assumes SVG-compatible `visibility` property
   * - Future implementations may adapt behavior based on rendering backend:
   *   - Canvas → may require manual redraw suppression
   *   - WebGL → may involve shader/state toggling
   *
   * @returns void
   *
   * Side Effects:
   * - Mutates internal state
   * - Forces re-render through dirty flag propagation
   *
   * Design Intent:
   * - Provide a semantic abstraction over direct style manipulation
   * - Encapsulate visibility control behind a method instead of raw attribute mutation
   *
   * Limitations:
   * - Relies on `#isStyleProp` validation indirectly
   * - No check for current visibility state (idempotency not enforced explicitly)
   */
  public hide(): void {
    // ============================================================
    // Context-Specific Behavior Placeholder
    // ============================================================

    /**
     * Sets visibility to hidden via attribute mutation pipeline.
     */
    this.#setAttrs({ visibility: 'hidden' });
  }

  /**
   * Sets the visibility of the graphical element to visible.
   *
   * Behavior:
   * - Delegates attribute mutation to `#setAttrs`
   * - Assigns `visibility: 'visible'` to the style domain
   *
   * Effects:
   * - Updates internal style state (`#style.visibility`)
   * - Marks geometry as dirty (via `#setAttrs`)
   * - Triggers downstream rendering update pipeline
   *
   * Context Dependency:
   * - Current implementation assumes SVG-compatible `visibility` property
   * - Future implementations may adapt behavior based on rendering backend:
   *   - Canvas → may require explicit redraw logic
   *   - WebGL → may involve enabling/disabling draw calls
   *
   * @returns void
   *
   * Side Effects:
   * - Mutates internal state
   * - Forces re-render through dirty flag propagation
   *
   * Design Intent:
   * - Provide a semantic abstraction over direct style manipulation
   * - Maintain API consistency for visibility control
   *
   * Limitations:
   * - No validation of current state (redundant updates possible)
   * - Depends on style system recognizing `visibility` property
   */
  public show(): void {
    // ============================================================
    // Context-Specific Behavior Placeholder
    // ============================================================

    /**
     * Sets visibility to visible via attribute mutation pipeline.
     */
    this.#setAttrs({ visibility: 'visible' });
  }

  /**
   * Requests this shape to be moved to the front (top-most position).
   *
   * ----------------------------------------------------------------------------
   * BEHAVIOR
   * ----------------------------------------------------------------------------
   * Sets an internal intent flag. Actual z-index mutation is deferred to Canvas.
   *
   * ----------------------------------------------------------------------------
   * SIDE EFFECTS
   * ----------------------------------------------------------------------------
   * No immediate DOM or ordering changes occur.
   *
   * ----------------------------------------------------------------------------
   * DESIGN NOTE
   * ----------------------------------------------------------------------------
   * This method does NOT directly mutate `zIndex` to preserve encapsulation.
   */
  public toFront(): void {
    this.#zOrderOp = 1;
  }

  /**
   * Requests this shape to be moved to the back (bottom-most position).
   *
   * ----------------------------------------------------------------------------
   * BEHAVIOR
   * ----------------------------------------------------------------------------
   * Sets an internal intent flag. Actual z-index mutation is deferred to Canvas.
   */
  public toBack(): void {
    this.#zOrderOp = -1;
  }

  /**
   * INTERNAL: Returns the pending z-order operation.
   *
   * ----------------------------------------------------------------------------
   * ACCESS CONTROL
   * ----------------------------------------------------------------------------
   * Restricted via `DEV_INTERNAL_ACCESS` to prevent external mutation or misuse.
   *
   * ----------------------------------------------------------------------------
   * RETURNS
   * ----------------------------------------------------------------------------
   * -1 | 0 | 1 → current pending z-order intent
   *
   * ----------------------------------------------------------------------------
   * INVARIANT
   * ----------------------------------------------------------------------------
   * Must only be called by system components (Canvas / Engine).
   */
  public getZOrderOp(key: symbol): -1 | 0 | 1 {
    assertAccess(key);
    return this.#zOrderOp;
  }

  /**
   * INTERNAL: Clears the z-order operation flag.
   *
   * ----------------------------------------------------------------------------
   * ROLE
   * ----------------------------------------------------------------------------
   * Resets the intent after it has been consumed by Canvas.
   *
   * ----------------------------------------------------------------------------
   * INVARIANT
   * ----------------------------------------------------------------------------
   * Must always be called after processing to avoid repeated application.
   */
  public clearZOrderOp(key: symbol): void {
    assertAccess(key);
    this.#zOrderOp = 0;
  }
}
