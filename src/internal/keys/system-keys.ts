import { UnauthorizedInternalAccessError } from '../../errors/index.js';

/* -------------------------------------------------------------------------- */
/*                         Internal Scene Collection Keys                      */
/* -------------------------------------------------------------------------- */

/**
 * Computed method symbol used to retrieve the internal
 * canvas scene element collection.
 *
 * Architectural Purpose:
 * - Provides privileged internal access to the ordered
 *   graphical element collection managed by the canvas.
 * - Used by internal engine subsystems such as:
 *   - Rendering engine
 *   - Event system
 *   - Z-order resolution pipeline
 *
 * Security Characteristics:
 * - Protected through capability-based access validation.
 * - Intended strictly for trusted internal engine systems.
 *
 * Behavioral Notes:
 * - Returns the live internal collection reference.
 * - External/public mutation is not permitted.
 */
const GET_SCENE_ELEMENTS_METHOD = Symbol('GET_SCENE_ELEMENTS_METHOD');
const GET_SCENE_REMOVED_ELEMENTS_METHOD = Symbol(
  'GET_SCENE_REMOVED_ELEMENTS_METHOD'
);

/**
 * Computed method symbol used to retrieve the internal
 * z-order resolution operation handler.
 *
 * Architectural Purpose:
 * - Exposes the internal z-order synchronization routine
 *   responsible for resolving rendering order updates.
 * - Allows renderer/engine subsystems to trigger
 *   structural render ordering recalculation.
 *
 * Security Characteristics:
 * - Restricted to privileged internal engine access.
 * - Requires capability-key validation.
 *
 * Behavioral Notes:
 * - Intended for internal rendering orchestration only.
 * - Not part of the public canvas API surface.
 */ const GET_SCENE_Z_ORDER_RESOLVER_METHOD = Symbol(
  'GET_Z_ORDER_RESOLVER_METHOD'
);

/**
 * Computed method symbol used to retrieve the internal
 * graphical element identifier registry.
 *
 * Architectural Purpose:
 * - Provides privileged access to the internal element
 *   lookup registry used for identifier-based retrieval.
 * - Used internally by:
 *   - Event systems
 *   - Rendering systems
 *   - Scene synchronization layers
 *
 * Security Characteristics:
 * - Protected through capability-based access validation.
 * - Intended only for trusted internal engine systems.
 *
 * Behavioral Notes:
 * - Returns the live internal identifier map reference.
 * - Mutations bypass normal public API protections.
 */
const GET_SCENE_ELEMENT_ID_MAP_METHOD = Symbol('GET_ELEMENT_ID_MAP_METHOD');

/* -------------------------------------------------------------------------- */
/*                         System Internal Capability                          */
/* -------------------------------------------------------------------------- */

/**
 * Capability token granting privileged access to internal
 * engine runtime systems and orchestration layers.
 *
 * Primary Responsibilities:
 * - Renderer orchestration access
 * - Engine lifecycle coordination
 * - Scene synchronization operations
 * - Event system interoperability
 * - Internal rendering pipeline integration
 * - Structural scene management access
 *
 * Architectural Role:
 * Acts as a privileged authorization token for restricted
 * system-level computed methods and runtime orchestration APIs.
 *
 * Unlike `DEV_INTERNAL_ACCESS_KEY`, this token is intended for:
 * - Internal engine subsystems
 * - Runtime orchestration layers
 * - Renderer coordination
 * - Scene graph management systems
 *
 * Example Pattern:
 * ```ts
 * canvas[GET_ENGINE_METHOD](SYSTEM_INTERNAL_ACCESS_KEY);
 * ```
 *
 * Important:
 * - This is an architectural capability boundary,
 *   not a security sandbox.
 * - Exposure of this token grants privileged access
 *   to mutable internal runtime systems.
 */
const SYSTEM_INTERNAL_ACCESS_KEY = Symbol('SYSTEM_INTERNAL_ACCESS_KEY');

/**
 * Validates whether the provided access key is authorized
 * for privileged internal system operations.
 *
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL PURPOSE
 * ----------------------------------------------------------------------------
 * Centralizes authorization logic for internal runtime
 * systems and orchestration-layer APIs.
 *
 * This prevents duplicated validation logic across:
 * - renderer systems
 * - engine execution layers
 * - event orchestration systems
 * - scene synchronization pipelines
 * - internal runtime subsystems
 *
 * ----------------------------------------------------------------------------
 * SYSTEM ACCESS MODEL
 * ----------------------------------------------------------------------------
 * This capability layer exists to:
 * - Separate public APIs from internal runtime systems
 * - Restrict privileged orchestration access
 * - Preserve engine invariants
 * - Prevent accidental subsystem misuse
 * - Enforce internal architectural boundaries
 *
 * ----------------------------------------------------------------------------
 * SECURITY MODEL
 * ----------------------------------------------------------------------------
 * This is NOT cryptographic security.
 *
 * This is a capability-based architectural control mechanism
 * intended for internal engine coordination and subsystem isolation.
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
 * `true` when system-level access is valid.
 *
 * The return type primarily enables:
 * - assertion-style usage
 * - control-flow narrowing
 * - inline authorization semantics
 */
function assertSystemAccess(key: symbol): true {
  if (key !== SYSTEM_INTERNAL_ACCESS_KEY) {
    throw new UnauthorizedInternalAccessError(
      key,
      'SYSTEM_INTERNAL_ACCESS_KEY',
      'Invalid access to privileged internal system state',
      'assertSystemAccess function call'
    );
  }

  return true;
}

export {
  GET_SCENE_ELEMENTS_METHOD,
  GET_SCENE_REMOVED_ELEMENTS_METHOD,
  GET_SCENE_ELEMENT_ID_MAP_METHOD,
  GET_SCENE_Z_ORDER_RESOLVER_METHOD,
  SYSTEM_INTERNAL_ACCESS_KEY,
  assertSystemAccess
};
