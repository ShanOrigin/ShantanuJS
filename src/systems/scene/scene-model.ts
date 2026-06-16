/* -------------------------------------------------------------------------- */
/*                            Internal Capability Keys                         */
/* -------------------------------------------------------------------------- */

import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  CLEAR_Z_ORDER_OPERATION_METHOD,
  GET_Z_ORDER_OPERATION_METHOD,
  SET_PARENT_METHOD,
  GET_PARENT_METHOD,
  SET_INTERNAL_GRAPHICS_METHOD
} from '../../internal/keys/dev-keys.js';

import {
  assertSystemAccess,
  GET_SCENE_ELEMENTS_METHOD,
  GET_PENDING_CREATION_ELEMENTS_METHOD,
  GET_PENDING_DELETION_ELEMENTS_METHOD,
  GET_SCENE_ELEMENT_ID_MAP_METHOD,
  GET_SCENE_Z_ORDER_RESOLVER_METHOD,
  COMMIT_PENDING_CREATION_METHOD,
  COMMIT_PENDING_DELETION_METHOD
} from '../../internal/keys/system-keys.js';

/* -------------------------------------------------------------------------- */
/*                             Interface Contracts                             */
/* -------------------------------------------------------------------------- */

import type {
  GraphicsNode,
  IGraphicsContainer,
  GetInternalGraphicsAccessor,
  GetParentAccessor,
  SetParentAccessor,
  ZOrderResolutionFuncAccessor,
  ZOrderResolutionCleanUpFuncAccessor
} from '../../models/interfaces/graphics-container';

/* -------------------------------------------------------------------------- */
/*                                Common Types                                 */
/* -------------------------------------------------------------------------- */

import type {
  CanvasAttrsPropsTypes,
  CanvasInitProps
} from '../../models/types/canvas';

import type { AttrsMethodReturnTypes } from '../../models/types/common';

import type {
  InternalGeometryAccessor,
  InternalStyleAccessor
} from '../../models/types/graphics-model';

/* -------------------------------------------------------------------------- */
/*                          Runtime Engine Subsystems                          */
/* -------------------------------------------------------------------------- */

import { GraphicsModel } from '../../core/graphics-model/graphics-model.js';
import { Log, Warn } from '../../utils/helpers/helpers.js';
import {
  NotInitializedError,
  ShapeAlreadyExistsInCanvasError,
  ShapeNotAttachedToCanvasError
} from '../../errors/index.js';
import Colors from '../../utils/colors/colors.js';
import { RenderUpdateType } from '../../models/types/render-infrastructure.js';

type GraphicsNodeWithInternalAccessMethods = GraphicsNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  GetInternalGraphicsAccessor &
  GetParentAccessor &
  SetParentAccessor &
  ZOrderResolutionFuncAccessor &
  ZOrderResolutionCleanUpFuncAccessor;

