/* -------------------------------------------------------------------------- */
/*                                   Errors                                   */
/* -------------------------------------------------------------------------- */

import {
  InvalidOptionError,
  NotInitializedError,
  ReadOnlyPropertyError,
} from "../../errors/index.js";

/* -------------------------------------------------------------------------- */
/*                         Internal Development Keys                          */
/* -------------------------------------------------------------------------- */

import {
  assertAccess,
  CLEAR_Z_ORDER_OPERATION_METHOD,
  GET_INTERNAL_COMPUTED_STYLE_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  GET_PARENT_METHOD,
  GET_Z_ORDER_OPERATION_METHOD,
  SET_INTERNAL_GRAPHICS_METHOD,
  SET_PARENT_METHOD,
} from "../../internal/keys/dev-keys.js";

/* -------------------------------------------------------------------------- */
/*                   Graphics Interfaces + Helpers Types                      */
/* -------------------------------------------------------------------------- */

import type { IGraphicsModel } from "../../models/interfaces/graphics-model";

import type {
  InternalGeometry,
  InternalStyle,
  PublicGeometry,
  PublicStyle,
  ValidGraphicsShapes,
} from "../../models/types/graphics-model";

/* -------------------------------------------------------------------------- */
/*                                Common Types                                */
/* -------------------------------------------------------------------------- */

import type {
  AttrsMethodPropsTypes,
  AttrsMethodReturnTypes,
  GetAttrsMethodsReturnTypes,
  GRAPHICS_TYPES,
  TransformStack,
} from "../../models/types/common";

import type { DeepReadonly } from "../../models/types/graphics-model";

/* -------------------------------------------------------------------------- */
/*                       Common Property Definitions                          */
/* -------------------------------------------------------------------------- */

import {
  AllGShapeStyleProperties,
  CommonGeometricProperties,
} from "../../property-definitions/common/common-properties.js";

/* -------------------------------------------------------------------------- */
/*                      Shape Property Definitions                            */
/* -------------------------------------------------------------------------- */

import { GraphicalElementProperties } from "../../property-definitions/specific/specific-properties.js";

/* -------------------------------------------------------------------------- */
/*                              Utility Modules                               */
/* -------------------------------------------------------------------------- */

import Colors from "../../utils/colors/colors.js";

