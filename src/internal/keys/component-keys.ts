/**
 * Internal symbol keys used to attach and access engine-level component
 * instances on render entities without exposing mutable public properties.
 *
 * Why Symbols:
 * - Prevent accidental userland property collisions.
 * - Avoid enumeration during normal object iteration.
 * - Preserve internal encapsulation semantics.
 * - Enable stable identity references across subsystems.
 *
 * Architectural Role:
 * These keys act as hidden attachment points for composition-based
 * engine components such as transforms, animation state,
 * filter pipelines, and event systems.
 *
 * Design Constraints:
 * - Keys must remain globally unique within runtime scope.
 * - Names should represent subsystem intent, not implementation detail.
 * - Symbol descriptions are primarily debugging metadata and
 *   should stay human-readable.
 *
 * Usage:
 * Internal engine systems may use these keys to:
 * - lazily initialize components
 * - validate component existence
 * - retrieve internal subsystem state
 * - avoid public API pollution
 *
 * Important:
 * These keys are INTERNAL implementation details and must never
 * be exposed as part of the public API contract.
 */

/* -------------------------------------------------------------------------- */
/*                              Transform System                              */
/* -------------------------------------------------------------------------- */

/**
 * Internal storage key for the transformation component.
 *
 * Attached Component Responsibilities:
 * - Position
 * - Rotation
 * - Scale
 * - Skew
 * - Origin/Pivot
 * - Transformation matrices
 * - World/local transform propagation
 *
 * Common Consumers:
 * - Renderer
 * - Hit testing system
 * - Bounds calculation
 * - Layout system
 * - Spatial indexing
 */
const TRANSFORM_COMPONENT_KEY = Symbol("TRANSFORM_COMPONENT_KEY");

/* -------------------------------------------------------------------------- */
/*                              Animation System                              */
/* -------------------------------------------------------------------------- */

/**
 * Internal storage key for the animation component.
 *
 * Attached Component Responsibilities:
 * - Timeline management
 * - Keyframe interpolation
 * - Playback state
 * - Animation scheduling
 * - Easing computation
 * - Transition orchestration
 *
 * Common Consumers:
 * - Animation scheduler
 * - Frame update loop
 * - Tween system
 */
const ANIMATION_COMPONENT_KEY = Symbol("ANIMATION_COMPONENT_KEY");

/* -------------------------------------------------------------------------- */
/*                                Filter System                               */
/* -------------------------------------------------------------------------- */

/**
 * Internal storage key for the rendering filter component.
 *
 * Attached Component Responsibilities:
 * - Visual effects
 * - Blur pipelines
 * - Color transformations
 * - Opacity manipulation
 * - Shader/filter stack management
 *
 * Common Consumers:
 * - Renderer
 * - Offscreen compositor
 * - Post-processing pipeline
 */
const FILTER_COMPONENT_KEY = Symbol("FILTER_COMPONENT_KEY");

/* -------------------------------------------------------------------------- */
/*                                 Event System                               */
/* -------------------------------------------------------------------------- */

/**
 * Internal storage key for the event handling component.
 *
 * Attached Component Responsibilities:
 * - Event listeners
 * - Propagation control
 * - Hit interaction mapping
 * - Pointer state handling
 * - Bubbling/capture management
 *
 * Common Consumers:
 * - Input manager
 * - Event dispatcher
 * - Interaction system
 */
const EVENT_COMPONENT_KEY = Symbol("EVENT_COMPONENT_KEY");

/* -------------------------------------------------------------------------- */
/*                             Optional Future Keys                           */
/* -------------------------------------------------------------------------- */

/**
 * Internal storage key for cached geometry data.
 *
 * Recommended Usage:
 * Store computed geometry information to avoid repeated
 * expensive recalculations during rendering and hit testing.
 *
 * Example Data:
 * - Bounds
 * - Vertex arrays
 * - Path cache
 * - Triangulation cache
 */
const GEOMETRY_CACHE_KEY = Symbol("GEOMETRY_CACHE_KEY");

/**
 * Internal storage key for dirty-state tracking.
 *
 * Recommended Usage:
 * Track invalidation states for optimized update propagation.
 *
 * Example Dirty Flags:
 * - transform changed
 * - opacity changed
 * - geometry changed
 * - render state changed
 */
const DIRTY_STATE_KEY = Symbol("DIRTY_STATE_KEY");

/**
 * Internal storage key for renderer-specific cached resources.
 *
 * Recommended Usage:
 * Store backend-dependent render resources.
 *
 * Example Data:
 * - WebGL buffers
 * - GPU handles
 * - texture references
 * - cached render commands
 */
const RENDER_RESOURCE_KEY = Symbol("RENDER_RESOURCE_KEY");

export {
  TRANSFORM_COMPONENT_KEY,
  ANIMATION_COMPONENT_KEY,
  FILTER_COMPONENT_KEY,
  EVENT_COMPONENT_KEY,
  GEOMETRY_CACHE_KEY,
  DIRTY_STATE_KEY,
  RENDER_RESOURCE_KEY,
};
