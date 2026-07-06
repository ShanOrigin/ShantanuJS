import type {
  GetInternalGraphicsAccessor,
  GetParentAccessor,
  SetParentAccessor,
  GraphicsNode,
  IGraphicsContainer
} from '../../../models/interfaces/graphics-container';

import type { GraphicsRenderNode } from '../../../models/interfaces/render-node';
import type { TransformStack } from '../../../models/types/common';
import type { ComponentsRegistry } from '../../../models/types/components';
import type {
  BaseTransformationMeta,
  RotateMethodProps,
  ScaleMethodProps,
  SkewMethodProps,
  TranslateMethodProps
} from '../../../models/types/geometry/transform';
import type {
  InternalComputedStyleAccessor,
  InternalGeometryAccessor,
  InternalStyleAccessor
} from '../../../models/types/graphics-model';
import type { GroupPropsType } from '../../../models/types/shapes';

// runtime imports
import { Transformation } from '../../../components/transformation/transformation.js';
import { GraphicsModel } from '../../../core/graphics-model/graphics-model.js';
import {
  InvalidGroupMethodAccessError,
  NotInitializedError,
  ShapeAlreadyExistsInGroupError,
  ShapeNotAttachedToGroupError
} from '../../../errors/index.js';
import {
  assertAccess,
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_PARENT_METHOD,
  SET_PARENT_METHOD
} from '../../../internal/keys/dev-keys.js';

import {
  AllGShapeStyleProperties,
  CommonGeometricProperties
} from '../../../property-definitions/common/common-properties.js';
import {
  dimensions,
  GraphicalElementProperties
} from '../../../property-definitions/specific/specific-properties.js';
import { Log, validProps, Warn } from '../../../utils/helpers/helpers.js';
import { composeAffineTransformations } from '../../../utils/math/affine/affine-composition.js';
import { UPDATE_TRANSFORM_METHOD } from '../../../internal/keys/render-node-keys.js';

import { RenderNode } from '../../render-node/render-node.js';

type GraphicsNodeWithInternalAccessMethods = GraphicsNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  InternalComputedStyleAccessor &
  GetInternalGraphicsAccessor &
  GetParentAccessor &
  SetParentAccessor;

type groupProps = Pick<
  GroupPropsType,
  'fill' | 'stroke' | 'stroke-width' | 'opacity'
>;
export class Group extends RenderNode<'g'> implements IGraphicsContainer {
  /**
   * Reference to internal geometry state of the group.
   *
   * Source:
   * - Retrieved from base class internal geometry
   *
   * Responsibility:
   * - Holds transformation stack and geometric metadata
   * - Shared with transformation system
   *
   * Invariant:
   * - Always reflects current transformation state of the group
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Collection of elements belonging to this group.
   *
   * Responsibility:
   * - Maintains logical grouping of shapes
   * - Used for group-level operations (transform, remove, etc.)
   *
   * Characteristics:
   * - Stores references to child shape instances
   * - Does not guarantee DOM order synchronization
   *
   * Invariant:
   * - Contains only valid shape instances
   */

  #components = {} as ComponentsRegistry;
  #groupElements: Array<GraphicsNode> = [];

  /**
   * Initializes a new Group entity.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Creates a group element (`<g>`) with a unique identifier
   * - Delegates base initialization to `GraphicsEntity`
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Calls parent constructor with shape type `'g'`
   * - Initializes internal geometry, style, and rendering references
   *
   * ============================================================================
   * @param id
   * - Unique identifier for the group
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Group is always initialized with shape type `'g'`
   */
  constructor(id: string) {
    super('g', id);
  }

