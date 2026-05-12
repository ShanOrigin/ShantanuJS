import type { Renderer } from '../../renderers';
import type { iShape } from '../../../../../shapes/provider/shapesTypes';

import {
  GraphicsModel,
  type GShpesTages
} from '../../../graphicsModel/graphicsModel.js';

import { DEV_INTERNAL_ACCESS } from '../../../../../utils/provider/accesskeys.js';

import { transformStack } from '../../../../../types/index.js';
import {
  InvalidInternalStateError,
  InvalidRenderableShapeError,
  OperationInProgressError
} from '../../../../../utils/errors/provider/shantanuJSErrors.js';

/**
 * ============================================================================
 * SVGRenderer — High-Performance SVG Rendering Backend
 * ============================================================================
 *
 * OVERVIEW
 * ----------------------------------------------------------------------------
 * SVGRenderer is a concrete implementation of the `Renderer` interface
 * responsible for writing minimal DOM updates for SVG-based rendering.
 *
 * It is designed as a **diff-based, cache-aware renderer**, where:
 * - All heavy computations happen outside (in model / geometry layer)
 * - Renderer performs ONLY minimal DOM mutations
 *
 * ----------------------------------------------------------------------------
 * CORE PRINCIPLE
 * ----------------------------------------------------------------------------
 * "Compute in JS → Write minimal diff to DOM"
 *
 * This avoids:
 * - unnecessary DOM writes
 * - repeated string allocations
 * - redundant attribute updates
 *
 * ----------------------------------------------------------------------------
 * KEY FEATURES
 * ----------------------------------------------------------------------------
 * - WeakMap-based per-element caching
 * - Geometry diffing using string comparison
 * - Reference-based optimization for buffers (polyline/polygon)
 * - Style diffing
 * - Dirty-flag driven rendering
 *
 * ----------------------------------------------------------------------------
 * DESIGN ARCHITECTURE
 * ----------------------------------------------------------------------------
 * Input:
 *   shapesStack: Array<GraphicsModel>
 *
 * For each shape:
 *   1. Check if dirty → skip if not
 *   2. Compute minimal attribute changes
 *   3. Apply only changed attributes to DOM
 *   4. Update cache
 *
 * ----------------------------------------------------------------------------
 * PERFORMANCE STRATEGY
 * ----------------------------------------------------------------------------
 * - Uses WeakMap → no memory leaks
 * - Avoids full rebuild of attributes
 * - Avoids unnecessary string conversions
 * - Uses reference equality for buffers (O(1) check)
 *
 * ----------------------------------------------------------------------------
 * SUPPORTED SHAPES
 * ----------------------------------------------------------------------------
 * - dot
 * - line
 * - circle
 * - ellipse
 * - rect
 * - polyline / polygon / curve
 * - path
 * - text
 * - image
 *
 * ----------------------------------------------------------------------------
 * IMPORTANT INVARIANTS
 * ----------------------------------------------------------------------------
 * - Only dirty shapes are rendered
 * - Geometry cache must reflect last DOM state
 * - Style cache must reflect last DOM state
 * - Buffer reference replacement indicates geometry change
 *
 * ----------------------------------------------------------------------------
 * ERROR CONDITIONS
 * ----------------------------------------------------------------------------
 * - Non-GraphicsModel shape → throws error
 * - Missing geometry → throws error
 * - Active batching state → throws error
 *
 * ----------------------------------------------------------------------------
 * SUMMARY
 * ----------------------------------------------------------------------------
 * SVGRenderer is an optimized, low-level DOM writer that ensures:
 * - minimal DOM mutations
 * - high rendering performance
 * - strict separation between computation and rendering
 */
export class SVGRenderer implements Renderer {
  /**
   * ============================================================================
   * INTERNAL RENDER CACHES
   * ============================================================================
   *
   * These caches are the core optimization layer of the renderer.
   *
   * PURPOSE
   * ----------------------------------------------------------------------------
   * Avoid unnecessary DOM writes by remembering the last applied state.
   *
   * DOM operations are expensive. Writing the same attribute repeatedly
   * (even with the same value) still triggers browser work.
   *
   * These caches ensure:
   * - Only changed attributes are written
   * - No redundant updates occur
   * - Rendering stays minimal and efficient
   *
   * ----------------------------------------------------------------------------
   * DESIGN CHOICE
   * ----------------------------------------------------------------------------
   * WeakMap is used because:
   * - Keys are DOM elements (no manual cleanup required)
   * - Garbage collection automatically removes unused entries
   *
   * Each DOM element gets its own independent cache object.
   */