import { generateId } from "../../utils/helpers/helpers.js";

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
 *   | (#geometry/#style) |
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
 *
 * Invariants:
 * - `shape` is immutable once defined
 * - `transformStack` always initialized with identity matrix
 * - Dirty flags reflect whether re-render is required
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
 * Represents the renderer-specific graphical binding associated
 * with the logical graphics model.
 *
 * Possible bindings include:
 * - SVG DOM elements
 * - Canvas renderer objects
 * - WebGL resources
 * - Future backend-specific rendering primitives
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
 *    - Exposed through DeepReadonly type contracts
 *
 * 2. Privileged Internal Access Through Computed Methods:
 *    - Requires `accessKey` (symbol-based capability control)
 *    - Returns mutable internal references
 *
 * Internal engine operations are exposed through symbol-keyed
 * computed methods to reduce accidental external access and
 * provide capability-based internal mutation control.
 *
 * Security Model:
 * - Based on capability tokens (`symbol`)
 * - If accessKey is leaked → full internal mutation is possible
 *
 *
 * ============================================================================
 * TYPE SAFETY MODEL
 * ============================================================================
 *
 * The class uses a layered generic type system to enforce:
 * - Shape-specific geometry contracts
 * - Shape-specific style contracts
 * - Separation between mutable internal state and readonly public state
 *
 * Core Type Layers:
 * - `InternalGeometry<T>`
 * - `PublicGeometry<T>`
 * - `InternalStyle<T>`
 * - `PublicStyle<T>`
 *
 * Public-facing state is exposed through:
 * - Runtime readonly proxy enforcement
 * - Compile-time DeepReadonly type contracts
 *
 * Internal state remains mutable for:
 * - Renderer operations
 * - Validation pipelines
 * - Mutation systems
 * - Transform propagation
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
 * - Any mutation triggers dirty state update
 * - Signals rendering pipeline for update
 *
 *
 * ============================================================================
 * INTERNAL COMPUTED MUTATION / ACCESS METHODS
 * ============================================================================
 *
 * The class exposes a controlled set of symbol-keyed computed methods
 * for privileged internal engine operations.
 *
 * These methods:
 * - Bypass the public readonly API layer
 * - Allow direct mutable internal state access
 * - Are protected through capability-based access validation
 * - Require internal access key verification through `assertAccess()`
 *
 * Security Characteristics:
 * - Access is symbol-token based
 * - Unauthorized access attempts throw validation errors
 * - Intended strictly for renderer and engine subsystems
 *
 * Internal Access / Mutation Methods:
 *
 * Geometry Access:
 * - `GET_INTERNAL_GEOMETRY_METHOD`
 *   → Returns mutable internal geometry state reference
 *
 * Style Access:
 * - `GET_INTERNAL_STYLE_METHOD`
 *   → Returns mutable internal style state reference
 *
 * Computed Style Access:
 * - `GET_INTERNAL_COMPUTED_STYLE_METHOD`
 *   → Returns internally computed style representation
 *
 * Graphics Binding Access:
 * - `SET_INTERNAL_GRAPHICS_METHOD`
 *   → Assigns renderer-specific graphical binding (`#fig`)
 *
 * - `GET_INTERNAL_GRAPHICS_METHOD`
 *   → Returns renderer-specific graphical binding reference
 *
 * Parent Hierarchy Access:
 * - `SET_PARENT_METHOD`
 *   → Assigns structural parent relationship
 *
 * - `GET_PARENT_METHOD`
 *   → Returns structural parent reference
 *
 * Z-Order Operations:
 * - `GET_Z_ORDER_OPERATION_METHOD`
 *   → Returns current pending z-order operation state
 *
 * - `CLEAR_Z_ORDER_OPERATION_METHOD`
 *   → Clears pending z-order operation state
 *
 * Architectural Purpose:
 * - Separates public safe API from privileged engine operations
 * - Enables renderer synchronization without exposing mutable state publicly
 * - Preserves strong encapsulation boundaries while supporting
 *   internal engine orchestration
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
 * - Geometry domain lookup takes precedence over style domain lookup
 * - Some values are defensively copied (e.g., buffers)
 *
 *
 * ============================================================================
 * RENDERING INTERACTION MODEL
 * ============================================================================
 *
 * 1. Binding:
 *    - `SET_INTERNAL_GRAPHICS_METHOD()` links logical model to rendering primitive
 *
 * 2. Internal State Access:
 *    - Internal geometry/style access exposed through symbol-keyed computed methods
 *    - Used by renderer and engine subsystems
 *
 * 3. Z-Order Control:
 *    - `toFront`, `toBack`
 *    - Updates only zIndex state in geometry
 *    - Engine handles zIndex computation and ordering
 *
 *
 * ============================================================================
 * TRANSFORMATION SYSTEM
 * ============================================================================
 *
 * - Maintains a transformation stack (`transformStack`)
 *
 * Structure:
 * - `stack` → ordered collection of transformation matrices
 * - `skip`  → optimization flag for transformation processing
 *
 * Matrix Representation:
 * - Uses `Float32Array`
 * - Identity matrix initialized by default
 *
 * Designed for:
 * - Compositional transformations
 * - Hierarchical transform propagation
 * - Renderer-side matrix computation
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
 * - Declarative Architecture:
 *   - Declarative attrs-based state interaction
 *
 * - Encapsulation:
 *   - Strong internal/private state separation
 *   - Controlled exposure via readonly proxies
 *   - Interface-driven state contracts
 *
 * - Validation-Driven Mutation:
 *   - All attribute changes are validated before mutation
 *
 * - Strong Typing:
 *   - Shape-aware generic specialization
 *   - DeepReadonly public state contracts
 *   - Internal mutable engine state separation
 *
 *
 * ============================================================================
 * LIMITATIONS / KNOWN WEAKNESSES
 * ============================================================================
 *
 * 1. Inconsistent Runtime Immutability:
 *    - Runtime immutability depends on proxy enforcement
 *    - Deep nested runtime objects may still require defensive handling
 *
 * 2. No Transactional Safety:
 *    - Partial mutations may occur on failure
 *
 * 3. Domain Overlap Risk:
 *    - Geometry/style domains rely on validator separation
 *
 * 4. Performance Concerns:
 *    - Proxy creation overhead
 *    - Recursive proxy wrapping cost
 *    - Repeated validation per attribute mutation
 *
 * 5. Proxy Identity Concerns:
 *    - Recursive proxy wrapping may affect object identity semantics
 *    - Equality-sensitive systems may require additional handling
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
 * - Renderer-specific graphical bindings
 *
 * Requires:
 * - Centralized property registry
 * - Consistent renderer integration contracts
 *
 *
 * ============================================================================
 * FINAL CHARACTERIZATION
 * ============================================================================
 *
 * This class represents a:
 *
 *   "Controlled state engine for graphical entities with strong
 *    interface-driven contractual architecture."
 *
 * It is:
 * - Structurally sound at core
 * - Strongly typed through layered contracts
 * - Complete in abstraction layering
 * - Designed as the primary logical data model for graphical entities
 *
 * ============================================================================
 *
 * @template T - Constrained key representing a valid graphical shape type.
 */

export abstract class GraphicsModel<
  T extends ValidGraphicsShapes,
> implements IGraphicsModel<T> {
  /**
   * Internal renderer-bound graphics implementation reference.
   *
   * Architectural Purpose:
   * - Stores the low-level backend-specific graphics object associated
   *   with the current graphics entity.
   * - Acts as an internal bridge between the abstract scene graph layer
   *   and the concrete rendering backend implementation.
   *
   * Possible Backend Bindings:
   * - Canvas rendering primitives
   * - SVG DOM elements
   * - WebGL buffers, programs, or GPU resources
   * - Future renderer-specific native objects
   *
   * Access Characteristics:
   * - Strictly private to prevent external renderer mutation.
   * - Controlled only through internal rendering systems.
   *
   * Lifecycle:
   * - Assigned internally during renderer attachment or entity creation.
   * - Backend type depends on active rendering pipeline.
   */
  #fig!: GRAPHICS_TYPES;

  /**
   * Internal scene graph parent reference.
   *
   * Architectural Purpose:
   * - Stores the hierarchical parent entity of the current graphics node.
   * - Enables scene graph traversal, hierarchical transforms,
   *   inheritance propagation, and structural ownership.
   *
   * Behavioral Characteristics:
   * - Forms parent-child relationships between graphics entities.
   * - Used internally for scene management and rendering organization.
   * - May represent containers, groups, layers, or composite nodes.
   *
   * Access Characteristics:
   * - Strictly internal scene graph linkage.
   * - Not intended for uncontrolled external mutation.
   *
   * Generic Reasoning:
   * - Uses `GraphicsModel<ValidGraphicsShapes>` intentionally because parent nodes
   *   may contain heterogeneous graphics shape types.
   */
  #parent!: GraphicsModel<ValidGraphicsShapes>;

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
  #geometry: InternalGeometry<T> = {};

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
  #style: InternalStyle<T> = {} as InternalStyle<T>;

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
  #computedStyle: InternalStyle<T> = {} as InternalStyle<T>;

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
  //  public geometry!: ICommonGeometricProperties['geometry'] &
  //   IGraphicalElementProperties[T];

  public geometry!: PublicGeometry<T>;
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
  public style!: PublicStyle<T>;

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

  constructor(shapeName: T, ID: string = "") {
    try {
      /**
       * Local structural references.
       *
       * Purpose:
       * - Avoid repeated private field access
       * - Improve constructor readability
       * - Centralize mutable initialization flow
       */
      const internalGeometry = this.#geometry as {
        transformStack: TransformStack;
        shape: string;
        localDirty: boolean;
        worldMatrix: Float32Array;
        localMatrix: Float32Array;
      };

      const style = this.#style;

      /**
       * Defensive validation.
       */
      if (!internalGeometry) {
        throw new NotInitializedError(
          "this.#geometry",
          "Internal geometry is not initialized due to internal state corruption (internal bug).",
          "core.graphicsModel.constructor()",
        );
      }

      /**
       * Immutable graphical identifier.
       */
      const id = generateId(ID);

      /**
       * Shared identity matrix.
       *
       * Purpose:
       * - Reduce repeated allocations
       * - Improve constructor clarity
       */
      const identityMatrix = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

      // ============================================================
      // Geometry Initialization
      // ============================================================

      internalGeometry.localDirty = true;

      Object.defineProperty(internalGeometry, "shape", {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true,
      });

      internalGeometry.transformStack = {
        stack: [identityMatrix],
        skip: 0,
      };

      internalGeometry.worldMatrix = new Float32Array(identityMatrix);

      internalGeometry.localMatrix = new Float32Array(identityMatrix);

      // ============================================================
      // Default Style Initialization
      // ============================================================

      const color = new Colors("rgb(0,0,0)");

      GraphicsModel.prototype.attrs.call(this, {
        "stroke-width": 0.5,
        stroke: color.isColor(),
        fill: color.isColor("none", true)[1],
      });

      Object.defineProperty(style, "id", {
        value: id,
        writable: false,
        configurable: false,
        enumerable: true,
      });

      // ============================================================
      // Readonly Proxy Initialization
      // ============================================================

      this.geometry = this.#createReadonlyProxy(
        internalGeometry,
      ) as PublicGeometry<T>;
      this.style = this.#createReadonlyProxy(style as object) as PublicStyle<T>;

      // ============================================================
    } catch (e) {
      throw e;
    }
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
   *
   * Security Note:
   * - Direct mutation of rendering binding is restricted via access key
   * - Prevents unauthorized reassignment of rendering primitives
   */
  [SET_INTERNAL_GRAPHICS_METHOD](shape: GRAPHICS_TYPES, accessKey: symbol) {
    assertAccess(accessKey);

    /**
     * Bind the graphical element to internal state.
     */
    this.#fig = shape;
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
  [GET_INTERNAL_GRAPHICS_METHOD](accessKey: symbol): GRAPHICS_TYPES {
    assertAccess(accessKey);
    return this.#fig;
  }

  /**
   * Internal scene graph parent assignment method.
   *
   * Purpose:
   * - Assigns the hierarchical parent reference of the current
   *   graphics entity.
   * - Used internally by container systems such as canvas or group
   *   during structural insertion operations.
   *
   * Security:
   * - Protected using internal development access validation.
   * - Prevents unauthorized external mutation of scene graph links.
   *
   * Behavioral Notes:
   * - Only structural container nodes should be passed as parents.
   * - Intended exclusively for internal scene graph management.
   * - Direct external usage is considered invalid architecture usage.
   *
   * @param parent - Structural parent graphics node
   * @param accessKey - Internal privileged access token
   */
  [SET_PARENT_METHOD](
    parent: GraphicsModel<ValidGraphicsShapes>,
    accessKey: symbol,
  ): void {
    assertAccess(accessKey);

    this.#parent = parent;
  }

  /**
   * Internal scene graph parent retrieval method.
   *
   * Purpose:
   * - Returns the hierarchical parent reference associated with
   *   the current graphics entity.
   * - Used internally for scene traversal, transform propagation,
   *   rendering flow, and structural inspection.
   *
   * Security:
   * - Protected using internal development access validation.
   * - Prevents unrestricted external access to scene graph internals.
   *
   * Behavioral Notes:
   * - Returned parent is expected to be a structural container node.
   * - Primarily consumed by renderer and scene management systems.
   *
   * @param accessKey - Internal privileged access token
   * @returns Parent graphics container reference
   */
  [GET_PARENT_METHOD](accessKey: symbol): GraphicsModel<ValidGraphicsShapes> {
    assertAccess(accessKey);

    return this.#parent;
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

  [GET_INTERNAL_GEOMETRY_METHOD](accessKey: symbol): InternalGeometry<T> {
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
  [GET_INTERNAL_STYLE_METHOD](accessKey: symbol): InternalStyle<T> {
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
  [GET_INTERNAL_COMPUTED_STYLE_METHOD](key: symbol): InternalStyle<T> {
    assertAccess(key);
    return this.#computedStyle;
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
      // TypedArray → return detached copy
      if (ArrayBuffer.isView(value)) {
        return (value as Float32Array).slice();
      }

      // Array → deep copy
      if (Array.isArray(value)) {
        return value.map((element) =>
          element !== null && typeof element === "object"
            ? wrap(element)
            : element,
        );
      }

      // Plain object → deep copy
      const copy: Record<string, any> = {};

      for (const key in value) {
        const element = (value as Record<string, any>)[key];
        copy[key] =
          element !== null && typeof element === "object"
            ? wrap(element)
            : element;
      }

      return new Proxy(copy, handler);
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
        if (value !== null && typeof value === "object") {
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
          "assign to ",
          String(prop),
          "core.GraphicsModel.#createReadonlyProxy()",
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
          "delete",
          String(prop),
          "core.GraphicsModel.#createReadonlyProxy()",
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
          "define",
          String(prop),
          "core.GraphicsModel.#createReadonlyProxy()",
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
          "modify prototype of ",
          "",
          "core.GraphicsModel.#createReadonlyProxy()",
        );
      },
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
        keyof typeof GraphicalElementProperties | undefined;

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
        prop in GraphicalElementProperties[shape]
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
          "assign to",
          String(prop),
          "core.GraphicsModel.#isGeometricProp()",
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
    const shape = (this.#geometry as { shape: string })?.shape;

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
    if (prop == "id" || prop == "inside" || prop == "transform")
      throw new ReadOnlyPropertyError(
        "assign to",
        String(prop),
        "core.GraphicsModel.#isStyleProp()",
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
      if (typeof prop !== "object" || Object.keys(prop).length == 0) return;

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

        this.#geometry.renderUpdateType = "GEOMETRY";
      } else if (typeof this.#style == "object" && this.#isStyleProp(key)) {
        /**
         * Route to style domain if property qualifies.
         *
         * Validator may throw if property is restricted.
         */
        (this.#style as Record<string, string | number>)[key] = value;

        this.#geometry.renderUpdateType = "STYLE";
      } else {
        throw new InvalidOptionError(
          key,
          "undefined",
          [],
          "core.graphicsModel.#setAttrs()",
        );
      }

      this.#geometry.localDirty = true;
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
   *      - `TransformStack` → returns a shallow cloned object
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
   * - `TransformStack`:
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
   *   - `TransformStack` → prototype-based shallow copy (unsafe)
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
  #getAttr(key: string): GetAttrsMethodsReturnTypes {
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
        if (key === "buffer") {
          return (value as Float32Array).slice();
        } else if (key == "TransformStack") {
          /**
           * Special Case: TransformStack
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
          "undefined",
          [],
          "core.graphicsModel.#setAttrs()",
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
   * - Getter Mode → single value or array of values (`AttrsMethodReturnTypes`)
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
  public attrs(props: object | string | string[]): AttrsMethodReturnTypes {
    try {
      // ============================================================
      // Setter Mode
      // ============================================================

      /**
       * Guard clause:
       * - Ignore empty object or empty string input
       */
      if (
        (typeof props === "object" && Object.keys(props).length === 0) ||
        (typeof props === "string" && props.trim() === "") ||
        (Array.isArray(props) && props.length == 0)
      )
        return;

      /**
       * Setter Path:
       * - Iterate through all key-value pairs
       * - Delegate each to internal mutation handler
       */
      if (typeof props === "object") {
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
      } else if (typeof props === "string") {
        return this.#getAttr(props.trim());
      } else if (Array.isArray(props)) {
        props = props as string[];
        /**
         * Split input string into attribute keys.
         */
        const result: GetAttrsMethodsReturnTypes[] =
          props as GetAttrsMethodsReturnTypes[];

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
        }
        /**
         * Return array if multiple results exist.
         */
        return result;
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
   * - Assigns `opacity: 0` to the style domain
   *
   * Effects:
   * - Updates internal style state (`#style.opacity`)
   * - Marks geometry as dirty (via `#setAttrs`)
   * - Triggers downstream rendering update pipeline
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
   */
  public hide(): void {
    /**
     * Sets visibility to hidden via attribute mutation pipeline.
     */
    this.#setAttrs({ opacity: 0 });
  }

  /**
   * Sets the visibility of the graphical element to visible.
   *
   * Behavior:
   * - Delegates attribute mutation to `#setAttrs`
   * - Assigns `opacity: 1` to the style domain
   *
   * Effects:
   * - Updates internal style state (`#style.opacity`)
   * - Marks geometry as dirty (via `#setAttrs`)
   * - Triggers downstream rendering update pipeline
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
   */
  public show(): void {
    /**
     * Sets visibility to visible via attribute mutation pipeline.
     */
    this.#setAttrs({ opacity: 1 });
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
  [GET_Z_ORDER_OPERATION_METHOD](key: symbol): -1 | 0 | 1 {
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
  [CLEAR_Z_ORDER_OPERATION_METHOD](key: symbol): void {
    assertAccess(key);
    this.#zOrderOp = 0;
  }
}