  /**
   * Returns valid property definitions for the group element.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Provides metadata about allowed properties
   * - Distinguishes between:
   *   - Geometry properties
   *   - Style properties
   *   - Read-only/system properties
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Delegates to global `validProps` utility
   * - Filters property sets specific to group (`'g'`)
   *
   * ============================================================================
   * @returns
   *
   * - Object describing valid and restricted properties
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * const props = Group.validProps()
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Intended for developer introspection and tooling
   * - Does not enforce validation (used as reference layer)
   */
  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'g'
    );
  }

  /**
   * Applies attributes to the group or propagates them to child elements.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Delegates supported style properties to all child elements
   * - Provides read access via base implementation
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - If object:
   *   → filters allowed style properties
   *   → propagates them to all grouped elements
   *
   * - If string:
   *   → delegates to base class (`GraphicsEntity.attrs`)
   *
   * ============================================================================
   * @param props
   * - Object → attributes to apply
   * - String → attribute keys to retrieve
   *
   * ============================================================================
   * @returns
   *
   * - Getter → value(s)
   * - Setter → void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Group does not own style directly (delegates to children)
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Only limited properties are propagated:
   *   fill, stroke, stroke-width, visibility
   */
  public override attrs(props: groupProps | string) {
    /**
     * Setter logic
     */
    if (typeof props === 'object') {
      const safeProps = {} as groupProps;

      /**
       * Filter allowed properties
       */
      const allowed = ['fill', 'stroke', 'stroke-width', 'opacity'] as const;

      for (let i = 0; i < allowed.length; i++) {
        const key = allowed[i];
        if (key in props) {
          safeProps[key] = props[key];
        }
      }

      /**
       * Early exit if nothing valid
       */
      if (Object.keys(safeProps).length === 0) return;

      /**
       * Propagate to children
       */
      const elements = this.#groupElements;
      for (let i = 0; i < elements.length; i++) {
        elements[i].attrs(safeProps);
      }

      return;
    }

    /**
     * Getter logic
     */
    if (typeof props === 'string') {
      return super.attrs(props);
    }

    return undefined;
  }

  /**
   * Checks whether a shape is contained within the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Determines if a given shape belongs to this group
   * - Returns its position using 1-based indexing
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Uses direct reference lookup in internal group array
   * - Verifies logical ownership using `style.inside`
   * - Converts result into 1-based index format
   *
   * ============================================================================
   * @param shape
   * - Shape instance to check
   *
   * ============================================================================
   * @returns number
   *
   * - `0` → shape not in group
   * - `>=1` → position of shape (1-based index)
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Internal storage uses object references (not ID matching)
   * - Return value always follows 1-based indexing contract
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * const pos = group.contain(shape)
   *
   * if (pos) {
   *   // shape exists in group
   * }
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - `0` is intentionally used as "not found" for boolean compatibility
   * - Avoids additional checks in conditional statements
   */
  public contains(shape: GraphicsNode): number {
    const CA = this.#groupElements;

    /**
     * Step 1: Find index using direct reference lookup
     */
    const index = CA.indexOf(shape);

    /**
     * Step 2: Validate ownership using `parent` marker
     */

    if (
      index < 0 ||
      (shape as GraphicsNodeWithInternalAccessMethods)[GET_PARENT_METHOD](
        DEV_INTERNAL_ACCESS_KEY
      ) !== this
    ) {
      return 0;
    }

    /**
     * Step 3: Convert to 1-based index
     */
    return index + 1;
  }

  /**
   * Adds one or more shapes into the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Moves shapes from canvas into this group
   * - Updates DOM structure (SVG <g>)
   * - Updates internal group collection
   * - Rewrites ownership (`style.inside`)
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Validates that group is attached to canvas
   * 2. Iterates over provided shapes
   * 3. Validates each shape belongs to same canvas
   * 4. Moves element from canvas → group
   * 5. Updates internal group collection and ownership
   * 6. Recomputes group buffer matrix
   *
   * ============================================================================
   * @param shapes
   * - List of shapes to add into group
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
   * - Only shapes from same canvas can be grouped
   * - DOM structure must reflect grouping state
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates DOM structure
   * - Depends on `style.inside` correctness
   */

  public add(...rest: GraphicsNode[]): this {
    const groupParent = this[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);
    if (!groupParent) {
      throw new NotInitializedError(
        'this.#fig',
        'Group element not initialized , add this group first to canvas.',
        'group.add()'
      );
    }

    if (groupParent.geometry.shape !== 'scene') {
      throw new InvalidGroupMethodAccessError(
        'this.add()',
        `cannot add shape to this element , because this group\'s ( id : ${this.style.id} ) parent is not this Canvas ( id : ${groupParent.style.id} ).`,
        'group.add()'
      );
    }

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

      const shapeParent = shape[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);

      if (groupParent !== shapeParent) {
        if (this.contains(shape))
          throw new ShapeAlreadyExistsInGroupError(
            shape.style.id,
            this.style.id,
            'core.canvas.add()'
          );

        const currentShape = shape.geometry.shape;
        throw new NotInitializedError(
          `this.#fig of ${currentShape}`,
          `this ${currentShape} not initialized , add this ${currentShape} first to canvas then group.`,
          'canvas.add()'
        );
      }

      // =========================================================
      // Step 3: Atomic commit (authoritative state mutation)
      // transferring ownership from Canvas to group
      // =========================================================

      shape[SET_PARENT_METHOD](this, DEV_INTERNAL_ACCESS_KEY);

      geometry.dirty = true;
      geometry.worldDirty = true;
      this.#groupElements.push(shape);
    }

    const geo = this.#geometry as { localDirty: boolean; worldDirty: boolean };
    geo.localDirty = true;
    geo.worldDirty = true;

    this.generateMatrix(DEV_INTERNAL_ACCESS_KEY);

    return this;
  }

  /**
   * Removes one or more shapes from the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Detaches shapes from group
   * - Restores them back to canvas at original position
   * - Updates internal group collection
   * - Restores ownership (`style.inside`)
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Validates group is attached to canvas
   * 2. Iterates through shapes to remove
   * 3. Verifies shape exists in group
   * 4. Moves element from group → canvas
   * 5. Updates internal state and ownership
   * 6. Recomputes group buffer matrix
   *
   * ============================================================================
   * @param shapes
   * - Shapes to be removed from group
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
   * - Only shapes belonging to this group can be removed
   * - DOM structure must reflect updated hierarchy
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates DOM structure
   * - Depends on stored canvas index for restoration
   */

  public remove(...rest: GraphicsNode[]): this {
    const groupParent = this[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);
    if (!groupParent) {
      throw new NotInitializedError(
        'this.#fig',
        'Group element not initialized , add this group first to canvas.',
        'group.add()'
      );
    }

    if (groupParent.geometry.shape !== 'scene') {
      throw new InvalidGroupMethodAccessError(
        'this.remove()',
        'cannot add shape to this element , because this group parent is not Canvas.',
        'group.remove()'
      );
    }

    for (let i = 0; i < rest.length; i++) {
      const shape = rest[i] as GraphicsNodeWithInternalAccessMethods;

      if (!shape) continue;

      const index = this.contains(shape); // 1 based index
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

      const shapeParent = shape[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);

      if (shapeParent !== this) {
        if (!index)
          throw new ShapeNotAttachedToGroupError(
            shape.style.id,
            this.style.id,
            'group.add()'
          );

        const currentShape = shape.geometry.shape;
        throw new NotInitializedError(
          `this.#fig of ${currentShape}`,
          `this ${currentShape} not initialized , add this ${currentShape} first to canvas then group.`,
          'canvas.add()'
        );
      }

      // =========================================================
      // Step 3: Atomic commit (authoritative state mutation)
      // transferring ownership from group to Canvas
      // =========================================================

      shape[SET_PARENT_METHOD](groupParent, DEV_INTERNAL_ACCESS_KEY);

      geometry.dirty = true;
      geometry.worldDirty = true;

      this.#groupElements.splice(index - 1, 1);
    }

    const geo = this.#geometry as { localDirty: boolean; worldDirty: boolean };
    geo.localDirty = true;
    geo.worldDirty = true;
    this.generateMatrix(DEV_INTERNAL_ACCESS_KEY);
    return this;
  }

  /**
   * Removes all shapes from the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Detaches all grouped elements
   * - Restores them back to canvas
   * - Clears internal group state
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Iterates over group elements in reverse order
   * - Removes each element safely without index shifting issues
   * - Clears internal storage after completion
   *
   * ============================================================================
   * @returns void
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - After execution, group contains no elements
   * - All elements are restored to canvas
   *
   * ============================================================================
   * WARNING
   * ============================================================================
   *
   * - Mutates DOM structure
   * - Depends on correct index restoration logic
   */
  public clear(): this {
    try {
      const groupParent = this[GET_PARENT_METHOD](DEV_INTERNAL_ACCESS_KEY);
      if (!groupParent) {
        throw new NotInitializedError(
          'this.#fig',
          'Group element not initialized , add this group first to canvas.',
          'group.add()'
        );
      }

      if (groupParent.geometry.shape !== 'scene') {
        throw new InvalidGroupMethodAccessError(
          'this.remove()',
          'cannot add shape to this element , because this group parent is not Canvas.',
          'group.clear()'
        );
      }
      const elements = this.#groupElements;

      /**
       * Reverse iteration to avoid mutation issues
       */
      for (let i = elements.length - 1; i >= 0; i--) {
        const shape = elements[i] as GraphicsNodeWithInternalAccessMethods;

        const geometry = shape[GET_INTERNAL_GEOMETRY_METHOD](
          DEV_INTERNAL_ACCESS_KEY
        ) as {
          shape: string;
          dirty: boolean;
          worldDirty: boolean;
        };

        // =========================================================
        // Step 3: Atomic commit (authoritative state mutation)
        // transferring ownership from group to Canvas
        // =========================================================

        shape[SET_PARENT_METHOD](groupParent, DEV_INTERNAL_ACCESS_KEY);

        geometry.dirty = true;
        geometry.worldDirty = true;
      }

      /**
       * Ensure internal cleanup
       */
      elements.length = 0;
      this.generateMatrix(DEV_INTERNAL_ACCESS_KEY);
      return this;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Returns all shapes contained in the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Provides read-only access to grouped elements
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * - Returns a shallow copy of internal elements array
   * - Prevents external mutation of internal state
   *
   * ============================================================================
   * @returns Array<iShape>
   *
   * - List of shapes in the group
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Internal group state cannot be modified through returned array
   *
   * ============================================================================
   * EXAMPLE
   * ============================================================================
   *
   * ```ts
   * const elements = group.getElements()
   * ```
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Modifying returned array does not affect group contents
   */
  public getAllElements(): Array<GraphicsNode> {
    try {
      return [...this.#groupElements];
    } catch (e) {
      throw e;
    }
  }

  /**
   * Generates the transformation matrix buffer for the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Computes and stores the group’s transformation matrix
   * - Updates internal geometry buffer representation
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Validates internal access
   * 2. Retrieves matrix dimensions for group (`'g'`)
   * 3. Allocates or reuses buffer
   * 4. Extracts transformation matrix from bounding box
   * 5. Flattens matrix into Float32Array buffer
   *
   * ============================================================================
   * @param accessKeys
   * - Internal access control key
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Buffer length must always match expected matrix dimensions
   * - Buffer stores flattened matrix in row-major format
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Depends on `getBBox(true)` for transformation matrix
   * - Does not modify geometry outside buffer update
   */
  protected generateMatrix(accessKeys: symbol) {
    assertAccess(accessKeys);

    const geo = this.#geometry as { buffer: Float32Array };
    if (!geo) return;

    /**
     * Step 1: Resolve matrix dimensions for group
     */
    const [m, n] = dimensions['g'] as [number, number];
    const totalLength = m * n;

    /**
     * Step 2: Allocate buffer if required
     */
    if (!geo.buffer || geo.buffer.length !== totalLength) {
      geo.buffer = new Float32Array(totalLength);
    }

    /**
     * Step 3: Retrieve transformation matrix
     */
    const mx = this.getBBox(true).matrix as number[][];
    const sb = geo.buffer;

    /**
     * Step 4: Flatten matrix (row-major)
     */
    let k = 0;
    for (let i = 0; i < m; i++) {
      const row = mx[i];
      for (let j = 0; j < n; j++) {
        sb[k++] = row[j];
      }
    }
  }

  /**
   * Computes the bounding box of the group.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   *
   * - Aggregates bounding boxes of all child elements
   * - Produces a single bounding box representing the group
   *
   * ============================================================================
   * WORKING
   * ============================================================================
   *
   * 1. Iterates through all grouped elements
   * 2. Retrieves each element’s bounding box
   * 3. Tracks global min/max coordinates
   * 4. Constructs final bounding box matrix
   *
   * ============================================================================
   * @param includeStroke
   * - Whether to include stroke in bounding box calculation
   *
   * ============================================================================
   * @returns
   *
   * - Object containing:
   *   - x, y → top-left corner
   *   - width, height → dimensions
   *   - matrix → bounding box points
   *
   * ============================================================================
   * INVARIANT
   * ============================================================================
   *
   * - Bounding box always encloses all child elements
   *
   * ============================================================================
   * NOTE
   * ============================================================================
   *
   * - Depends on child `getBBox()` accuracy
   * - Empty group results in undefined bounds (NaN risk)
   */
  public getBBox(includeStroke?: boolean) {
    const elements = this.#groupElements as GraphicsRenderNode[];
    const size = elements.length;

    if (size === 0) {
      return { x: 0, y: 0, width: 0, height: 0, matrix: [] };
    }

    /**
     * Initialize with first element
     */
    const first = elements[0].getBBox(includeStroke).matrix as number[][];

    let minX = first[0][0];
    let minY = first[0][1];
    let maxX = first[1][0];
    let maxY = first[2][1];

    /**
     * Aggregate bounds
     */
    for (let i = 1; i < size; i++) {
      const m = elements[i].getBBox(includeStroke).matrix as number[][];

      const x1 = m[0][0];
      const y1 = m[0][1];
      const x2 = m[1][0];
      const y2 = m[2][1];

      if (x1 < minX) minX = x1;
      if (y1 < minY) minY = y1;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    }

    /**
     * Compute dimensions
     */
    const width = Math.abs(maxX - minX);
    const height = Math.abs(maxY - minY);

    /**
     * Construct bbox matrix (clockwise)
     */
    const bbox: number[][] = [
      [minX, minY, 1],
      [maxX, minY, 1],
      [maxX, maxY, 1],
      [minX, maxY, 1]
    ];

    return {
      x: minX,
      y: minY,
      width,
      height,
      matrix: bbox
    };
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
  #markWorldDirtyCascade(parent: GraphicsNode) {
    const stack = [...(parent as Group).getAllElements()];

    while (stack.length) {
      const el = stack.pop() as GraphicsNode;
      const geo = el.geometry as { shape: string; worldDirty: boolean };

      if (!geo.worldDirty) {
        geo.worldDirty = true;
      }

      // Only groups can expand traversal
      if (geo.shape === 'g') {
        const children = (el as Group).getAllElements();
        for (let i = 0; i < children.length; i++) {
          stack.push(children[i]);
        }
      }
    }
  }

  protected restoreDimension(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }
}