  /**
   * Geometry cache:
   *
   * Stores last applied **geometry-related attributes** for each DOM element.
   *
   * Examples of cached keys:
   * - '__x', '__y'
   * - '__cx', '__cy'
   * - '__width', '__height'
   * - '__buffer' (reference for polyline/polygon)
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Before writing an attribute, renderer checks:
   *     cache[key] !== newValue
   *
   * - If same → skip DOM write
   * - If different → update DOM + cache
   *
   * RESULT
   * ----------------------------------------------------------------------------
   * Eliminates redundant geometry updates.
   */
  #geoCache? = new WeakMap<Element, Record<string, unknown>>();

  /**
   * Style cache:
   *
   * Stores last applied **style-related attributes** for each DOM element.
   *
   * Examples:
   * - fill
   * - stroke
   * - stroke-width
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Same strategy as geometry cache
   * - Only writes style attributes when changed
   *
   * RESULT
   * ----------------------------------------------------------------------------
   * Prevents unnecessary style updates and layout recalculations.
   */
  #styleCache = new WeakMap<Element, Record<string, string>>();

  /* ============================================================================
   * INTERNAL HELPERS
   * ============================================================================ */

  /**
   * Retrieves or initializes the geometry cache for a given element.
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Checks if a cache object exists for the element
   * - If not:
   *     - creates a new empty object (no prototype)
   *     - stores it in WeakMap
   *
   * WHY Object.create(null)?
   * ----------------------------------------------------------------------------
   * - No prototype chain → faster lookups
   * - No inherited properties → safer key storage
   *
   * @param el - Target DOM element
   * @returns Geometry cache object for that element
   */
  #getOrInitGeoCache(el: Element): Record<string, unknown> {
    let c = this.#geoCache?.get(el);

    if (c === undefined) {
      c = Object.create(null) as Record<string, unknown>;
      this.#geoCache?.set(el, c);
    }

