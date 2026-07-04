import type { IGraphicsModel } from './graphics-model';
import { GRAPHICS_TYPES } from '../types/common';
import {
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_PARENT_METHOD,
  SET_INTERNAL_GRAPHICS_METHOD,
  SET_PARENT_METHOD,
  GET_Z_ORDER_OPERATION_METHOD,
  CLEAR_Z_ORDER_OPERATION_METHOD
} from '../../internal/keys/dev-keys';

import {
  GET_SCENE_ELEMENTS_METHOD,
  GET_SCENE_ELEMENT_ID_MAP_METHOD,
  GET_SCENE_Z_ORDER_RESOLVER_METHOD
} from '../../internal/keys/system-keys';

import type { ValidGraphicsShapes } from '../types/graphics-model';

/**
 * Represents a graphical entity that can participate
 * within the canvas scene graph system.
 *
 * The entity:
 * - Must implement the graphics model contract
 * - May represent any valid graphical shape specialization
 * - Can be attached to structural containers such as canvas/group
 */
export type GraphicsNode<T extends ValidGraphicsShapes = ValidGraphicsShapes> =
  IGraphicsModel<T>;

export type GetInternalGraphicsAccessor = {
  [GET_INTERNAL_GRAPHICS_METHOD]: (key: symbol) => GRAPHICS_TYPES;
};

export type SetInternalGraphicsAccessor = {
  [SET_INTERNAL_GRAPHICS_METHOD]: (
    element: GraphicsNode | null,
    key: symbol
  ) => void;
};

export type GetParentAccessor = {
  [GET_PARENT_METHOD]: (key: symbol) => GraphicsNode;
};

export type SetParentAccessor = {
  [SET_PARENT_METHOD]: (parent: GraphicsNode | null, key: symbol) => void;
};

export type ZOrderResolutionFuncAccessor = {
  [GET_Z_ORDER_OPERATION_METHOD]: (key: symbol) => number;
};

export type ZOrderResolutionCleanUpFuncAccessor = {
  [CLEAR_Z_ORDER_OPERATION_METHOD]: (key: symbol) => void;
};

export type GetSceneElementsAccessor = {
  [GET_SCENE_ELEMENTS_METHOD]: (key: symbol) => GraphicsNode[];
};

export type GetSceneElementIdMapAccessor = {
  [GET_SCENE_ELEMENT_ID_MAP_METHOD]: (key: symbol) => Map<string, GraphicsNode>;
};
export type GetSceneZOrderResolverAccessor = {
  [GET_SCENE_Z_ORDER_RESOLVER_METHOD]: (key: symbol) => function;
};

/**
 * Core canvas container contract.
 *
 * ============================================================================
 * RESPONSIBILITY
 * ============================================================================
 *
 * Defines the structural and lifecycle operations supported
 * by the rendering canvas system.
 *
 * The canvas acts as:
 * - Root scene graph container
 * - Rendering orchestration entry point
 * - Element management controller
 *
 *
 * ============================================================================
 * STRUCTURAL ROLE
 * ============================================================================
 *
 * Responsible for:
 * - Managing graphical entity membership
 * - Maintaining renderable element collection
 * - Controlling rendering engine lifecycle
 * - Providing scene graph manipulation operations
 *
 *
 * ============================================================================
 * ENGINE ROLE
 * ============================================================================
 *
 * The canvas controls:
 * - Engine startup/shutdown
 * - Render flushing
 * - Structural scene updates
 * - Element ordering and management
 */
export interface IGraphicsContainer {
  /**
   * Adds one or more graphical entities to the canvas.
   *
   * Behavior:
   * - Attaches entities to the root scene graph
   * - Establishes structural parent relationship
   * - Registers entities for rendering participation
   *
   * @param shapes - Graphical entities to attach
   * @returns Current canvas instance for chaining
   */
  add(...shapes: GraphicsNode[]): this;

  /**
   * Removes one or more graphical entities from the canvas.
   *
   * Behavior:
   * - Detaches entities from the scene graph
   * - Removes rendering participation
   * - Clears structural ownership relationship
   *
   * @param shapes - Graphical entities to remove
   * @returns Current canvas instance for chaining
   */
  remove(...shapes: GraphicsNode[]): this;

  /**
   * Checks whether a graphical entity exists within canvas membership.
   *
   * Return Semantics:
   * - `0`  → entity does not exist
   * - `1+` → entity exists at the returned 1-based position
   *
   * Architectural Note:
   * - The numeric return value intentionally combines:
   *   - containment state
   *   - structural membership index
   *
   * - This avoids separate containment and index lookup passes.
   *
   * @param shape - Graphical entity to test
   * @returns 1-based membership index if found, otherwise 0
   */
  contains(shape: GraphicsNode): number;

  /**
   * Returns all graphical entities currently registered
   * within the canvas scene graph.
   *
   * @returns Array of registered graphical entities
   */
  getAllElements(): GraphicsNode[];

  /**
   * Removes all graphical entities from the canvas.
   *
   * Behavior:
   * - Clears scene graph membership
   * - Resets renderable entity collection
   *
   * @returns Current canvas instance for chaining
   */
  clear(): this;
}
