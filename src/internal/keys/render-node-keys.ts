/* -------------------------------------------------------------------------- */
/*                          Render Node Dimension Sync                        */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to restore or synchronize
 * render-node dimensions from the underlying graphics state.
 *
 * Used internally after:
 * - renderer updates
 * - geometry recalculation
 * - resize propagation
 * - transform invalidation
 *
 * Must only be executed by internal rendering systems.
 */
const RESTORE_DIMENSION_METHOD = Symbol('RESTORE_DIMENSION_METHOD');

/* -------------------------------------------------------------------------- */
/*             Render Node Canonical Matrix and Bounds Generation             */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to generate or recompute
 * the render-node Canonical matrix and Bounds.
 *
 * Used internally for:
 * - used by renderer to update Canonical matrix and Bounds which can't calculate by logical way like text , etc.
 * - to modify buffer and bounds
 * - spatial calculations
 * - coordinate mapping
 *
 * Access is restricted to renderer and scene systems.
 */
const GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD = Symbol(
  'GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD'
);

/* -------------------------------------------------------------------------- */
/*                          Render Node Transform Sync                        */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to update the render-node
 * transform state and synchronize related matrices.
 *
 * Used internally during transform propagation and
 * scene graph update cycles.
 */
const UPDATE_TRANSFORM_METHOD = Symbol('UPDATE_TRANSFORM_METHOD');

/* -------------------------------------------------------------------------- */
/*                          Render Node Animation Update                      */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to advance and update
 * animation state for the current frame.
 *
 * Used internally by animation and rendering systems
 * during frame processing.
 */
const UPDATE_ANIMATION_METHOD = Symbol('UPDATE_ANIMATION_METHOD');

/* -------------------------------------------------------------------------- */
/*                         Render Node Animation State                        */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to determine whether
 * the render node currently has an active animation.
 *
 * Returns a boolean indicating whether animation
 * processing is currently required.
 */
const HAS_ACTIVE_ANIMATION_METHOD = Symbol('HAS_ACTIVE_ANIMATION_METHOD');

export {
  UPDATE_TRANSFORM_METHOD,
  UPDATE_ANIMATION_METHOD,
  HAS_ACTIVE_ANIMATION_METHOD,
  RESTORE_DIMENSION_METHOD,
  GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD
};
