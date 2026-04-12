import { IGraphicalElementProperties as IG } from '../../properties/specific/specificProperties.js';

import { Colors } from '../../utils/provider/utils.js';

import { createSVGElement } from '../graphics/backends/svg/core/core.js';

import { GraphicsModel as G } from '../graphics/graphicsModel/graphicsModel.js';

import { EventTarget } from '../eventTarget/eventTarget.js';

import { DEV_INTERNAL_ACCESS } from '../../utils/provider/accesskeys.js';

import { initRenderer } from '../graphics/backends/renderer.js';

import { Renderer } from '../graphics/backends/renderers';

import { Engine } from '../engine/engine.js';

import {
  setSVGAttrs,
  SVG_CONTEXT,
  addTo,
  removeFrom
} from '../provider/svgSpecific.js';

import type { CONTEXT } from '../../types/graphicsElements';

import { iShape } from '../../shapes/provider/shapesTypes';

import { Group } from '../../shapes/group/Group.js';

import {
  CanvasParentNotFoundError,
  NotInitializedError,
  ShapeAlreadyExistsInCanvasError,
  UnsupportedRenderingBackendError
} from '../../utils/errors/provider/shantanuJSErrors.js';

type shapeType = keyof IG;

type GType = G<shapeType>;

import type {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../../properties/provider/shapeProperties';
import { Warn } from '../../utils/helpers/helpers.js';

// Point propsTypes
type canvasGeoTypes = IGraphicalElementProperties['canvas'];
type canvasStyleTypes = StyleForGShapeTag<'canvas'>;
export type canvasPropsType = Partial<canvasGeoTypes> &
  Partial<
    Pick<canvasStyleTypes, 'stroke' | 'stroke-width' | 'selectable' | 'fill'>
  >;

type canvasAttrsMethodReturnTypes =
  | void
  | (string | number | undefined)[]
  | (string | number | undefined);

/**
 * Canvas
 * -------
 * Core scene container and orchestration unit of the rendering system.
 *
 * OVERVIEW
 * --------
 * Canvas acts as the root of a scene graph responsible for:
 * - Managing a collection of shapes (`iShape`)
 * - Maintaining structural consistency (array + index map)
 * - Coordinating rendering via Renderer and Engine
 * - Handling DOM binding (SVG currently)
 * - Providing mutation APIs (add, remove, clear, attrs)
 *
 * It is NOT just a container — it is a controlled execution boundary enforcing
 * invariants between:
 *   1. Structural State  (array + indexMap)
 *   2. Semantic State    (style + geometry)
 *   3. Rendering State   (DOM / SVG nodes)
 *
 *
 * CORE RESPONSIBILITIES
 * ---------------------
 * 1. Shape Lifecycle Management
 *    - addTo(): O(1) insertion using index map
 *    - remove(): O(1) removal using swap-pop
 *    - clear(): O(n) bulk cleanup without per-element overhead
 *
 * 2. Structural Integrity
 *    - Maintains strict invariant:
 *        elements[index] === shape
 *        indexMap.get(shape) === index
 *
 * 3. Rendering Coordination
 *    - Initializes renderer based on context
 *    - Delegates execution to Engine
 *    - Syncs DOM with internal state
 *
 * 4. Attribute System
 *    - Extends base `attrs()` for:
 *        - geometry updates
 *        - style propagation
 *        - DOM synchronization
 *
 * 5. Execution Control
 *    - start(): begin rendering loop
 *    - stop(): halt execution
 *    - flush(): force synchronous update
 *
 *
 * INTERNAL ARCHITECTURE
 * ---------------------
 * The system operates on three layers of truth:
 *
 *   Structural Layer (Authoritative)
 *     - #canvasElements: iShape[]
 *     - #elementIndexMap: Map<iShape, number>
 *
 *   Semantic Layer (Derived)
 *     - shape.style
 *     - shape.geometry
 *
 *   Rendering Layer (Projection)
 *     - #fig (SVG root)
 *     - DOM nodes per shape
 *
 * Flow:
 *   Mutation → Structural Update → Semantic Sync → DOM Projection
 *
 *
 * PERFORMANCE CHARACTERISTICS
 * ---------------------------
 * - addTo():     O(1)
 * - remove():    O(1) (swap-pop, order NOT preserved)
 * - contain():   O(1)
 * - clear():     O(n)
 *
 * Trade-off:
 * - Order of elements is NOT stable after removal (intentional optimization)
 *
 *
 * DESIGN INVARIANTS
 * -----------------
 * 1. Structural Consistency
 *    - indexMap and array must always remain synchronized
 *
 * 2. Single Ownership
 *    - A shape belongs to exactly one container at a time
 *
 * 3. Context Consistency
 *    - shape.geometry.context must match canvas context after insertion
 *
 * 4. No Partial Mutation
 *    - All operations are atomic (validate → commit)
 *
 * 5. DOM ↔ Structure Sync
 *    - No orphan DOM nodes
 *    - No detached shapes with active DOM
 *
 *
 * ERROR MODEL
 * -----------
 * - Fail-fast for invalid canvas state (e.g., missing #fig)
 * - Silent skip for invalid shapes (e.g., duplicates, already attached)
 * - DEV mode logs invariant violations (no runtime overhead in production)
 *
 *
 * GLOBAL FLAGS
 * ------------
 * Uses:
 *   __DEV__ (global)
 *
 * Purpose:
 *   - Enable invariant checks
 *   - Emit warnings for internal inconsistencies
 *
 * Behavior:
 *   - Present only if initialized via env.global.ts
 *   - No effect on production builds when stripped/replaced
 *
 *
 * CONTEXT SUPPORT
 * ---------------
 * Current:
 *   - SVG only
 *
 * Future:
 *   - HTML Canvas
 *
 * Context is immutable once set.
 *
 *
 * LIMITATIONS
 * -----------
 * - No stable ordering guarantee after removal
 * - No hierarchical parent graph (string-based ownership exists)
 * - No diff-based rendering (full mutation currently applied)
 * - No batching / scheduling optimization beyond Engine
 *
 *
 * EXTENSION POINTS
 * ----------------
 * - Replace string-based ownership with parent reference graph
 * - Introduce dirty flags + diffing layer
 * - Add batched DOM updates
 * - Implement multi-context rendering
 * - Add scene graph hierarchy (Canvas ↔ Group ↔ Shape)
 *
 *
 * USAGE MODEL
 * -----------
 * const canvas = new Canvas('root', 800, 600);
 *
 * canvas.addTo(shape1, shape2);
 * canvas.remove(shape1);
 * canvas.clear();
 *
 * canvas.start();
 * canvas.stop();
 * canvas.flush();
 *
 *
 * CONCLUSION
 * ----------
 * Canvas is a high-performance, low-level rendering container designed
 * with strict control over state, performance, and consistency.
 *
 * It prioritizes:
 *   - deterministic behavior
 *   - O(1) structural operations
 *   - minimal runtime overhead
 *
 * while deliberately sacrificing:
 *   - implicit safety
 *   - stable ordering
 *   - convenience abstractions
 *
 * This design aligns with systems such as:
 *   - scene graph engines
 *   - game rendering pipelines
 *   - high-performance UI frameworks
 *
 * Any extension must preserve the core invariant:
 *   "Structure is the single source of truth."
 */

export default class Canvas extends EventTarget<'canvas'> {
  /**
   * Parent DOM container to which the canvas root (`#fig`) is attached.
   *
   * Semantics:
   * - Represents the external mounting point.
   * - Can be null if the canvas is not mounted or has been detached.
   *
   * Invariant:
   * - If non-null, `#fig` must be a child of this element.
   */
  #parent: HTMLElement | null = null;

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
  #canvasElements: iShape[] = [];

  /**
   * O(1) index lookup map for shapes.
   *
   * Key: shape reference
   * Value: index in `#canvasElements`
   *
   * Purpose:
   * - Eliminates O(n) lookup cost.
   * - Enables O(1) containment and removal (swap-pop strategy).
   *
   * Critical Invariant:
   * - For every entry (shape → index):
   *   `#canvasElements[index] === shape`
   *
   * Failure Impact:
   * - Any desynchronization leads to structural corruption.
   */
  #elementIndexMap: Map<iShape, number> = new Map();

  /**
   * Rendering abstraction responsible for translating shapes
   * into drawable primitives (e.g., SVG, Canvas2D, WebGL).
   *
   * Lifecycle:
   * - Must be initialized before any rendering operations.
   *
   * Invariant:
   * - Non-null after initialization phase.
   */
  #renderer!: Renderer;

  /**
   * Execution engine coordinating updates, reflows, and rendering cycles.
   *
   * Responsibilities:
   * - Scheduling
   * - State propagation
   * - Frame lifecycle management
   *
   * Invariant:
   * - Must be initialized before any state mutation that affects rendering.
   */
  #engine!: Engine;

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
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);

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
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);

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
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

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
  constructor(
    id: string,
    width: number,
    height: number,
    context: CONTEXT = SVG_CONTEXT,
    x: number = 0,
    y: number = 0
  ) {
    super('canvas', `${id}-Canvas`);

    // =========================================================
    // Step 1: Dev Mode Warning (compile-time removable)
    // =========================================================
    if (__DEV__) {
      Warn(
        'ShantanuJS is a pre-release build. Not recommended for production use.'
      );
    }

    // =========================================================
    // Step 2: Context Validation (strict)
    // =========================================================
    if (context !== SVG_CONTEXT) {
      throw new UnsupportedRenderingBackendError(
        context as unknown as string,
        [SVG_CONTEXT],
        'core.canvas.constructor()'
      );
    }

    // =========================================================
    // Step 3: Lock Geometry Context (immutable)
    // =========================================================
    Object.defineProperty(this.#geometry, 'context', {
      value: context,
      writable: false,
      configurable: false,
      enumerable: true
    });

    // =========================================================
    // Step 4: Resolve Parent Container (DOM binding)
    // =========================================================
    const parent = document.getElementById(id);
    if (!parent) {
      throw new CanvasParentNotFoundError(id, 'core.canvas.constructor()');
    }
    this.#parent = parent;

    // =========================================================
    // Step 5: Ensure Root Figure Exists
    // =========================================================
    let fig = this.#fig;

    if (!fig) {
      const canvas = createSVGElement(SVG_CONTEXT) as SVGSVGElement;

      // Pre-allocate defs (required for gradients, filters, etc.)
      const defs = createSVGElement('defs');
      canvas.appendChild(defs);

      this.setIFig(DEV_INTERNAL_ACCESS, context, canvas);
      fig = this.getIFig(DEV_INTERNAL_ACCESS);
      this.#fig = fig;
    }

    // =========================================================
    // Step 6: Attach to DOM (single mutation point)
    // =========================================================
    parent.appendChild(fig);
    parent.style.position = 'relative';

    // =========================================================
    // Step 7: Apply Initial Attributes (atomic)
    // =========================================================
    this.attrs({
      width,
      height,
      x,
      y,
      stroke: this.#style.stroke ?? 'rgb(0,0,0)', // fixed typo
      'stroke-width': this.#style['stroke-width'] ?? 0
    });

    // =========================================================
    // Step 8: Initialize Renderer + Engine
    // =========================================================
    this.#renderer = initRenderer(context);
    const engine = new Engine(
      this.#canvasElements,
      this.#renderer,
      this.#resolveZOrder.bind(this)
    );

    this.#engine = engine;

    // Start engine only after full initialization
    engine.start();
  }

  /**
   * Starts the rendering engine.
   *
   * Semantics:
   * - Transitions engine into active execution state.
   * - No-op if already running (delegated to engine).
   *
   * Invariants:
   * - Engine must be initialized.
   *
   * Failure Modes:
   * - Throws if engine is not initialized.
   */
  public start(): void {
    const engine = this.#engine;
    if (!engine) {
      throw new NotInitializedError(
        'this.#engine',
        'engine must be initialized',
        'core.canvas.start()'
      );
    }

    engine.start();
  }

  /**
   * Stops the rendering engine.
   *
   * Semantics:
   * - Halts execution loop and rendering updates.
   * - Idempotent: safe to call multiple times.
   *
   * Invariants:
   * - Engine must be initialized.
   */
  public stop(): void {
    const engine = this.#engine;
    if (!engine) {
      throw new NotInitializedError(
        'this.#engine',
        'engine must be initialized',
        'core.canvas.start()'
      );
    }

    engine.stop();
  }

  /**
   * Forces immediate processing of pending updates.
   *
   * Semantics:
   * - Executes a synchronous render/update cycle.
   * - Bypasses scheduling delays.
   *
   * Use Cases:
   * - Deterministic rendering (testing, snapshots)
   * - Immediate UI updates after batch mutations
   *
   * Invariants:
   * - Engine must be initialized.
   */
  public flush(): void {
    const engine = this.#engine;
    if (!engine) {
      throw new NotInitializedError(
        'this.#engine',
        'engine must be initialized',
        'core.canvas.start()'
      );
    }

    engine.flush();
  }

  /**
   * Applies canvas-level visual and positional parameters to the root figure.
   *
   * Responsibilities:
   * - Maps internal geometry (`x`, `y`) → DOM positioning
   * - Maps style (`stroke`, `fill`, `stroke-width`) → CSS properties
   * - Normalizes and validates color inputs
   *
   * Design Invariants:
   * - `#fig` must be a valid HTMLElement/SVGElement with a style object
   * - `#geometry` and `#style` must be initialized
   *
   * Performance Considerations:
   * - Avoids object allocations (no Object.assign)
   * - Minimizes repeated property access
   * - Avoids redundant color validation calls
   *
   * Failure Model:
   * - Fail-fast if critical state is missing
   */
  #setCanvasParams(): void {
    const fig = this.#fig;
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const geometry = this.#geometry as { x: number; y: number };
    const style = this.#style as {
      stroke?: string;
      fill?: string;
      'stroke-width'?: number;
    };

    const x = geometry.x ?? 0;
    const y = geometry.y ?? 0;

    const stroke = style.stroke ?? 'black';
    const fill = style.fill ?? 'white';
    const sw = style['stroke-width'] ?? 0;

    // Single instance → avoid redundant allocations per property
    const colorUtil = new Colors(fill);

    const resolvedStroke = colorUtil.isColor(stroke) as string;
    const resolvedFill = colorUtil.isColor(fill) as string;

    const domStyle = fig.style;

    // =========================================================
    // Direct assignments (faster than Object.assign)
    // =========================================================
    domStyle.position = 'absolute';
    domStyle.left = `${x}px`;
    domStyle.top = `${y}px`;

    domStyle.borderColor = resolvedStroke;
    domStyle.background = resolvedFill;

    domStyle.borderWidth = `${sw}px`;
    domStyle.borderStyle = sw > 0 ? 'solid' : 'none';
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
    props: canvasPropsType | string
  ): canvasAttrsMethodReturnTypes {
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

      // Apply canvas-level styling (position, border, etc.)
      this.#setCanvasParams();

      // SVG-specific dimension updates (only if relevant keys exist)
      if (this.#geometry?.context === SVG_CONTEXT) {
        const geo = this.#geometry as { width?: number; height?: number };

        if ('width' in props && geo.width !== undefined) {
          setSVGAttrs(this.#fig, 'width', geo.width);
        }

        if ('height' in props && geo.height !== undefined) {
          setSVGAttrs(this.#fig, 'height', geo.height);
        }
      }

      return;
    }

    // =========================================================
    // READ PATH (string)
    // =========================================================
    const str = props.trim();
    if (str === '') return;

    const keys = str.split(' ');
    const len = keys.length;

    // Preallocate exact size (avoid dynamic array growth)
    const result: canvasAttrsMethodReturnTypes = new Array(len);

    let validCount = 0;

    for (let i = 0; i < len; i++) {
      const key = keys[i];
      if (!key) continue;

      const value = super.attrs(key);

      if (typeof value === 'string' || typeof value === 'number') {
        result[validCount++] = value;
      } else {
        result[validCount++] = undefined;
      }
    }

    if (validCount === 0) return;

    // Normalize return shape
    if (validCount === 1) {
      return result[0];
    }

    // Trim array if sparse
    result.length = validCount;
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
  public contain(shape: iShape): number {
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
      const arr = this.#canvasElements;
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
   * Core Semantics:
   * - Each shape is validated independently
   * - Ensures no duplicate insertion
   * - Ensures shape is not already attached to any context
   * - Maintains strict array ↔ map invariant
   *
   * Invariants:
   * - After insertion:
   *   - elements[index] === shape
   *   - indexMap.get(shape) === index
   *   - shape.style.inside === canvas identity
   *   - shape.geometry.context === canvas context
   *
   * Failure Strategy:
   * - Invalid shapes are skipped (no partial mutation)
   *
   * @param rest - Shapes to add
   * @returns this (fluent API)
   */

  /*
  public aaddTo(...rest: iShape[]): this {
    const fig = this.#fig;
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const canvasContext = this.#geometry?.context as CONTEXT;
    if (!canvasContext) {
      throw new NotInitializedError(
        'this.#geometry.context',
        'Canvas context is not initialized.',
        'core.canvas.#setCanvasParams()'
      );
    }

    const elements = this.#canvasElements;
    const indexMap = this.#elementIndexMap;
    const insideValue = `canvas-${this.#style.id}`;

    for (let i = 0; i < rest.length; i++) {
      const shape = rest[i];
      if (!shape) continue;

      const geometry = shape.getIGeo(DEV_INTERNAL_ACCESS) as {
        shape: string;
        context?: string | null;
      };

      // =========================================================
      // Step 1: Fast rejection (no mutation before this point)
      // =========================================================

      // Already attached to ANY context → reject
      if (geometry.context != null) {
        if (__DEV__) {
          Warn(
            `Shape already attached to a context may be in this canvas or any other canvas . Skipping.`,
            shape
          );
        }
        continue;
      }

      // Already exists in THIS canvas → reject
      if (indexMap.has(shape)) {
        throw new ShapeAlreadyExistsInCanvasError(
          shape.style.id,
          this.style.id,
          'core.canvas.addTo()'
        );
      }

      const style = shape.getIStyle(DEV_INTERNAL_ACCESS);

      // =========================================================
      // Step 2: DOM preparation (deferred commit)
      // =========================================================

      if (canvasContext === SVG_CONTEXT) {
        let shapeName = geometry.shape;

        // Normalize abstract → concrete SVG primitives
        if (shapeName === 'curve') shapeName = 'polyline';
        else if (shapeName === 'dot') shapeName = 'circle';

        const node = createSVGElement(shapeName);

        // Update shape internals ONLY after successful insertion
        shape.setIFig(DEV_INTERNAL_ACCESS, canvasContext, node);
        if (node) addTo(fig, node);
      }

      // =========================================================
      // Step 3: Atomic commit (no failure beyond this point)
      // =========================================================

      const index = elements.length;

      elements.push(shape);
      indexMap.set(shape, index);

      style.inside = insideValue;
      geometry.context = canvasContext;

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
      }
    }

    return this;
  }
*/

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
  public addTo(...rest: iShape[]): this {
    const fig = this.#fig;
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const canvasContext = this.#geometry?.context as CONTEXT;
    if (!canvasContext) {
      throw new NotInitializedError(
        'this.#geometry.context',
        'Canvas context is not initialized.',
        'core.canvas.#setCanvasParams()'
      );
    }

    const elements = this.#canvasElements;
    const indexMap = this.#elementIndexMap;
    const insideValue = `canvas-${this.#style.id}`;

    for (let i = 0; i < rest.length; i++) {
      const shape = rest[i];
      if (!shape) continue;

      const geometry = shape.getIGeo(DEV_INTERNAL_ACCESS) as {
        shape: string;
        context?: string | null;
        zIndex: number;
      };

      // =========================================================
      // Step 1: Fast rejection (no mutation before this point)
      // =========================================================

      if (geometry.context != null) {
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
          'core.canvas.addTo()'
        );
      }

      const style = shape.getIStyle(DEV_INTERNAL_ACCESS);

      // =========================================================
      // Step 2: DOM preparation (deferred commit)
      // =========================================================

      if (canvasContext === SVG_CONTEXT) {
        let shapeName = geometry.shape;

        if (shapeName === 'curve') shapeName = 'polyline';
        else if (shapeName === 'dot') shapeName = 'circle';

        const node = createSVGElement(shapeName);

        shape.setIFig(DEV_INTERNAL_ACCESS, canvasContext, node);
        if (node) addTo(fig, node);
      }

      // =========================================================
      // Step 3: Atomic commit (authoritative state mutation)
      // =========================================================

      const index = elements.length;

      elements.push(shape);
      indexMap.set(shape, index);

      style.inside = insideValue;
      geometry.context = canvasContext;

      // =========================================================
      // Step 4: Z-ORDER INITIALIZATION (CRITICAL)
      // =========================================================
      // Assign a strictly increasing zIndex so that:
      // - insertion order becomes initial render order
      // - no sorting ambiguity exists
      // - future z-order operations remain consistent

      this.#maxZ++;
      geometry.zIndex = this.#maxZ;

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
  public remove(...targets: iShape[]): this {
    const fig = this.#fig;
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const elements = this.#canvasElements;
    const indexMap = this.#elementIndexMap;
    const canvasId = this.#style.id;

    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      if (!el) continue;

      let index = indexMap.get(el);
      if (index === undefined) {
        if (__DEV__) {
          Warn(`Element not found or already removed`, el);
        }
        continue;
      }

      const style = (el as GType)?.getIStyle(DEV_INTERNAL_ACCESS);
      const geometry = (el as GType)?.getIGeo(DEV_INTERNAL_ACCESS);

      // =========================================================
      // Ownership validation (soft check)
      // =========================================================
      if (__DEV__) {
        const inside = style?.inside;
        if (inside) {
          const [container, sid] = inside.split('-');
          if (!(container === 'canvas' && sid === canvasId)) {
            Warn(`Ownership mismatch detected`, el);
          }
        }
      }

      // =========================================================
      // Group handling
      // =========================================================
      if (el instanceof Group) {
        const groupElements = el.getElements();
        el.ungroup();

        if (groupElements.length > 0) {
          this.remove(...groupElements.slice());
        }
      }

      // =========================================================
      // DOM removal
      // =========================================================
      if (geometry?.context === SVG_CONTEXT) {
        const node = el.getIFig(DEV_INTERNAL_ACCESS);
        if (node) removeFrom(fig, node);
      }

      // =========================================================
      // O(1) SWAP-POP
      // =========================================================
      index = indexMap.get(el);
      if (index === undefined) continue;

      const lastIndex = elements.length - 1;
      const lastEl = elements[lastIndex];

      if (index !== lastIndex) {
        elements[index] = lastEl;
        indexMap.set(lastEl, index);
      }

      elements.pop();
      indexMap.delete(el);

      // =========================================================
      // CLEAN INTERNAL STATE
      // =========================================================
      if (style) {
        style.inside = undefined as unknown as string;
      }

      if (geometry) {
        geometry.context = undefined;
        // Z-INDEX CLEANUP (CRITICAL ADDITION)
        geometry.zIndex = undefined as unknown as number;
      }

      // =========================================================
      // DEV invariant check
      // =========================================================
      if (__DEV__) {
        if (indexMap.has(el)) {
          Warn('Invariant violation: removed element still in map', el);
        }
      }
    }

    return this;
  }

  /**
   * Removes shapes using O(1) swap-pop strategy.
   * NOTE: Order is NOT preserved.
   *
   * Core Semantics:
   * - O(1) removal via indexMap + swap-pop
   * - Safe against duplicate removals
   * - Handles group recursion deterministically
   *
   * Invariants After Removal:
   * - elements[index] === shape (for all remaining)
   * - indexMap reflects correct indices
   * - Removed shape has no context or ownership
   *
   * @param targets - Shapes to remove
   * @returns this
   */

  /*
  public rremove(...targets: iShape[]): this {
    const fig = this.#fig;
    if (!fig) {
      throw new NotInitializedError(
        'this.#fig',
        'canvas dom element not initialized',
        'core.canvas.#setCanvasParams()'
      );
    }

    const elements = this.#canvasElements;
    const indexMap = this.#elementIndexMap;
    const canvasId = this.#style.id;

    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      if (!el) continue;

      let index = indexMap.get(el);
      if (index === undefined) {
        if (__DEV__) {
          Warn(`Element not found or already removed`, el);
        }
        continue;
      }

      const style = (el as GType)?.style;
      const geometry = (el as GType)?.geometry;

      // =========================================================
      // Ownership validation (soft check, not authority)
      // =========================================================
      if (__DEV__) {
        const inside = style?.inside;
        if (inside) {
          const [container, sid] = inside.split('-');
          if (!(container === 'canvas' && sid === canvasId)) {
            Warn(`Ownership mismatch detected`, el);
          }
        }
      }

      // =========================================================
      // Group handling (resolve BEFORE mutation)
      // =========================================================
      if (el instanceof Group) {
        const groupElements = el.getElements();

        // Important: detach children first
        el.ungroup();

        // Recursive removal on snapshot (avoid mutation issues)
        if (groupElements.length > 0) {
          this.remove(...groupElements.slice());
        }
      }

      // =========================================================
      // DOM removal (before structural mutation)
      // =========================================================
      if (geometry?.context === SVG_CONTEXT) {
        const node = el.getIFig(DEV_INTERNAL_ACCESS);
        if (node) removeFrom(fig, node);
      }

      // =========================================================
      // O(1) SWAP-POP (index must be re-fetched if mutated)
      // =========================================================
      index = indexMap.get(el);
      if (index === undefined) continue; // may have been removed via recursion

      const lastIndex = elements.length - 1;
      const lastEl = elements[lastIndex];

      if (index !== lastIndex) {
        elements[index] = lastEl;
        indexMap.set(lastEl, index);
      }

      elements.pop();
      indexMap.delete(el);

      // =========================================================
      // Clean internal state (avoid ghost ownership)
      // =========================================================
      if (style) style.inside = undefined as any;
      if (geometry) geometry.context = undefined;

      // =========================================================
      // DEV invariant check
      // =========================================================
      if (__DEV__) {
        if (indexMap.has(el)) {
          Warn('Invariant violation: removed element still in map', el);
        }
      }
    }

    return this;
  }
*/

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
   * Z-ORDER RESET
   * ============================================================================
   * - Clears zIndex from all shapes
   * - Resets internal z-order boundaries:
   *   - #minZ → 0
   *   - #maxZ → 0
   *
   * This ensures:
   * - Fresh ordering state for future insertions
   * - No stale zIndex leakage
   *
   * ============================================================================
   * PERFORMANCE
   * ============================================================================
   * - O(n) linear pass for cleanup
   * - Avoids repeated remove() calls (which incur extra checks and recursion)
   * - Structural reset is O(1)
   *
   * ============================================================================
   * INVARIANTS AFTER EXECUTION
   * ============================================================================
   * - #canvasElements is empty
   * - #elementIndexMap is empty
   * - All shapes are detached from DOM
   * - All shapes have:
   *   - no ownership (style.inside cleared)
   *   - no context (geometry.context cleared)
   *   - no zIndex (style.zIndex cleared)
   * - z-order boundaries reset
   *
   * ============================================================================
   * @returns this (fluent API)
   */
  public clear(): this {
    const elements = this.#canvasElements;
    if (elements.length === 0) return this;

    const fig = this.#fig;
    const indexMap = this.#elementIndexMap;

    // =========================================================
    // STEP 1: Linear cleanup
    // =========================================================
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      const style = (el as GType)?.getIStyle(DEV_INTERNAL_ACCESS);
      const geometry = (el as GType)?.getIGeo(DEV_INTERNAL_ACCESS);

      // -------------------------
      // DOM cleanup (SVG only)
      // -------------------------
      if (geometry?.context === SVG_CONTEXT) {
        const node = el.getIFig(DEV_INTERNAL_ACCESS);
        if (node) removeFrom(fig, node);
      }

      // -------------------------
      // Metadata cleanup
      // -------------------------
      if (style) {
        style.inside = undefined as unknown as string;
      }

      if (geometry) {
        geometry.context = undefined;
        //  Z-INDEX CLEANUP (CRITICAL)
        geometry.zIndex = undefined as unknown as number;
      }
    }

    // =========================================================
    // STEP 2: Structural reset (O(1))
    // =========================================================
    elements.length = 0;
    indexMap.clear();

    // =========================================================
    // STEP 3: Z-ORDER BOUNDARY RESET (CRITICAL)
    // =========================================================
    this.#minZ = 0;
    this.#maxZ = 0;

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
   * @returns Array<iShape>
   */
  public getAllElements(): Array<iShape> {
    return this.#canvasElements.slice();
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
   * - Back:   zIndex = --minZ
   *
   * This guarantees:
   * - Strict ordering (no collisions)
   * - O(1) updates per operation
   *
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
    const elements = this.#canvasElements;

    for (let i = 0; i < elements.length; i++) {
      const shape = elements[i];

      const op = shape.getZOrderOp(DEV_INTERNAL_ACCESS);

      const elGeo = shape.getIGeo(DEV_INTERNAL_ACCESS) as {
        zIndex: number;
        dirty: boolean;
      };
      if (op === 1) {
        this.#maxZ++;
        elGeo.zIndex = this.#maxZ;
        elGeo.dirty = true;
      }

      if (op === -1) {
        this.#minZ--;
        elGeo.zIndex = this.#minZ;
        elGeo.dirty = true;
      }

      shape.clearZOrderOp(DEV_INTERNAL_ACCESS);
    }
  }
}
