import { UnauthorizedInternalAccessError } from "../../errors/index.js";

/**
 * Developer-accessible internal symbols used for controlled engine
 * introspection and low-level subsystem manipulation.
 *
 * Purpose:
 * These symbols intentionally expose restricted internal capabilities
 * to advanced developers, tooling systems, debugging utilities,
 * engine extensions, and trusted infrastructure code.
 *
 * Unlike purely private engine symbols, these keys represent
 * "authorized internal access points" rather than hidden implementation
 * details.
 *
 * Architectural Philosophy:
 * This layer creates a controlled boundary between:
 *
 * - Public API
 * - Advanced engine extension API
 * - Fully private runtime internals
 *
 * This separation is critical for long-term engine scalability,
 * tooling support, and internal maintainability.
 *
 * Security Model:
 * These symbols are NOT true security boundaries.
 * They function as intentional capability tokens.
 *
 * Any consumer possessing these symbols is assumed to be:
 * - trusted
 * - advanced
 * - engine-aware
 * - responsible for invariant correctness
 *
 * Important:
 * Misusing these APIs can corrupt renderer state,
 * invalidate optimization assumptions,
 * or bypass lifecycle guarantees.
 */

/* -------------------------------------------------------------------------- */
/*                          Internal Access Capability                        */
/* -------------------------------------------------------------------------- */

/**
 * Capability token granting controlled access to internal engine state.
 *
 * Primary Responsibilities:
 * - Internal geometry extraction
 * - Internal style inspection
 * - Engine debugging access
 * - Devtools integrations
 * - Advanced subsystem interoperability
 *
 * Architectural Role:
 * Acts as an authorization key for restricted computed methods.
 *
 * Example Pattern:
 * ```ts
 * shape[GET_INTERNAL_GEOMETRY](DEV_INTERNAL_ACCESS);
 * ```
 *
 * Important:
 * The empty Symbol description in the original implementation
 * severely reduces debugging clarity.
 *
 * Symbol descriptions should always remain explicit and searchable.
 */
const DEV_INTERNAL_ACCESS_KEY = Symbol("DEV_INTERNAL_ACCESS_KEY");

/* -------------------------------------------------------------------------- */
/*                           Component Registration                           */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to attach internal components
 * to engine entities dynamically.
 *
 * Primary Responsibilities:
 * - Component injection
 * - Lazy subsystem initialization
 * - Internal composition wiring
 * - Dynamic capability attachment
 *
 * Expected Usage:
 * ```ts
 * entity[SET_COMPONENT_METHOD](componentKey, componentInstance);
 * ```
 *
 * Design Notes:
 * - Method semantics should remain deterministic.
 * - Component replacement rules should be explicitly defined.
 * - Validation must occur internally before attachment.
 *
 * Important:
 * represents a computed method identifier,
 * not component data itself.
 */
const SET_COMPONENT_METHOD = Symbol("SET_COMPONENT_METHOD");

/* -------------------------------------------------------------------------- */
/*                          Internal Geometry Access                          */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve internal geometry state.
 *
 * Access Requirements:
 * Requires `DEV_INTERNAL_ACCESS_KEY`.
 *
 * Returned Data May Include:
 * - canonical geometry
 * - local geometry
 * - computed bounds
 * - cached vertex data
 * - hit test geometry
 * - transformed geometry state
 *
 * Example Usage:
 * ```ts
 * const geometry =
 *   shape[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);
 * ```
 *
 * Important:
 * Returned objects should preferably be:
 * - original state reference
 * - Modification allowed
 *
 *
 */
const GET_INTERNAL_GEOMETRY_METHOD = Symbol("GET_INTERNAL_GEOMETRY_METHOD");

/* -------------------------------------------------------------------------- */
/*                            Internal Style Access                           */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve raw internal style state.
 *
 * Access Requirements:
 * Requires `DEV_INTERNAL_ACCESS_KEY`.
 *
 * Returned Data May Include:
 * - fill state
 * - stroke state
 * - opacity
 * - blend configuration
 * - render style metadata
 *
 * Architectural Purpose:
 * Separates low-level render styling from public styling APIs.
 *
 * Example Usage:
 * ```ts
 * const style =
 *   shape[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);
 * ```
 */
const GET_INTERNAL_STYLE_METHOD = Symbol("GET_INTERNAL_STYLE_METHOD");

/* -------------------------------------------------------------------------- */
/*                      Internal Computed Style Access                        */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve computed/resolved style state.
 *
 * Access Requirements:
 * Requires `DEV_INTERNAL_ACCESS_KEY`.
 *
 * Difference vs Raw Internal Style:
 *
 * Raw Style:
 * - directly assigned values
 *
 * Computed Style:
 * - resolved inheritance
 * - normalized render values
 * - post-processed style state
 * - renderer-ready styling data
 *
 * Example Computed Data:
 * - resolved opacity
 * - inherited colors
 * - normalized stroke width
 * - final compositing values
 *
 * Example Usage:
 * ```ts
 * const computedStyle =
 *   shape[GET_INTERNAL_COMPUTED_STYLE_METHOD](
 *     DEV_INTERNAL_ACCESS_KEY
 *   );
 * ```
 */