export class SceneModel
  extends GraphicsModel<'scene'>
  implements IGraphicsContainer
{
  /**
   * Shapes awaiting backend renderer creation.
   *
   * Semantics:
   * - Contains shapes recently added to the scene.
   * - Renderer must create corresponding backend resources
   *   (SVG nodes, DOM nodes, etc.) before normal updates occur.
   *
   * Lifecycle:
   * - Added when a shape enters the scene.
   * - Removed after successful renderer initialization.
   *
   * Constraints:
   * - Must not contain shapes scheduled for deletion.
   */
  #pendingCreationElements: GraphicsNode[] = [];
  /**
   * Internal storage of all shapes belonging to this canvas.
   *
   * Semantics:
   * - Acts as the authoritative ordered collection of shapes.
   * - Used for iteration, rendering order, and bulk operations.
   *
   * Constraints:
   * - Must stay in sync with `#elementIndexMap`.
   * - No duplicates allowed.
   *
   * Mutation Rules:
   * - Only mutated via controlled methods (`addTo`, `remove`, `clear`).
   */
  #sceneElements: GraphicsNode[] = [];

  /**
   * Shapes awaiting backend renderer destruction.
   *
   * Semantics:
   * - Contains shapes removed from the scene.
   * - Renderer must dispose associated backend resources.
   *
   * Lifecycle:
   * - Added when a shape is removed.
   * - Cleared after renderer deletion completes.
   *
   * Constraints:
   * - Shapes in this collection must not be rendered.
   */
  #pendingDeletionElements: GraphicsNode[] = [];
  #removedElements: GraphicsNode[] = [];

  /**
   * O(1) index lookup map for shapes.
   *
   * Key: shape reference
   * Value: index in `#sceneElements`
   *
   * Purpose:
   * - Eliminates O(n) lookup cost.
   * - Enables O(1) containment and removal (swap-pop strategy).
   *
   * Critical Invariant:
   * - For every entry (shape → index):
   *   `#sceneElements[index] === shape`
   *
   * Failure Impact:
   * - Any desynchronization leads to structural corruption.
   */
  #elementIndexMap: Map<GraphicsNode, number> = new Map();
  /**
   * O(1) lookup map: id → shape
   *
   * PURPOSE:
   * - Resolve parent via `inside`
   * - Used by engine for hierarchy resolution
   */
  #elementIdMap: Map<string, GraphicsNode> = new Map();

  /**
   * Centralized synthetic event dispatcher for this canvas.
   *
   * Responsibilities:
   * - Receives native DOM pointer events
   * - Performs hit testing across all canvas elements
   * - Resolves event target based on z-index and geometry
   * - Builds propagation path using ECS `inside` relationships
   * - Executes event phases (capture → target → bubble)
   *
   * Design Constraints:
   * - Owned exclusively by Canvas (single dispatch authority)
   * - Must operate on the same element registry used by rendering engine
   * - Must remain stateless with respect to scene structure (consumes external maps)
   *
   * Invariant:
   * - Must be initialized before any DOM event binding occurs
   * - Must always reference the latest shapes array and element ID map
   *
   * Lifecycle:
   * - Created once during Canvas initialization
   * - Reused for all event dispatch operations
   */
  //  #eventSystem!: EventSystem;

  /**
   * Root graphical node representing this canvas in the rendering layer.
   *
   * Semantics:
   * - For SVG: <svg> or <g> element
   * - For other renderers: equivalent root abstraction
   *
   * Initialization:
   * - Retrieved via internal access hook.
   *
   * Invariant:
   * - Must remain consistent with renderer context.
   */
  #fig = this[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Internal style state of the canvas.
   *
   * Contains:
   * - Unique identifier (`id`)
   * - Styling attributes relevant to rendering
   *
   * Invariant:
   * - `id` must be stable and unique across all canvases.
   */
  #style = this[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Internal geometry state of the canvas.
   *
   * Contains:
   * - Rendering context (e.g., SVG, Canvas2D)
   * - Spatial metadata
   *
   * Invariant:
   * - Context must remain consistent once initialized.
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Minimum z-index boundary.
   *
   * ----------------------------------------------------------------------------
   * ROLE
   * ----------------------------------------------------------------------------
   * Tracks the lowest assigned z-index in the current canvas.
   *
   * ----------------------------------------------------------------------------
   * BEHAVIOR
   * ----------------------------------------------------------------------------
   * Decremented when elements are moved to the back.
   */
  #minZ: number = 0;

  /**
   * Maximum z-index boundary.
   *
   * ----------------------------------------------------------------------------
   * ROLE
   * ----------------------------------------------------------------------------
   * Tracks the highest assigned z-index in the current canvas.
   *
   * ----------------------------------------------------------------------------
   * BEHAVIOR
   * ----------------------------------------------------------------------------
   * Incremented on:
   * - element insertion
   * - move-to-front operations
   */
  #maxZ: number = 0;

  /**
   * Initializes a Canvas instance with a rendering context and DOM binding.
   *
   * Core Responsibilities:
   * - Validates runtime environment and configuration
   * - Resolves and binds DOM container
   * - Initializes rendering root (`#fig`)
   * - Sets immutable rendering context
   * - Applies initial attributes (size, position, stroke defaults)
   * - Bootstraps renderer and engine lifecycle
   *
   * Design Invariants:
   * - `#geometry.context` is immutable after initialization
   * - `#fig` must exist before attaching to DOM
   * - `#parent` must be a valid DOM node
   * - Renderer and Engine must be initialized before any mutation APIs are used
   *
   * Failure Model:
   * - Constructor is fail-fast: any invalid state aborts initialization
   * - No partial initialization is allowed
   *
   * @param id - DOM container id where canvas will be mounted
   * @param width - Canvas width
   * @param height - Canvas height
   * @param context - Rendering context (currently SVG only)
   * @param x - Initial x-offset
   * @param y - Initial y-offset
   */
  constructor({
    id,
    width,
    height,
    x = 0,
    y = 0,
    fill = 'white',
    stroke = 'black',
    'stroke-width': sw = 0.5
  }: Omit<CanvasInitProps, 'context'> & CanvasAttrsPropsTypes) {
    super('scene', `${id}-Canvas`);

    // =========================================================
    //  Dev Mode Warning (compile-time removable)
    // =========================================================
    if (__DEV__) {
      Warn(
        'ShantanuJS is a pre-release build. Not recommended for production use.'
      );
    }

    // =========================================================
    //  Apply Initial Attributes (atomic)
    // =========================================================
    this.attrs({
      width,
      height,
      x,
      y,
      fill,
      stroke,
      'stroke-width': sw
    });
  }

  [GET_PENDING_CREATION_ELEMENTS_METHOD](systemAccessKey: symbol) {
    assertSystemAccess(systemAccessKey);

    return this.#pendingCreationElements;
  }

  [GET_SCENE_ELEMENTS_METHOD](systemAccessKey: symbol) {
    assertSystemAccess(systemAccessKey);

    return this.#sceneElements;
  }

  [GET_PENDING_DELETION_ELEMENTS_METHOD](systemAccessKey: symbol) {
    assertSystemAccess(systemAccessKey);

    return this.#pendingDeletionElements;
  }

  [GET_SCENE_Z_ORDER_RESOLVER_METHOD](systemAccessKey: symbol) {
    assertSystemAccess(systemAccessKey);

    return this.#resolveZOrder.bind(this);
  }

  [GET_SCENE_ELEMENT_ID_MAP_METHOD](systemAccessKey: symbol) {
    assertSystemAccess(systemAccessKey);
    return this.#elementIdMap;
  }

  /**
   * Sets or retrieves canvas attributes.
   *
   * Overloads:
   * - Object input → sets attributes (write path)
   * - String input → retrieves attributes (read path)
   *
   * Write Semantics:
   * - Delegates to base `attrs` for state mutation
   * - Applies canvas-specific DOM updates
   * - Minimizes DOM writes by checking relevant keys
   *
   * Read Semantics:
   * - Supports space-separated keys
   * - Returns:
   *    - single value → primitive
   *    - multiple values → array
   *    - no valid keys → undefined
   *
   * Performance:
   * - Single pass parsing
   * - Avoids unnecessary Object.keys()
   * - Avoids redundant string trims/splits
   *
   * @param props - attribute object or query string
   * @returns attribute value(s) or void
   */
  public override attrs(
    props: CanvasAttrsPropsTypes | string
  ): AttrsMethodReturnTypes {
    // =========================================================
    // Fast exit (null/undefined/empty)
    // =========================================================
    if (!props) return;

    // =========================================================
    // WRITE PATH (object)
    // =========================================================
    if (typeof props === 'object') {
      // Avoid expensive Object.keys → direct check via iteration hint
      let hasKeys = false;
      for (const _ in props) {
        hasKeys = true;
        break;
      }
      if (!hasKeys) return;

      // Base mutation
      super.attrs(props);

      return undefined;
    }

    // =========================================================
    // READ PATH (string)
    // =========================================================
    //
    const result = super.attrs(props as string);
    return result;
  }

  /**
   * Returns the 1-based index of a shape within this canvas.
   *
   * Core Semantics:
   * - O(1) lookup via internal index map
   * - Returns:
   *    - index + 1 → if shape exists in this canvas
   *    - 0 → if shape does not exist
   *
   * Design Decision:
   * - `#elementIndexMap` is the authoritative source of containment
   * - Ownership (`style.inside`) is treated as a secondary invariant
   *
   * Debug Behavior:
   * - In development mode, validates internal consistency
   *
   * @param shape - Shape to query
   * @returns 1-based index or 0 if not found
   */
  public contains(shape: GraphicsNode): number {
    if (!shape) return 0;

    const index = this.#elementIndexMap.get(shape);
    if (index === undefined) return 0;

    // =========================================================
    // DEV-ONLY INVARIANT CHECK (no runtime cost in production)
    // =========================================================
    if (__DEV__) {
      const expectedInside = `canvas-${this.#style.id}`;
      const actualInside = shape.style?.inside;

      if (actualInside !== expectedInside) {
        Warn(
          'Invariant violation: shape exists in indexMap but has mismatched ownership.',
          { shape, expectedInside, actualInside }
        );
      }

      // Stronger invariant: array-map sync
      const arr = this.#sceneElements;
      if (arr[index] !== shape) {
        Warn('Invariant violation: indexMap and array are out of sync.', {
          index,
          shape,
          actual: arr[index]
        });
      }
    }

    return index + 1;
  }

  /**
   * Adds shapes to the canvas with O(1) insertion and indexing.
   *
   * ============================================================================
   * CORE SEMANTICS
   * ============================================================================
   * - Each shape is validated independently before mutation
   * - Prevents duplicate insertion into the same canvas
   * - Prevents insertion if shape is already attached to any context
   * - Maintains strict array ↔ map invariant
   *
   * ============================================================================
   * Z-ORDER INITIALIZATION
   * ============================================================================
   * - On successful insertion, each shape is assigned a unique zIndex
   * - zIndex is derived from an incrementing maxZ counter
   * - This ensures:
   *   - deterministic initial ordering
   *   - no collisions in zIndex space
   *   - insertion order === initial render order
   *
   * ============================================================================
   * INVARIANTS (POST INSERTION)
   * ============================================================================
   * - elements[index] === shape
   * - indexMap.get(shape) === index
   * - shape.style.inside === canvas identity
   * - shape.geometry.context === canvas context
   * - shape.style.zIndex is unique and monotonically increasing
   *
   * ============================================================================
   * FAILURE STRATEGY
   * ============================================================================
   * - Invalid shapes are skipped (no partial mutation)
   * - Duplicate insertion throws explicit error
   * - No mutation occurs before validation phase
   *
   * ============================================================================
   * PERFORMANCE
   * ============================================================================
   * - O(1) insertion
   * - O(1) index tracking via map
   *
   * ============================================================================
   * @param rest - Shapes to add
   * @returns this (fluent API)
   */
  [COMMIT_PENDING_CREATION_METHOD]() {
    const fig = this[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY);
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const elements = this.#sceneElements;
    const indexMap = this.#elementIndexMap;

    const pendingCreatedElements = this.#pendingCreationElements;
    for (let i = 0; i < pendingCreatedElements.length; i++) {
      const shape = pendingCreatedElements[
        i
      ] as GraphicsNodeWithInternalAccessMethods;

      if (!shape) continue;

      const geometry = shape[GET_INTERNAL_GEOMETRY_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      ) as {
        shape: string;
        zIndex: number;
        renderUpdateType: RenderUpdateType;
      };

      // =========================================================
      // Step 1: Fast rejection (no mutation before this point)
      // =========================================================

      if (indexMap.has(shape)) {
        throw new ShapeAlreadyExistsInCanvasError(
          shape.style.id,
          this.style.id,
          'core.canvas.add()'
        );
      }

      // =========================================================
      // Step 3: Atomic commit (authoritative state mutation)
      // =========================================================

      const index = elements.length;

      elements.push(shape);
      indexMap.set(shape, index);
      this.#elementIdMap.set(shape.style.id, shape);

      // =========================================================
      // Step 4: Z-ORDER INITIALIZATION (CRITICAL)
      // =========================================================
      // Assign a strictly increasing zIndex so that:
      // - insertion order becomes initial render order
      // - no sorting ambiguity exists
      // - future z-order operations remain consistent

      this.#maxZ++;
      geometry.zIndex = this.#maxZ;

      geometry.renderUpdateType = 'TRANSFORM';

      // =========================================================
      // DEV-ONLY invariant validation
      // =========================================================
      if (__DEV__) {
        if (elements[index] !== shape || indexMap.get(shape) !== index) {
          Warn('Invariant violation after insertion', {
            shape,
            index,
            arrayValue: elements[index],
            mapValue: indexMap.get(shape)
          });
        }

        if (typeof geometry.zIndex !== 'number') {
          Warn('zIndex initialization failed', shape);
        }
      }
    }

    Log(' scene elements = ', this.#sceneElements);
    this.#pendingCreationElements.length = 0;
    Log(this.#pendingCreationElements);
  }

  public add(...rest: GraphicsNode[]): this {
    const fig = this[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY);
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const indexMap = this.#elementIndexMap;

    for (let i = 0; i < rest.length; i++) {
      const shape = rest[i] as GraphicsNodeWithInternalAccessMethods;

      if (!shape) continue;

      const geometry = shape[GET_INTERNAL_GEOMETRY_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      ) as {
        shape: string;
        dirty: boolean;
        worldDirty: boolean;
      };

      // =========================================================
      // Step 1: Fast rejection (no mutation before this point)
      // =========================================================

      const parent = shape[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);

      if (parent instanceof SceneModel && parent.geometry.shape == 'canvas') {
        Warn(
          `May be  Shape already attached in this canvas or any other canvas . Skipping.`,
          shape
        );

        continue;
      }

      if (shape[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY)) {
        if (__DEV__) {
          Warn(
            `Shape already attached to a context may be in this canvas or any other canvas . Skipping.`,
            shape
          );
        }
        continue;
      }

      if (indexMap.has(shape)) {
        throw new ShapeAlreadyExistsInCanvasError(
          shape.style.id,
          this.style.id,
          'core.canvas.add()'
        );
      }

      // =========================================================
      // Step 3: Atomic commit (authoritative state mutation)
      // =========================================================

      shape[SET_PARENT_METHOD](this, DEV_INTERNAL_ACCESS_KEY);

      geometry.dirty = true;
      geometry.worldDirty = true;

      this.#pendingCreationElements.push(shape);
    }

    return this;
  }

  /**
   * Removes shapes using O(1) swap-pop strategy.
   * NOTE: Order is NOT preserved.
   *
   * ============================================================================
   * CORE SEMANTICS
   * ============================================================================
   * - O(1) removal via indexMap + swap-pop
   * - Safe against duplicate removals
   * - Handles group recursion deterministically
   *
   * ============================================================================
   * Z-ORDER HANDLING
   * ============================================================================
   * - Removed shape's zIndex is cleared
   * - No reordering or normalization is performed here
   * - Remaining shapes retain their zIndex values
   *
   * This ensures:
   * - O(1) removal cost is preserved
   * - zIndex space remains stable
   * - Future normalization can be deferred
   *
   * ============================================================================
   * INVARIANTS AFTER REMOVAL
   * ============================================================================
   * - elements[index] === shape (for all remaining)
   * - indexMap reflects correct indices
   * - Removed shape has no context or ownership
   * - Removed shape has no zIndex association
   *
   * @param targets - Shapes to remove
   * @returns this
   */
  [COMMIT_PENDING_DELETION_METHOD]() {
    const elements = this.#sceneElements;
    const indexMap = this.#elementIndexMap;

    const pending = this.#pendingDeletionElements;

    for (let i = 0; i < pending.length; i++) {
      const shape = pending[i] as GraphicsNodeWithInternalAccessMethods;

      let index = indexMap.get(shape);

      if (index === undefined) {
        continue;
      }

      // =========================================================
      // O(1) SWAP-POP
      // =========================================================

      const lastIndex = elements.length - 1;

      const lastElement = elements[lastIndex];

      if (index !== lastIndex) {
        elements[index] = lastElement;

        indexMap.set(lastElement, index);
      }

      elements.pop();

      indexMap.delete(shape);

      this.#elementIdMap.delete(shape.style.id);

      const geo = shape[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

      // =========================================================
      // CLEAN INTERNAL STATE
      // =========================================================
      if (geo) {
        geo.zIndex = undefined as unknown as number;

        geo.localDirty = false;
        geo.worldDirty = false;
      }

      shape[SET_PARENT_METHOD](null, DEV_INTERNAL_ACCESS_KEY);
    }

    pending.length = 0;
  }

  public remove(...targets: GraphicsNode[]): this {
    const fig = this.#fig;

    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const indexMap = this.#elementIndexMap;

    for (let i = 0; i < targets.length; i++) {
      const shape = targets[i] as GraphicsNodeWithInternalAccessMethods;

      if (!shape) continue;

      const index = indexMap.get(shape);

      // =========================================================
      // Ownership validation (soft check)
      // =========================================================
      if (index === undefined) {
        if (__DEV__) {
          Warn('Element not found or already removed', shape);
        }
        continue;
      }

      const parent = shape[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);

      if (parent !== this) {
        throw new ShapeNotAttachedToCanvasError(
          shape.style.id,
          this.style.id,
          'canvas.remove()'
        );
      }

      // =========================================================
      // Group handling
      // =========================================================

      /*if (el instanceof Group) {
        const groupElements = el.getAllElements();
        el.ungroup();

      //  if (groupElements.length > 0) {
      //    this.remove(...groupElements.slice());
      //  }
      }
			*/

      this.#pendingDeletionElements.push(shape);
    }

    return this;
  }

  /**
   * Removes all elements from the canvas.
   *
   * ============================================================================
   * CORE SEMANTICS
   * ============================================================================
   * Performs a full teardown of all canvas-managed elements.
   *
   * This includes:
   * - DOM detachment (if applicable)
   * - Ownership reset
   * - Geometry context cleanup
   * - zIndex cleanup
   *
   * ============================================================================
   * INVARIANTS AFTER EXECUTION
   * ============================================================================
   * - #sceneElements is empty
   * - #elementIndexMap is empty
   * - All shapes are detached from DOM
   * - All shapes have:
   *   - no zIndex (style.zIndex cleared)
   * - z-order boundaries reset
   *
   * ============================================================================
   * @returns this
   */
  public clear(): this {
    this.remove(...this.#sceneElements.slice());
    return this;
  }

  /**
   * Returns a snapshot of all elements.
   *
   * Semantics:
   * - Provides a shallow copy to protect internal state
   *
   * Performance:
   * - O(n) copy (intentional for safety)
   *
   * @returns Array<GraphicsNode>
   */
  public getAllElements(): Array<GraphicsNode> {
    return this.#sceneElements.slice();
  }

  /**
   * Resolves all pending z-order operations for shapes in this canvas.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   * Converts transient z-order intents (stored in shapes) into persistent
   * numeric zIndex values.
   *
   * ============================================================================
   * EXECUTION MODEL
   * ============================================================================
   * - Iterates through all shapes
   * - Reads pending z-order operation
   * - Updates zIndex using min/max boundaries
   * - Clears operation after applying
   *
   * ============================================================================
   * ORDERING STRATEGY
   * ============================================================================
   * - Front:  zIndex = ++maxZ
   * ============================================================================
   * INVARIANTS
   * ============================================================================
   * - Every shape must have a unique zIndex
   * - zIndex is the single source of truth for rendering order
   * - No DOM manipulation occurs here
   *
   * ============================================================================
   * PERFORMANCE
   * ============================================================================
   * O(n) where n = number of shapes (linear scan)
   *
   * ============================================================================
   * SIDE EFFECTS
   * ============================================================================
   * Mutates:
   * - shape.style.zIndex
   * - internal min/max boundaries
   */
  #resolveZOrder(): void {
    const elements = this.#sceneElements;

    for (let i = 0; i < elements.length; i++) {
      const shape = elements[i] as GraphicsNodeWithInternalAccessMethods;

      const op = shape[GET_Z_ORDER_OPERATION_METHOD](DEV_INTERNAL_ACCESS_KEY);

      const elGeo = shape[GET_INTERNAL_GEOMETRY_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      ) as {
        zIndex: number;
        localDirty: boolean;
      };
      if (op === 1) {
        this.#maxZ++;
        elGeo.zIndex = this.#maxZ;
        elGeo.localDirty = true;
      }

      if (op === -1) {
        this.#minZ--;
        elGeo.zIndex = this.#minZ;
        elGeo.localDirty = true;
      }

      shape[CLEAR_Z_ORDER_OPERATION_METHOD](DEV_INTERNAL_ACCESS_KEY);
    }
  }

  /**
   * Marks all descendants of a container as worldDirty.
   *
   * ============================================================================
   * PURPOSE
   * ============================================================================
   * - Propagates transform invalidation through full hierarchy
   * - Used when container transform or hierarchy changes
   *
   * ============================================================================
   * DESIGN
   * ============================================================================
   * - Uses iterative DFS (no recursion)
   * - Respects shallow getAllElements() contract
   * - Traverses only through containers (groups)
   *
   * ============================================================================
   * @param container - Root container (Canvas or Group)
   */
  #markWorldDirtyCascade() {
    const stack = [...this.getAllElements()];

    while (stack.length) {
      const el = stack.pop() as GraphicsNode;
      const geo = el.geometry as { shape: string; worldDirty: boolean };

      if (!geo.worldDirty) {
        geo.worldDirty = true;
      }

      /*
      // Only groups can expand traversal
      if (geo.shape === 'group') {
        const children = (el as Group).getAllElements();
        for (let i = 0; i < children.length; i++) {
          stack.push(children[i]);
        }
      }
			*/
    }
  }
}