    return c;
  }

  /**
   * Retrieves or initializes the style cache for a given element.
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Same logic as geometry cache
   * - Ensures each element has its own style cache
   *
   * @param el - Target DOM element
   * @returns Style cache object for that element
   */
  #getOrInitStyleCache(el: Element): Record<string, string> {
    let c = this.#styleCache.get(el);

    if (c === undefined) {
      c = Object.create(null) as Record<string, string>;
      this.#styleCache.set(el, c);
    }

    return c;
  }

  /**
   * Converts a numeric value to string.
   *
   * PURPOSE
   * ----------------------------------------------------------------------------
   * Centralized conversion to ensure:
   * - consistent formatting
   * - easy optimization point if needed later
   *
   * WHY NOT INLINE?
   * ----------------------------------------------------------------------------
   * - Keeps conversion logic centralized
   * - Allows future enhancements (e.g., rounding, precision control)
   *
   * @param n - Number to convert
   * @returns String representation of the number
   */
  #numToStr(n: number): string {
    return String(n);
  }

  /* ============================================================================
   * PUBLIC API
   * ============================================================================ */

  /**
   * Renders a stack of shapes to their respective SVG elements.
   *
   * ----------------------------------------------------------------------------
   * CORE FLOW
   * ----------------------------------------------------------------------------
   * For each shape:
   * 1. Validate shape type
   * 2. Fetch geometry, style, and DOM references
   * 3. Skip if not dirty
   * 4. Compute minimal attribute differences
   * 5. Apply only changed attributes to DOM
   * 6. Update cache
   * 7. Mark as clean
   *
   * ----------------------------------------------------------------------------
   * PARAMETERS
   * ----------------------------------------------------------------------------
   * @param shapesStack - Array of GraphicsModel instances to render
   *
   * ----------------------------------------------------------------------------
   * PERFORMANCE NOTES
   * ----------------------------------------------------------------------------
   * - Uses dirty flag to skip unchanged shapes
   * - Uses cache to avoid redundant DOM updates
   * - Uses reference equality for buffer diffing
   *
   * ----------------------------------------------------------------------------
   * ERROR CONDITIONS
   * ----------------------------------------------------------------------------
   * - Throws if shape is not GraphicsModel
   * - Throws if geometry is missing
   * - Throws if batching mode is active
   */

  public render(shapesStack: Array<GraphicsModel<GShpesTages>>): void {
    /**
     * ============================================================================
     * RENDER LOOP — VALIDATION, STATE EXTRACTION & PREPARATION
     * ============================================================================
     *
     * PURPOSE
     * ----------------------------------------------------------------------------
     * This block represents the **initial phase of rendering for each shape**.
     *
     * It is responsible for:
     * - validating renderable objects
     * - extracting internal state (geometry, style, DOM reference)
     * - filtering out non-dirty shapes
     * - preparing per-element caches
     * - initializing a minimal diff container (`desiredAttrs`)
     *
     * This stage ensures that only **valid and necessary shapes** proceed to the
     * expensive rendering phase.
     *
     * ----------------------------------------------------------------------------
     * EXECUTION FLOW
     * ----------------------------------------------------------------------------
     * For each shape:
     *
     * 1. Validate shape type (must be GraphicsModel)
     * 2. Extract geometry reference
     * 3. Skip if not dirty (no changes)
     * 4. Extract style and DOM references
     * 5. Validate batching state
     * 6. Initialize caches
     * 7. Prepare diff container for attributes
     *
     * ----------------------------------------------------------------------------
     * PERFORMANCE STRATEGY
     * ----------------------------------------------------------------------------
     * - Early exit for non-dirty shapes → avoids unnecessary computation
     * - Direct access to internal references → avoids abstraction overhead
     * - Cache initialization ensures O(1) lookup later
     * - `desiredAttrs` collects only changed attributes → minimal DOM writes
     *
     * ----------------------------------------------------------------------------
     * ERROR CONDITIONS
     * ----------------------------------------------------------------------------
     * - Throws if shape is not an instance of GraphicsModel
     * - Throws if geometry reference is missing
     * - Throws if transformation batching is still active
     *
     * ----------------------------------------------------------------------------
     * IMPORTANT INVARIANTS
     * ----------------------------------------------------------------------------
     * - Every element processed here must be renderable
     * - Geometry must exist before rendering
     * - Dirty flag must control rendering eligibility
     * - No rendering allowed during batching phase
     */

    // Iterate through all shapes in the render stack
    for (let index = 0; index < shapesStack.length; index++) {
      const el = shapesStack[index];

      // --------------------------------------------------------------------------
      // STEP 1: Validate renderable shape
      // --------------------------------------------------------------------------
      if (!(el instanceof GraphicsModel)) {
        throw new InvalidRenderableShapeError(el, 'Renderer.render');
      }
      // --------------------------------------------------------------------------
      // STEP 2: Extract geometry reference (internal state)
      // --------------------------------------------------------------------------
      const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
        dirty: boolean; // indicates if re-render is needed
        buffer: Float32Array; // geometry buffer (used in poly shapes)
        transformStack: transformStack; // transformation stack (if applicable)
        shape: string; // shape type identifier
        worldMatrix: Float32Array; // parent -> child composed transformation matrix
        worldDirty: boolean; // indicates if re-render is needed for dependancy
      }>;

      // Geometry must exist for rendering
      if (!geoRef) {
        throw new InvalidInternalStateError(
          geoRef,
          'initialized geometry reference',
          'Shape geometry is missing',
          'Renderer.render'
        );
      }

      // --------------------------------------------------------------------------
      // STEP 3: Skip non-dirty shapes (performance optimization)
      // --------------------------------------------------------------------------
      if (!geoRef.dirty) continue;

      // --------------------------------------------------------------------------
      // STEP 4: Extract style and DOM references
      // --------------------------------------------------------------------------
      const styleRef = el.getIStyle(DEV_INTERNAL_ACCESS); // style object
      const figRef = el.getIFig(DEV_INTERNAL_ACCESS); // actual SVG DOM node
      const shape = geoRef?.shape; // shape type

      /**
       * DOM ORDER SYNCHRONIZATION (SVG)
       * ----------------------------------------------------------------------------
       * Ensures that the SVG DOM order matches the engine-defined render order
       * (`shapesStack`, already sorted by ).
       *
       * In SVG, visual stacking is determined purely by DOM order:
       * - earlier nodes → rendered behind
       * - later nodes   → rendered on top
       *
       * ----------------------------------------------------------------------------
       * LOGIC
       * ----------------------------------------------------------------------------
       * - Each iteration represents the correct logical order
       * - Compare expected DOM position with actual position
       * - If mismatch → move node using `appendChild`
       *
       * ----------------------------------------------------------------------------
       * STRUCTURE NOTE
       * ----------------------------------------------------------------------------
       * `<defs>` occupies index 0 in the SVG root, so:
       *   DOM index = array index + 1
       *
       * ----------------------------------------------------------------------------
       * BEHAVIOR
       * ----------------------------------------------------------------------------
       * - Uses O(1) check per element
       * - Moves node only when necessary
       * - `appendChild` repositions existing nodes (no recreation)
       *
       * ----------------------------------------------------------------------------
       * RESULT
       * ----------------------------------------------------------------------------
       * After execution:
       * - DOM order === shapesStack order
       * - `<defs>` remains untouched at index 0
       */
      const parent = figRef.ownerSVGElement as SVGSVGElement;

      if (parent) {
        const domIndex = index + 1; // account for <defs> at index 0
        const currentNodeAtIndex = parent.children[domIndex];

        if (currentNodeAtIndex !== figRef) {
          parent.appendChild(figRef);
        }
      }

      // --------------------------------------------------------------------------
      // STEP 5: Prevent rendering during transformation batching
      // --------------------------------------------------------------------------
      if ((el as iShape).isBatching()) {
        throw new OperationInProgressError(
          'transformation batching',
          'render operation',
          'Renderer.render'
        );
      }

      // --------------------------------------------------------------------------
      // STEP 6: Initialize per-element caches
      // --------------------------------------------------------------------------
      // Geometry cache → avoids redundant geometry updates
      const geoCache = this.#getOrInitGeoCache(figRef);

      // Style cache → avoids redundant style updates
      const styleCache = this.#getOrInitStyleCache(figRef);

      // --------------------------------------------------------------------------
      // STEP 7: Prepare diff container
      // --------------------------------------------------------------------------
      // This object will store ONLY changed attributes.
      // Later applied to DOM in a minimal update pass.
      const desiredAttrs: Record<string, string> = Object.create(null);

      /**
       * ============================================================================
       * STEP 8: SHAPE-SPECIFIC GEOMETRY DIFFING & ATTRIBUTE BUILDING
       * ============================================================================
       *
       * PURPOSE
       * ----------------------------------------------------------------------------
       * This block computes **minimal geometry changes per shape type**.
       *
       * For each shape:
       * - Extract required geometry fields
       * - Convert numeric values → string (DOM-compatible)
       * - Compare with cached values
       * - Add ONLY changed attributes into `desiredAttrs`
       *
       * KEY STRATEGY
       * ----------------------------------------------------------------------------
       * - No direct DOM writes here
       * - Only diff computation
       * - Cache-driven comparison to avoid redundant updates
       *
       * RESULT
       * ----------------------------------------------------------------------------
       * `desiredAttrs` contains only attributes that actually changed.
       */

      switch (shape) {
        /**
         * DOT
         * ----------------------------------------------------------------------------
         * Represents a point rendered as a small circle.
         * Radius is clamped to a visual range [1, 5] for consistency.
         *
         * Only updates:
         * - cx (x position)
         * - cy (y position)
         * - r  (radius)
         *
         * Cache ensures DOM updates only when values change.
         */
        case 'dot': {
          const { cx, cy, r } = geoRef as {
            cx: number;
            cy: number;
            r: number;
          };
          const cr = r < 1 ? 1 : r > 5 ? 5 : r;

          const cxStr = this.#numToStr(cx);
          const cyStr = this.#numToStr(cy);
          const rStr = this.#numToStr(cr);

          geoCache['__cx'] !== cxStr && (desiredAttrs['cx'] = cxStr);
          geoCache['__cy'] !== cyStr && (desiredAttrs['cy'] = cyStr);
          geoCache['__r'] !== rStr && (desiredAttrs['r'] = rStr);

          break;
        }

        /**
         * LINE
         * ----------------------------------------------------------------------------
         * Represents a straight line between two points.
         *
         * Attributes:
         * - x1, y1 → start point
         * - x2, y2 → end point
         *
         * Each coordinate is diff-checked independently.
         */
        case 'line': {
          const { x1, y1, x2, y2 } = geoRef as {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
          };

          const x1s = this.#numToStr(x1);
          const y1s = this.#numToStr(y1);
          const x2s = this.#numToStr(x2);
          const y2s = this.#numToStr(y2);

          geoCache['__x1'] !== x1s && (desiredAttrs['x1'] = x1s);
          geoCache['__y1'] !== y1s && (desiredAttrs['y1'] = y1s);
          geoCache['__x2'] !== x2s && (desiredAttrs['x2'] = x2s);
          geoCache['__y2'] !== y2s && (desiredAttrs['y2'] = y2s);

          break;
        }

        /**
         * CIRCLE
         * ----------------------------------------------------------------------------
         * Standard SVG circle element.
         *
         * Attributes:
         * - cx, cy → center
         * - r      → radius
         *
         * Uses direct numeric-to-string conversion and cache comparison.
         */
        case 'circle': {
          const { cx, cy, r } = geoRef as {
            cx: number;
            cy: number;
            r: number;
          };

          const cxs = this.#numToStr(cx);
          const cys = this.#numToStr(cy);
          const rs = this.#numToStr(r);

          geoCache['__cx'] !== cxs && (desiredAttrs['cx'] = cxs);
          geoCache['__cy'] !== cys && (desiredAttrs['cy'] = cys);
          geoCache['__r'] !== rs && (desiredAttrs['r'] = rs);

          break;
        }

        /**
         * ELLIPSE
         * ----------------------------------------------------------------------------
         * Represents an ellipse with different radii.
         *
         * Attributes:
         * - cx, cy → center
         * - rx, ry → radii on x and y axes
         *
         * Each attribute is independently diff-checked.
         */
        case 'ellipse': {
          const { cx, cy, rx, ry } = geoRef as {
            cx: number;
            cy: number;
            rx: number;
            ry: number;
          };

          const cxs = this.#numToStr(cx);
          const cys = this.#numToStr(cy);
          const rxs = this.#numToStr(rx);
          const rys = this.#numToStr(ry);

          geoCache['__cx'] !== cxs && (desiredAttrs['cx'] = cxs);
          geoCache['__cy'] !== cys && (desiredAttrs['cy'] = cys);
          geoCache['__rx'] !== rxs && (desiredAttrs['rx'] = rxs);
          geoCache['__ry'] !== rys && (desiredAttrs['ry'] = rys);

          break;
        }

        /**
         * RECT
         * ----------------------------------------------------------------------------
         * Represents a rectangle with optional rounded corners.
         *
         * Attributes:
         * - x, y           → position
         * - width, height  → size
         * - rx, ry         → corner radius
         *
         * Default values ensure stable rendering even if not provided.
         */
        case 'rect': {
          const {
            x,
            y,
            width,
            height,
            rx = 0,
            ry = 0
          } = geoRef as {
            x: number;
            y: number;
            width: number;
            height: number;
            rx: number;
            ry: number;
          };

          const xs = this.#numToStr(x);
          const ys = this.#numToStr(y);
          const ws = this.#numToStr(width);
          const hs = this.#numToStr(height);
          const rxs = this.#numToStr(rx);
          const rys = this.#numToStr(ry);

          geoCache['__x'] !== xs && (desiredAttrs['x'] = xs);
          geoCache['__y'] !== ys && (desiredAttrs['y'] = ys);
          geoCache['__width'] !== ws && (desiredAttrs['width'] = ws);
          geoCache['__height'] !== hs && (desiredAttrs['height'] = hs);
          geoCache['__rx'] !== rxs && (desiredAttrs['rx'] = rxs);
          geoCache['__ry'] !== rys && (desiredAttrs['ry'] = rys);

          break;
        }

        /**
         * POLYLINE / POLYGON / CURVE
         * ----------------------------------------------------------------------------
         * These shapes are defined by a sequence of points stored in a buffer.
         *
         * OPTIMIZATION STRATEGY:
         * - Uses reference equality (buffer pointer) to detect changes
         * - Rebuilds `points` string ONLY if buffer reference changes
         *
         * This avoids costly string rebuilding for unchanged geometry.
         */
        case 'polyline':
        case 'polygon':
        case 'curve': {
          const { buffer: matrix } = geoRef as {
            buffer: Float32Array;
          };

          const prevMatrixRef = geoCache['__buffer'] as Float32Array;

          if (prevMatrixRef !== matrix) {
            const len = matrix.length;
            const parts: string[] = new Array(len);

            for (let i = 0; i < len; i = i + 3) {
              parts[i] = `${matrix[i]},${matrix[i + 1]}`;
            }

            desiredAttrs['points'] = parts.join(' ');
          }

          break;
        }

        /**
         * PATH
         * ----------------------------------------------------------------------------
         * Represents complex shapes using SVG path syntax.
         *
         * Attribute:
         * - d → path command string
         *
         * Only updates when path string changes.
         */
        case 'path': {
          const { d } = geoRef as { d: string };

          if (typeof d === 'string') {
            if (geoCache['__d'] !== d) {
              desiredAttrs['d'] = d;
            }
          }

          break;
        }

        /**
         * TEXT
         * ----------------------------------------------------------------------------
         * Represents text rendered at a position.
         *
         * Attributes:
         * - x, y → position
         *
         * Content:
         * - textContent updated directly (not via attributes)
         *
         * Geometry diffing applies only to position.
         */
        case 'text': {
          const { x, y, text } = geoRef as {
            x: number;
            y: number;
            text: string;
          };

          const xs = this.#numToStr(x);
          const ys = this.#numToStr(y);

          geoCache['__x'] !== xs && (desiredAttrs['x'] = xs);
          geoCache['__y'] !== ys && (desiredAttrs['y'] = ys);

          figRef.textContent = text;

          break;
        }

        /**
         * IMAGE
         * ----------------------------------------------------------------------------
         * Represents an external image embedded in SVG.
         *
         * Attributes:
         * - x, y           → position
         * - width, height  → dimensions
         * - href           → image source
         *
         * Each attribute is diff-checked independently.
         */
        case 'image': {
          const { x, y, width, height, href } = geoRef as {
            x: number;
            y: number;
            width: number;
            height: number;
            href: string;
          };

          const xs = this.#numToStr(x);
          const ys = this.#numToStr(y);
          const ws = this.#numToStr(width);
          const hs = this.#numToStr(height);

          geoCache['__x'] !== xs && (desiredAttrs['x'] = xs);
          geoCache['__y'] !== ys && (desiredAttrs['y'] = ys);
          geoCache['__width'] !== ws && (desiredAttrs['width'] = ws);
          geoCache['__height'] !== hs && (desiredAttrs['height'] = hs);
          geoCache['__href'] !== href && (desiredAttrs['href'] = href);

          break;
        }

        /**
         * DEFAULT
         * ----------------------------------------------------------------------------
         * No operation for unsupported or unknown shapes.
         * Renderer safely ignores unrecognized shape types.
         */
        default:
          break;
      }

      /**
       * ============================================================================
       * STEP 9: APPLY GEOMETRY ATTRIBUTES (DIFF-BASED DOM WRITE)
       * ============================================================================
       *
       * PURPOSE
       * ----------------------------------------------------------------------------
       * This step performs the **actual DOM mutation for geometry attributes**,
       * but strictly in a **diff-driven manner**.
       *
       * Only attributes collected in `desiredAttrs` are considered, which already
       * represent the minimal set of changes required.
       *
       * HOW IT WORKS
       * ----------------------------------------------------------------------------
       * - Iterate over `desiredAttrs`
       * - For each attribute:
       *     1. Verify it is an own property (safety check)
       *     2. Compare against cached value (geoCache)
       *     3. If changed → write to DOM + update cache
       *
       * OPTIMIZATION
       * ----------------------------------------------------------------------------
       * - Prevents redundant `setAttribute` calls
       * - Avoids layout/reflow triggers for unchanged values
       * - Cache acts as a write barrier between computation and DOM
       *
       * INVARIANT
       * ----------------------------------------------------------------------------
       * After execution:
       *   geoCache[key] === DOM attribute value
       */

      for (const key in desiredAttrs) {
        if (!Object.prototype.hasOwnProperty.call(desiredAttrs, key)) continue;

        const vStr = desiredAttrs[key]!;

        // Write only if value actually changed (extra safety over pre-diff)
        if (geoCache[key] !== vStr) {
          figRef.setAttribute(key, vStr);

          geoCache[key] = vStr;
        }
      }

      /**
       * ============================================================================
       * STEP 10: STYLE HANDLING (DIFF-BASED)
       * ============================================================================
       *
       * PURPOSE
       * ----------------------------------------------------------------------------
       * Applies style-related attributes to the SVG element using the same
       * diff-based strategy as geometry.
       *
       * Styles are treated separately because:
       * - they come from a different source (styleRef)
       * - they may change independently of geometry
       *
       * HOW IT WORKS
       * ----------------------------------------------------------------------------
       * - Iterate through style object
       * - Convert each value to string (DOM-compatible)
       * - Compare with styleCache
       * - Apply only if changed
       *
       * OPTIMIZATION
       * ----------------------------------------------------------------------------
       * - Eliminates redundant style writes
       * - Prevents unnecessary style recalculations in browser
       * - Uses per-element cache for O(1) comparisons
       *
       * LIMITATION (BY DESIGN)
       * ----------------------------------------------------------------------------
       * - Does NOT remove stale attributes
       * - Assumes style object represents current truth
       *
       * INVARIANT
       * ----------------------------------------------------------------------------
       * After execution:
       *   styleCache[k] === DOM attribute value
       */

      // Inserting transform into style if shape id dirty

      if (styleRef && typeof styleRef === 'object') {
        const styleObj = styleRef as Record<string, string | number>;

        for (const k in styleObj) {
          if (!Object.prototype.hasOwnProperty.call(styleObj, k)) continue;

          const vStr = String(styleObj[k]);

          if (styleCache[k] !== vStr) {
            figRef.setAttribute(k, vStr);
            styleCache[k] = vStr;
          }
        }
      }

      /**
       * Applies the computed world transform to the DOM element.
       *
       * - Uses `worldMatrix` as the single source of truth for rendering.
       * - Updates only when `dirty` or `worldDirty` is true to avoid redundant writes.
       * - Converts Float32Array matrix into SVG `matrix(a b c d e f)` format.
       * - Uses `styleCache` to prevent unnecessary DOM mutations.
       */
      const world = geoRef.worldMatrix as Float32Array;

      if (geoRef.worldDirty || geoRef.dirty) {
        const a = world[0],
          b = world[1],
          c = world[3],
          d = world[4],
          e = world[6],
          f = world[7];

        const transformStr = `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;

        if (styleCache['transform'] !== transformStr) {
          figRef.setAttribute('transform', transformStr);
          styleCache['transform'] = transformStr;
        }
      }

      /**
       * ============================================================================
       * STEP 11: FINALIZE FRAME (DIRTY FLAG RESET)
       * ============================================================================
       *
       * PURPOSE
       * ----------------------------------------------------------------------------
       * Marks the shape as "clean" after successful rendering.
       *
       * This ensures:
       * - Shape will be skipped in future frames unless modified
       * - Renderer processes only changed shapes (performance critical)
       *
       * BEHAVIOR
       * ----------------------------------------------------------------------------
       * - Sets geoRef.dirty → false
       *
       * INVARIANT
       * ----------------------------------------------------------------------------
       * A shape with dirty = false:
       *   → will NOT enter rendering pipeline in next frame
       *
       * PERFORMANCE IMPACT
       * ----------------------------------------------------------------------------
       * This is the core mechanism enabling:
       *   O(changed_shapes) rendering instead of O(total_shapes)
       */

      geoRef.dirty = false;
    }
  }
}