const GET_INTERNAL_COMPUTED_STYLE_METHOD = Symbol(
  "GET_INTERNAL_COMPUTED_STYLE_METHOD",
);

/* -------------------------------------------------------------------------- */
/*                        Internal Graphics Attachment                         */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to attach the renderer-specific
 * graphics implementation object to a graphics entity.
 *
 * Architectural Purpose:
 * Separates:
 * - logical engine entities
 * - renderer backend objects
 *
 * This abstraction is critical because engine entities should remain
 * renderer-agnostic while still allowing high-performance backend binding.
 *
 * Typical Attached Objects:
 * - Canvas rendering primitives
 * - WebGL render objects
 * - SVG nodes
 * - GPU-backed render handles
 * - platform-specific drawing resources
 *
 * Expected Usage:
 * ```ts
 * entity[SET_INTERNAL_GRAPHICS_METHOD](
 *   DEV_INTERNAL_ACCESS_KEY,
 *   graphicsObject
 * );
 * ```
 *
 * Important:
 * This method must remain INTERNAL ONLY.
 *
 * External exposure would allow:
 * - renderer corruption
 * - backend desynchronization
 * - invalid lifecycle mutations
 * - rendering invariant violations
 *
 * Design Recommendation:
 * Graphics attachment should preferably:
 * - occur once
 * - be immutable afterward
 * - validate backend compatibility
 * - reject duplicate attachment attempts
 */
const SET_INTERNAL_GRAPHICS_METHOD = Symbol("SET_INTERNAL_GRAPHICS_METHOD");

/* -------------------------------------------------------------------------- */
/*                         Internal Graphics Retrieval                         */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve the renderer-specific
 * graphics implementation object attached to a graphics entity.
 *
 * Architectural Purpose:
 * Provides controlled low-level access to the actual backend rendering
 * object associated with an engine entity.
 *
 * This enables internal systems to:
 * - synchronize renderer state
 * - perform backend-specific optimizations
 * - access GPU/resource handles
 * - execute renderer-level operations
 * - bridge logical entities with rendering infrastructure
 *
 * Returned Objects May Include:
 * - Canvas rendering objects
 * - WebGL render resources
 * - SVG DOM nodes
 * - GPU-backed graphics handles
 * - renderer adapter objects
 * - backend primitive representations
 *
 * Access Requirements:
 * Requires `DEV_INTERNAL_ACCESS_KEY`.
 *
 * Expected Usage:
 * ```ts
 * const graphicsObject =
 *   entity[GET_INTERNAL_GRAPHICS_METHOD](
 *     DEV_INTERNAL_ACCESS_KEY
 *   );
 * ```
 *
 * Important:
 * The returned graphics object represents INTERNAL renderer state.
 *
 * External mutation can cause:
 * - render pipeline corruption
 * - backend state desynchronization
 * - invalid cache state
 * - renderer invariant violations
 * - undefined rendering behavior
 *
 * Design Recommendation:
 * Returned objects should preferably:
 * - remain readonly
 * - be proxy-protected
 * - expose minimal mutable surface
 * - avoid direct lifecycle ownership transfer
 *
 * Architectural Note:
 * This symbol complements:
 * `SET_INTERNAL_GRAPHICS_METHOD`
 *
 * Together they form the controlled backend graphics
 * attachment/retrieval interface for renderer infrastructure.
 */
const GET_INTERNAL_GRAPHICS_METHOD = Symbol("GET_INTERNAL_GRAPHICS_METHOD");

/* -------------------------------------------------------------------------- */
/*                         Internal Z-Order Retrieval                          */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve the pending z-order operation
 * intent from an entity.
 *
 * Architectural Purpose:
 * Allows engine scheduling systems to inspect deferred z-order mutations
 * without exposing mutation state publicly.
 *
 * Returned Intent Values:
 * - `-1` → move backward
 * - `0`  → no pending operation
 * - `1`  → move forward
 *
 * Primary Consumers:
 * - Canvas system
 * - Scene graph manager
 * - Render ordering scheduler
 * - Layer composition engine
 *
 * Example Usage:
 * ```ts
 * const op =
 *   entity[GET_Z_ORDER_OPERATION_METHOD](
 *     DEV_INTERNAL_ACCESS_KEY
 *   );
 * ```
 *
 * Important:
 * This represents deferred ordering intent,
 * NOT final resolved z-index state.
 *
 * Design Reason:
 * Deferred intent systems significantly reduce:
 * - redundant scene graph mutations
 * - unnecessary render sorting
 * - excessive reflow/recomposition
 */
const GET_Z_ORDER_OPERATION_METHOD = Symbol("GET_Z_ORDER_OPERATION_METHOD");

