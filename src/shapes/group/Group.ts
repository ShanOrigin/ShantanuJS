import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions,
  CommonGeometricProperties,
  IGraphicalElementProperties
} from '../../properties/provider/shapeProperties.js';

import { validProps, isValidMatrix } from '../../utils/provider/utils.js';

import type { groupPropsType } from '../../types/shapes';
import type { iShape } from '../provider/shapesTypes';

import {
  SVG_CONTEXT,
  addTo,
  removeFrom
} from '../../core/provider/svgSpecific.js';
import { GraphicsModel } from '../../core/provider/graphics.js';
import {
  OperationInProgressError,
  ShapeNotAttachedToCanvasError
} from '../../utils/errors/provider/shantanuJSErrors.js';
import { Log, Warn } from '../../utils/helpers/helpers.js';
import { TranslateMethodProps } from '../../types/transformations.js';
import { transformStack } from '../../types/index.js';
import { elements } from 'happy-dom/lib/PropertySymbol.js';
type G = Group;

type groupProps = Pick<
  groupPropsType,
  'fill' | 'stroke' | 'stroke-width' | 'visibility'
>;
export class Group extends GraphicsEntity<'g'> {
  /**
   * Reference to underlying rendering element of the group.
   *
   * Source:
   * - Retrieved from base class internal state via access key
   *
   * Responsibility:
   * - Represents actual DOM/SVG node (<g>)
   * - Used for grouping and DOM-level operations
   *
   * Invariant:
   * - Must always reference a valid rendering element after initialization
   */
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);

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
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

  /**
   * Reference to style state of the group.
   *
   * Source:
   * - Retrieved from base class internal style
   *
   * Responsibility:
   * - Stores style attributes applied to the group element
   *
   * Invariant:
   * - Acts as source of truth for style-related operations
   */
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);

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
  #groupElements: Array<iShape> = [];

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
      const allowed = ['fill', 'stroke', 'stroke-width', 'visibility'] as const;

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
  public contain(shape: iShape): number {
    const CA = this.#groupElements;

    /**
     * Step 1: Find index using direct reference lookup
     */
    const index = CA.indexOf(shape);

    /**
     * Step 2: Validate ownership using `inside` marker
     */
    const groupId = this.#style.id as string;
    const expectedInside = `group-${groupId}`;

    if (index === -1 || shape.style.inside !== expectedInside) {
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
  public add(...shapes: iShape[]): this {
    try {
      const gInside = this.#style.inside as string;

      /**
       * Step 1: Validate group is attached to canvas
       */
      if (!gInside.startsWith('canvas-')) {
        throw new ShapeNotAttachedToCanvasError(
          this.style.id,
          gInside.slice(gInside.indexOf('-')),
          'group.add()'
        );
      }

      /**
       * Cache frequently used references
       */
      const fig = this.getIFig(DEV_INTERNAL_ACCESS);
      const geo = this.#geometry;

      for (let i = 0; i < shapes.length; i++) {
        const element = shapes[i] as iShape;

        const eInside = element.style.inside as string;

        /**
         * Step 2: Validate shape belongs to same canvas
         */
        if (eInside !== gInside) {
          throw new ShapeNotAttachedToCanvasError(
            element.style.id,
            this.style.id,
            'group.add()'
          );
        }

        /**
         * SVG-specific logic block
         */
        if (geo?.context === SVG_CONTEXT && fig instanceof SVGGElement) {
          const svgCanvas = fig.ownerSVGElement as SVGSVGElement;

          const elFig = element.getIFig(DEV_INTERNAL_ACCESS);

          /**
           * Step 3: Move element into group (only if exists in DOM)
           */

          removeFrom(svgCanvas, elFig);
          addTo(fig, elFig);
        }
        /**
         * Step 4: Update internal group state
         */
        this.#groupElements.push(element);

        const eStyle = element.getIStyle(DEV_INTERNAL_ACCESS);
        const eGeo = element.getIGeo(DEV_INTERNAL_ACCESS) as {
          worldDirty: boolean;
          dirty: boolean;
          shape: string;
        };
        eStyle['inside'] = `group-${this.style.id}`;

        eGeo['worldDirty'] = true;
        eGeo['dirty'] = true;

        // if shape is group then propogate
        if (eGeo.shape == 'g') {
          this.#markWorldDirtyCascade(element);
        }
      }

      /**
       * Step 5: Recompute group buffer matrix
       */

      this.generateMatrix(DEV_INTERNAL_ACCESS);

      return this;
    } catch (e) {
      throw e;
    }
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
  public remove(...shapes: iShape[]): this {
    try {
      const gInside = this.#style.inside as string;

      /**
       * Step 1: Validate group is attached to canvas
       */
      if (!gInside.startsWith('canvas-')) {
        throw new ShapeNotAttachedToCanvasError(
          this.style.id,
          gInside.slice(gInside.indexOf('-')),
          'group.remove()'
        );
      }

      /**
       * Cache references
       */
      const fig = this.getIFig(DEV_INTERNAL_ACCESS);
      const geo = this.#geometry;

      for (let i = 0; i < shapes.length; i++) {
        const element = shapes[i] as iShape;

        /**
         * Step 2: Check if element exists in group
         */
        const elIndex = this.contain(element);

        if (!elIndex) {
          throw new ShapeNotAttachedToCanvasError(
            element.style.id,
            this.style.id,
            'group.remove()'
          );
        }

        /**
         * SVG-specific logic block
         */

        if (geo?.context === SVG_CONTEXT && fig instanceof SVGGElement) {
          const svgCanvas = fig.ownerSVGElement as SVGSVGElement;

          const elFig = element.getIFig(DEV_INTERNAL_ACCESS);

          removeFrom(fig, elFig);
          addTo(svgCanvas, elFig);
        }
        /**
         * Step 3: Update internal structures
         */
        this.#groupElements.splice(elIndex - 1, 1);

        /**
         * Step 4: Restore ownership
         */
        const eStyle = element.getIStyle(DEV_INTERNAL_ACCESS);
        const eGeo = element.getIGeo(DEV_INTERNAL_ACCESS) as {
          shape: string;
          worldDirty: boolean;
          dirty: boolean;
        };
        eStyle['inside'] = this.style.inside;

        eGeo['worldDirty'] = true;
        eGeo['dirty'] = true;

        // if shape is group then propogate
        if (eGeo.shape == 'g') {
          this.#markWorldDirtyCascade(element);
        }
      }

      /**
       * Step 5: Recompute transformation matrix
       */
      this.generateMatrix(DEV_INTERNAL_ACCESS);

      return this;
    } catch (e) {
      throw e;
    }
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
  public ungroup(): void {
    try {
      const elements = this.#groupElements;

      /**
       * Reverse iteration to avoid mutation issues
       */
      for (let i = elements.length - 1; i >= 0; i--) {
        this.remove(elements[i] as iShape);
      }

      /**
       * Ensure internal cleanup
       */
      elements.length = 0;
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
  public getAllElements(): Array<iShape> {
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
  protected override generateMatrix(accessKeys: symbol): void {
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
  public override getBBox(includeStroke?: boolean) {
    const elements = this.#groupElements;
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
  #markWorldDirtyCascade(
    parent: GraphicsModel<keyof IGraphicalElementProperties>
  ) {
    const stack = [...(parent as Group).getAllElements()];

    while (stack.length) {
      const el = stack.pop() as GraphicsModel<
        keyof IGraphicalElementProperties
      >;
      const geo = el.geometry as { shape: string; worldDirty: boolean };

      if (!geo.worldDirty) {
        if (__DEV__) {
          Log('shape = ', geo.shape, 'worldDirty = ', geo.worldDirty);
        }
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

  protected override restoreDimension(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }

  #finalizeTransform() {
    // [a, b , g = 0 , c , d, h =  0 , e , f , i =  1 ] // column major
    const parentMatrix = (this.geometry?.transformStack as transformStack)
      .stack[0].transformMatrix as Float32Array;

    const parentDOMMatrix = new DOMMatrix();
    const childDOMMatrix = new DOMMatrix();

    // Convert parentMatrix to parentDOMMatrix

    parentDOMMatrix.a = parentMatrix[0] as number;
    parentDOMMatrix.b = parentMatrix[1] as number;
    parentDOMMatrix.c = parentMatrix[3] as number;
    parentDOMMatrix.d = parentMatrix[4] as number;
    parentDOMMatrix.e = parentMatrix[6] as number;
    parentDOMMatrix.f = parentMatrix[7] as number;

    for (let i = 0; i < this.#groupElements.length; i++) {
      const child = this.#groupElements[i];
      const childMatrix = (this.geometry?.transformStack as transformStack)
        .stack[0].transformMatrix as Float32Array;

      // Convert parentMatrix to parentDOMMatrix
      // Load current transform into scratch matrix (no allocation)
      childDOMMatrix.a = childMatrix[0] as number;
      childDOMMatrix.b = childMatrix[1] as number;
      childDOMMatrix.c = childMatrix[3] as number;
      childDOMMatrix.d = childMatrix[4] as number;
      childDOMMatrix.e = childMatrix[6] as number;
      childDOMMatrix.f = childMatrix[7] as number;

      // Multiply into reusable  child composition matrix
      childDOMMatrix.multiplySelf(parentDOMMatrix);

      // Create transform matrix string
      const { a, b, m31, c, d, m32, e, f } = childDOMMatrix;
      const t = `${a} , ${b} , ${c} , ${d} , ${e} , ${f}`;
      child.getIStyle(DEV_INTERNAL_ACCESS).transform = t;
    }
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
  public override Translate({
    x,
    y,
    tType = 'a',
    px = 0,
    py = 0
  }: Required<Pick<TranslateMethodProps, 'x' | 'y'>> &
    Partial<Omit<TranslateMethodProps, 'x' | 'y'>>): this {
    try {
      super.Translate({ x, y, tType, px, py });

      //  this.#finalizeTransform();

      const eGeo = this.getIGeo(DEV_INTERNAL_ACCESS) as {
        worldDirty: boolean;
        dirty: boolean;
      };

      eGeo['worldDirty'] = true;
      eGeo['dirty'] = true;

      // if shape is group then propogate

      this.#markWorldDirtyCascade(this);

      return this;
    } catch (e) {
      throw e;
    }
  }
}