/* -------------------------------------------------------------------------- */
/*                           Internal Z-Order Reset                           */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to clear/reset the pending
 * z-order operation intent after engine consumption.
 *
 * Architectural Purpose:
 * Prevents repeated application of stale ordering operations
 * across render/update cycles.
 *
 * Primary Consumers:
 * - Canvas scheduler
 * - Render pipeline coordinator
 * - Scene ordering subsystem
 *
 * Expected Usage:
 * ```ts
 * entity[CLEAR_Z_ORDER_OPERATION_METHOD](
 *   DEV_INTERNAL_ACCESS_KEY
 * );
 * ```
 *
 * Critical Invariant:
 * Must ALWAYS be called after processing a consumed z-order operation.
 *
 * Failure Consequences:
 * - repeated reorder execution
 * - unstable render ordering
 * - infinite ordering loops
 * - render graph desynchronization
 *
 * Design Philosophy:
 * This follows a:
 * "consume-and-clear intent queue"
 * architecture pattern.
 *
 * This is superior to direct mutation because it:
 * - centralizes ordering control
 * - preserves deterministic scheduling
 * - avoids mid-frame graph corruption
 */
const CLEAR_Z_ORDER_OPERATION_METHOD = Symbol("CLEAR_Z_ORDER_OPERATION_METHOD");

/* -------------------------------------------------------------------------- */
/*                               Future Expansion                             */
/* -------------------------------------------------------------------------- */

/**
 * Recommended future method symbol for retrieving
 * internal transformation state.
 *
 * Example Data:
 * - local matrix
 * - world matrix
 * - inverse matrix
 * - dirty propagation state
 */
const GET_INTERNAL_TRANSFORM_METHOD = Symbol("GET_INTERNAL_TRANSFORM_METHOD");

/**
 * Recommended future method symbol for retrieving
 * internal animation state.
 *
 * Example Data:
 * - active timelines
 * - interpolated values
 * - scheduler metadata
 * - playback state
 */
const GET_INTERNAL_ANIMATION_METHOD = Symbol("GET_INTERNAL_ANIMATION_METHOD");

/**
 * Recommended future method symbol for internal
 * renderer cache inspection.
 *
 * Example Data:
 * - render cache entries
 * - GPU resource bindings
 * - batching metadata
 * - pipeline state
 */
const GET_RENDER_CACHE_METHOD = Symbol("GET_RENDER_CACHE_METHOD");

/**
 * Computed method symbol used to assign the internal
 * parent entity reference for scene graph hierarchy.
 *
 * Used internally by scene graph and renderer systems
 * to maintain parent-child relationships and traversal.
 *
 * Access must remain restricted to engine systems only.
 */
const SET_PARENT_METHOD = Symbol("SET_PARENT_METHOD");

/**
 * Computed method symbol used to retrieve the internal
 * parent entity reference from the scene graph hierarchy.
 *
 * Used internally for traversal, hierarchy resolution,
 * transform propagation, and render ordering.
 *
 * Access must remain restricted to engine systems only.
 */
const GET_PARENT_METHOD = Symbol("GET_PARENT_METHOD");

/**
 * Validates whether the provided access key is authorized
 * for internal engine operations.
 *
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL PURPOSE
 * ----------------------------------------------------------------------------
 * Centralizes capability validation logic for all restricted
 * internal APIs.
 *
 * This prevents duplicated validation logic across:
 * - entities
 * - renderer systems
 * - scene graph operations
 * - scheduling systems
 * - devtools integrations
 *
 * ----------------------------------------------------------------------------
 * SECURITY MODEL
 * ----------------------------------------------------------------------------
 * This is NOT cryptographic security.
 *
 * This is a capability-based architectural boundary intended to:
 * - discourage accidental misuse
 * - enforce internal API contracts
 * - separate public vs privileged operations
 * - preserve engine invariants
 *
 * ----------------------------------------------------------------------------
 * PARAMETERS
 * ----------------------------------------------------------------------------
 * @param key
 * Capability token provided by the caller.
 *
 * ----------------------------------------------------------------------------
 * THROWS
 * ----------------------------------------------------------------------------
 * Throws an Error if access is unauthorized.
 *
 * ----------------------------------------------------------------------------
 * RETURNS
 * ----------------------------------------------------------------------------
 * `true` when access is valid.
 *
 * The return type primarily enables:
 * - assertion-style usage
 * - control-flow narrowing
 * - inline validation semantics
 *
 */
function assertAccess(key: symbol): true {
  if (key !== DEV_INTERNAL_ACCESS_KEY) {
    throw new UnauthorizedInternalAccessError(
      key,
      "DEV_INTERNAL_ACCESS_KEY",
      "Invalid access to internal state via invalid key",
      "assertAccess function call",
    );
  }

  return true;
}

export {
  DEV_INTERNAL_ACCESS_KEY,
  SET_COMPONENT_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  GET_INTERNAL_COMPUTED_STYLE_METHOD,
  SET_INTERNAL_GRAPHICS_METHOD,
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_Z_ORDER_OPERATION_METHOD,
  CLEAR_Z_ORDER_OPERATION_METHOD,
  GET_INTERNAL_TRANSFORM_METHOD,
  GET_INTERNAL_ANIMATION_METHOD,
  GET_RENDER_CACHE_METHOD,
  SET_PARENT_METHOD,
  GET_PARENT_METHOD,
  assertAccess,
};
