/* -------------------------------------------------------------------------- */
/*                            Internal Capability Keys                         */
/* -------------------------------------------------------------------------- */

import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GRAPHICS_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  SET_INTERNAL_GRAPHICS_METHOD,
} from "../../../../internal/keys/dev-keys.js";

import {
  GET_PENDING_CREATION_ELEMENTS_METHOD,
  COMMIT_PENDING_CREATION_METHOD,
  GET_PENDING_DELETION_ELEMENTS_METHOD,
  COMMIT_PENDING_DELETION_METHOD,
  SYSTEM_INTERNAL_ACCESS_KEY,
} from "../../../../internal/keys/system-keys.js";

import { GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD } from "../../../../internal/keys/render-node-keys.js";

/* -------------------------------------------------------------------------- */
/*                             Interface Contracts                             */
/* -------------------------------------------------------------------------- */

import type {
  GraphicsNode,
  GetInternalGraphicsAccessor,
  SetInternalGraphicsAccessor,
  GetParentAccessor,
  SetParentAccessor,
  ZOrderResolutionFuncAccessor,
  ZOrderResolutionCleanUpFuncAccessor,
  GetSceneElementsAccessor,
} from "../../../../models/interfaces/graphics-container";

import type { InternalGenerateCMatrixAndBoundMethodAccessor } from "../../../../models/types/render-node";

import type { IRenderer } from "../../../../models/interfaces/renderer";
import type { TransformStack } from "../../../../models/types/common";
/* -------------------------------------------------------------------------- */
/*                                Common Types                                 */
/* -------------------------------------------------------------------------- */

import type {
  InternalGeometryAccessor,
  InternalStyleAccessor,
} from "../../../../models/types/graphics-model";
import type {
  RenderInfrastructure,
  RenderUpdateType,
} from "../../../../models/types/render-infrastructure";
/* -------------------------------------------------------------------------- */
/*                          Runtime Engine Subsystems                          */
/* -------------------------------------------------------------------------- */

import { GraphicsModel } from "../../../../core/graphics-model/graphics-model.js";

//import { Warn } from '../../utils/hshapepers/helpers.js';
import {
  InvalidInternalStateError,
  InvalidRenderableShapeError,
} from "../../../../errors/index.js";

import { createSVGElement, SVGSOURCE, removeFrom } from "../core/core.js";
import { SceneModel } from "../../../scene/scene-model.js";
import { RenderPhase } from "../../../../utils/helpers/helpers.js";
import {
  FilterRecord,
  IGlowFilter,
} from "../../../../models/interfaces/filters.js";
import { SVGFilters } from "../filters/svg-filters.js";
import { GraphicsRenderNode } from "../../../../models/interfaces/render-node.js";

type GraphicsNodeWithInternalAccessMethods = GraphicsNode &
  InternalGeometryAccessor &
  InternalStyleAccessor &
  GetInternalGraphicsAccessor &
  SetInternalGraphicsAccessor &
  GetParentAccessor &
  SetParentAccessor &
  ZOrderResolutionFuncAccessor &
  ZOrderResolutionCleanUpFuncAccessor &
  GetSceneElementsAccessor &
  InternalGenerateCMatrixAndBoundMethodAccessor;

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
 * - All heavy computations happen outside (in modshape / geometry layer)
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
 * - WeakMap-based per-shapeement caching
 * - Geometry diffing using string comparison
 * - Reference-based optimization for buffers (polyline/polygon)
 * - Style diffing
 * - Dirty-flag driven rendering
 *
 * ----------------------------------------------------------------------------
 * DESIGN ARCHITECTURE
 * ----------------------------------------------------------------------------
 * Input:
 *   shapesStack: Array<GraphicsModshape>
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
 * - shapelipse
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
 * - Non-GraphicsModshape shape → throws error
 * - Missing geometry → throws error
 * - Active batching state → throws error
 *
 * ----------------------------------------------------------------------------
 * SUMMARY
 * ----------------------------------------------------------------------------
 * SVGRenderer is an optimized, low-levshape DOM writer that ensures:
 * - minimal DOM mutations
 * - high rendering performance
 * - strict separation between computation and rendering
 */
export class SVGRenderer implements IRenderer {
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
   * - Keys are DOM shapeements (no manual cleanup required)
   * - Garbage collection automatically removes unused entries
   *
   * Each DOM shapeement gets its own independent cache object.
   */

  /**
   * ============================================================================
   * Authoritative scene graph reference.
   * ============================================================================
   *
   * Represents the root scene model observed and projected by this renderer.
   *
   * Responsibilities:
   * - Provides scene hierarchy access
   * - Provides geometry/style state access
   * - Acts as renderer synchronization source
   *
   * IMPORTANT:
   * The renderer observes this scene but does not own authoritative scene state.
   * ============================================================================
   */
  #scene!: SceneModel;

  /**
   * ============================================================================
   * Renderer-owned projection infrastructure registry.
   * ============================================================================
   *
   * Stores backend-specific render infrastructure associated with scene models.
   *
   * Infrastructure examples:
   * - viewport hosts
   * - render surfaces
   * - resource containers
   * - render content roots
   *
   * IMPORTANT:
   * - Infrastructure is renderer-local state
   * - Infrastructure is NOT authoritative scene state
   * - Scene models remain backend-agnostic
   *
   * WeakMap is intentionally used to:
   * - avoid strong ownership coupling
   * - allow automatic garbage collection
   * - isolate backend projection state
   * ============================================================================
   */
  #sceneInfrastructure = new WeakMap<SceneModel, RenderInfrastructure>();

  /**
   * Geometry cache:
   *
   * Stores last applied **geometry-rshapeated attributes** for each DOM element.
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
   * shapeiminates redundant geometry updates.
   */
  #geoCache? = new WeakMap<Element, Record<string, unknown>>();

  /**
   * Style cache:
   *
   * Stores last applied **style-rshapeated attributes** for each DOM element.
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

  /**
   * ============================================================================
   * Initializes SVG scene projection infrastructure.
   * ============================================================================
   *
   * Creates and registers stable renderer-owned SVG infrastructure required
   * for scene projection and rendering.
   *
   * Structure:
   *
   * <svg>
   *   <defs />
   *   <rect />      // surface host
   *   <g />         // render content host
   * </svg>
   *
   * Responsibilities:
   * - svg      -> viewport host
   * - defs     -> reusable SVG resources
   * - rect     -> visual scene surface/background
   * - g        -> render root for scene children
   *
   * NOTE:
   * Infrastructure nodes are renderer-owned and are intentionally isolated
   * from user renderable ordering logic.
   * ============================================================================
   */
  constructor(scene: SceneModel) {
    this.#scene = scene;

    // =========================================================
    // Viewport Host
    // =========================================================

    const svg = createSVGElement("svg", SVGSOURCE);

    // =========================================================
    // Resource Host
    // =========================================================

    const defs = createSVGElement("defs", SVGSOURCE);

    // =========================================================
    // Surface Host
    // =========================================================

    const surface = createSVGElement("rect", SVGSOURCE);

    // =========================================================
    // Scene Content Host
    // =========================================================

    const contentRoot = createSVGElement("g", SVGSOURCE);

    // =========================================================
    // Stable Infrastructure Hierarchy
    // =========================================================

    svg.append(defs);
    svg.append(surface);
    svg.append(contentRoot);

    // =========================================================
    // Bind Primary Graphics Host To Scene
    // =========================================================

    this.#scene[SET_INTERNAL_GRAPHICS_METHOD](svg, DEV_INTERNAL_ACCESS_KEY);

    // =========================================================
    // Static DOM Configuration
    // =========================================================

    const domStyle = svg.style;

    domStyle.position = "absolute";
    domStyle.display = "block";
    domStyle.boxSizing = "border-box";
    domStyle.overflow = "hidden";

    // =========================================================
    // Register Renderer Infrastructure
    // =========================================================

    this.#sceneInfrastructure.set(this.#scene, {
      viewportHost: svg,
      resourceHost: defs,
      surfaceHost: surface,
      contentHost: contentRoot,
    });
  }

  /**
   * ============================================================================
   * Synchronizes scene state into SVG projection infrastructure.
   * ============================================================================
   *
   * Updates:
   * - viewport geometry
   * - viewport positioning
   * - surface geometry
   * - surface styling
   *
   * This method performs incremental synchronization using internal caches
   * to avoid redundant DOM mutations.
   * ============================================================================
   */
  #processScene() {
    // =========================================================
    // Scene State References
    // =========================================================

    const geoRef = this.#scene[GET_INTERNAL_GEOMETRY_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );

    const styleRef = this.#scene[GET_INTERNAL_STYLE_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );

    const figRef = this.#scene[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    ) as SVGSVGElement;

    // =========================================================
    // Renderer Infrastructure
    // =========================================================

    const infrastructure = this.#sceneInfrastructure.get(this.#scene);

    if (!infrastructure) return;

    const surface = infrastructure.surfaceHost as SVGRectElement;

    // =========================================================
    // Incremental Update Caches
    // =========================================================

    const geoCache = this.#getOrInitGeoCache(figRef);

    const styleCache = this.#getOrInitStyleCache(figRef);

    // =========================================================
    // Geometry State
    // =========================================================

    const { x, y, width, height } = geoRef as {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    const xs = this.#numToStr(x);
    const ys = this.#numToStr(y);
    const ws = this.#numToStr(width);
    const hs = this.#numToStr(height);

    // =========================================================
    // Viewport Sizing
    // =========================================================

    geoCache["__width"] !== ws &&
      (figRef.setAttribute("width", ws), (geoCache["__width"] = ws));

    geoCache["__height"] !== hs &&
      (figRef.setAttribute("height", hs), (geoCache["__height"] = hs));

    // =========================================================
    // Viewport Coordinate Space
    // =========================================================

    figRef.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // =========================================================
    // DOM Positioning
    // =========================================================

    const domStyle = figRef.style;

    geoCache["__x"] !== xs &&
      ((domStyle.left = `${x}px`), (geoCache["__x"] = xs));

    geoCache["__y"] !== ys &&
      ((domStyle.top = `${y}px`), (geoCache["__y"] = ys));

    // =========================================================
    // Surface Geometry
    // =========================================================

    surface.setAttribute("x", "0");
    surface.setAttribute("y", "0");

    geoCache["__surfaceWidth"] !== ws &&
      (surface.setAttribute("width", ws), (geoCache["__surfaceWidth"] = ws));

    geoCache["__surfaceHeight"] !== hs &&
      (surface.setAttribute("height", hs), (geoCache["__surfaceHeight"] = hs));

    // =========================================================
    // Surface Styling
    // =========================================================

    (Object.keys(styleRef) as Array<keyof typeof styleRef>).forEach((key) => {
      const value = String(styleRef[key]);
      surface.setAttribute(key, String(value));

      styleCache[key] !== value &&
        (surface.setAttribute(key, value), (styleCache[key] = value));
    });
  }

  /* ============================================================================
   * INTERNAL HELPERS
   * ============================================================================ */

  /**
   * Retrieves or initializes the geometry cache for a given shapeement.
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Checks if a cache object exists for the shapeement
   * - If not:
   *     - creates a new empty object (no prototype)
   *     - stores it in WeakMap
   *
   * WHY Object.create(null)?
   * ----------------------------------------------------------------------------
   * - No prototype chain → faster lookups
   * - No inherited properties → safer key storage
   *
   * @param shape - Target DOM element
   * @returns Geometry cache object for that shapeement
   */
  #getOrInitGeoCache(shape: Element): Record<string, unknown> {
    let c = this.#geoCache?.get(shape);

    if (c === undefined) {
      c = Object.create(null) as Record<string, unknown>;
      this.#geoCache?.set(shape, c);
    }

    return c;
  }

  /**
   * Retrieves or initializes the style cache for a given shapeement.
   *
   * HOW IT WORKS
   * ----------------------------------------------------------------------------
   * - Same logic as geometry cache
   * - Ensures each shapeement has its own style cache
   *
   * @param shape - Target DOM element
   * @returns Style cache object for that shapeement
   */
  #getOrInitStyleCache(shape: Element): Record<string, string> {
    let c = this.#styleCache.get(shape);

    if (c === undefined) {
      c = Object.create(null) as Record<string, string>;
      this.#styleCache.set(shape, c);
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

  #processPendingDeletions() {
    const removedElements: GraphicsNode[] = this.#scene[
      GET_PENDING_DELETION_ELEMENTS_METHOD
    ](SYSTEM_INTERNAL_ACCESS_KEY);

    if (!removedElements.length) return;

    const infrastructure = this.#sceneInfrastructure.get(this.#scene);
    const sceneRoot = infrastructure!.contentHost as SVGGElement;

    for (let i = removedElements.length - 1; i >= 0; i--) {
      const element = removedElements[
        i
      ] as GraphicsNodeWithInternalAccessMethods;
      const domEle = element[GET_INTERNAL_GRAPHICS_METHOD](
        DEV_INTERNAL_ACCESS_KEY,
      );

      removeFrom(sceneRoot, domEle);

      element[SET_INTERNAL_GRAPHICS_METHOD](null, DEV_INTERNAL_ACCESS_KEY);
    }
  }

  #processPendingCreations() {
    const creationElements: GraphicsNode[] = this.#scene[
      GET_PENDING_CREATION_ELEMENTS_METHOD
    ](SYSTEM_INTERNAL_ACCESS_KEY);

    if (!creationElements.length) return;

    const infrastructure = this.#sceneInfrastructure.get(this.#scene);
    const sceneRoot = infrastructure!.contentHost as SVGGElement;

    // Iterate through all shapes in the render stack
    for (let index = 0; index < creationElements.length; index++) {
      const shape = creationElements[
        index
      ] as GraphicsNodeWithInternalAccessMethods;

      // --------------------------------------------------------------------------
      // STEP 1: Validate renderable shape
      // --------------------------------------------------------------------------
      if (!(shape instanceof GraphicsModel)) {
        throw new InvalidRenderableShapeError(shape, "Renderer.render");
      }
      // --------------------------------------------------------------------------
      // STEP 2: Extract geometry reference (internal state)
      // --------------------------------------------------------------------------

      const shapeType = shape.geometry.shape; // shape type

      let figRef = shape[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY); // actual SVG DOM node

      // --------------------------------------------------------------------------
      // DOM Element creation and mount
      // --------------------------------------------------------------------------

      if (!figRef) {
        const tagName: string = (
          shapeType === "dot"
            ? "circle"
            : shapeType === "curve"
              ? "polyline"
              : shapeType
        ) as string;

        figRef = createSVGElement(tagName, SVGSOURCE);

        shape[SET_INTERNAL_GRAPHICS_METHOD](figRef, DEV_INTERNAL_ACCESS_KEY);

        this.#attributeSetter(shape);

        if (sceneRoot) {
          sceneRoot.appendChild(figRef);
        }
      }
    }
  }

  /**
   * Computes the local axis-aligned bounding box (AABB) of an SVG graphics
   * element using the browser's native SVG geometry API.
   *
   * This method is used internally during the renderer's geometry update
   * phase to obtain the current bounding box of a rendered SVG shape. The
   * returned bounding box is then used to update the corresponding graphics
   * model's cached bounds and, when applicable, regenerate its canonical
   * matrix.
   *
   * The measurement is performed in the element's local SVG coordinate
   * system and does not include transformations applied by ancestor
   * elements.
   *
   * @param shape The SVG graphics element whose bounding box should be
   * measured.
   * @returns The element's local axis-aligned bounding box.
   */
  #measureSVGBBox(shape: SVGGraphicsElement): DOMRect {
    return shape.getBBox();
  }
  /* ============================================================================
   * PUBLIC API
   * ============================================================================ */

  /**
   * Renders a stack of shapes to their respective SVG shapeements.
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
   * @param shapesStack - Array of GraphicsModshape instances to render
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
   * - Throws if shape is not GraphicsModshape
   * - Throws if geometry is missing
   * - Throws if batching mode is active
   */

  public render(phase: RenderPhase, ...shapes: GraphicsNode[]) {
    switch (phase) {
      case RenderPhase.PREPARE:
        this.#processPendingDeletions();
        this.#scene[COMMIT_PENDING_DELETION_METHOD]();
        this.#processPendingCreations();
        this.#scene[COMMIT_PENDING_CREATION_METHOD]();
        break;

      case RenderPhase.RENDER:
        this.#processScene();

        this.#processActiveElements(...shapes);

        break;
    }
  }
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
   * - preparing per-shapeement caches
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
   * 1. Validate shape type (must be GraphicsModshape)
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
   * - Throws if shape is not an instance of GraphicsModshape
   * - Throws if geometry reference is missing
   * - Throws if transformation batching is still active
   *
   * ----------------------------------------------------------------------------
   * IMPORTANT INVARIANTS
   * ----------------------------------------------------------------------------
   * - Every shapeement processed here must be renderable
   * - Geometry must exist before rendering
   * - Dirty flag must control rendering shapeigibility
   * - No rendering allowed during batching phase
   */

  #processActiveElements(...shapesStack: GraphicsNode[]) {
    const infrastructure = this.#sceneInfrastructure.get(this.#scene);

    if (!infrastructure) return;

    const resourceHost = infrastructure.resourceHost as SVGDefsElement;
    // Iterate through all shapes in the render stack

    for (let index = 0; index < shapesStack.length; index++) {
      const shape = shapesStack[index] as GraphicsNodeWithInternalAccessMethods;

      // --------------------------------------------------------------------------
      // STEP 1: Validate renderable shape
      // --------------------------------------------------------------------------
      if (!(shape instanceof GraphicsModel)) {
        throw new InvalidRenderableShapeError(shape, "Renderer.render");
      }
      // --------------------------------------------------------------------------
      // STEP 2: Extract geometry reference (internal state)
      // --------------------------------------------------------------------------
      const geoRef = shape[GET_INTERNAL_GEOMETRY_METHOD](
        DEV_INTERNAL_ACCESS_KEY,
      ) as Partial<{
        localDirty: boolean; // indicates if re-render is needed
        renderUpdateType: RenderUpdateType;
        worldMatrix: Float32Array; // parent -> child composed transformation matrix
        shape: string;
        worldDirty: boolean;
      }>;

      // Geometry must exist for rendering
      if (!geoRef) {
        throw new InvalidInternalStateError(
          geoRef,
          "initialized geometry reference",
          "Shape geometry is missing",
          "Renderer.render",
        );
      }

      // --------------------------------------------------------------------------
      // STEP 3: Skip non-dirty shapes (performance optimization)
      // --------------------------------------------------------------------------
      if (!geoRef.localDirty) continue;

      // --------------------------------------------------------------------------
      // STEP 4: Extract style and DOM references
      // --------------------------------------------------------------------------

      let figRef = shape[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY); // actual SVG DOM node

      /**
       * DOM ORDER SYNCHRONIZATION (SVG)
       * ----------------------------------------------------------------------------
       * Ensures that the SVG DOM order matches the engine-defined render order
       * (`shapesStack`, already sorted by ).
       *
       * In SVG, visual stacking is determined purshapey by DOM order:
       * - earlier nodes → rendered behind
       * - later nodes   → rendered on top
       *
       */

      if (figRef) {
        const sceneRoot = infrastructure.contentHost as SVGGElement;

        // update bounds only when geometry of shape changed
        // update canonical buffer or matrix when shape is 'text' or some future shapes may be
        if (geoRef.renderUpdateType === "GEOMETRY") {
          let setCMatrix = false;
          if (geoRef.shape === "text") setCMatrix = true;
          shape[GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD](
            this.#measureSVGBBox(figRef as SVGGraphicsElement),
            setCMatrix,
            DEV_INTERNAL_ACCESS_KEY,
          );
        }
        if (sceneRoot) {
          const domIndex = index;
          const currentNodeAtIndex = sceneRoot.children[domIndex];

          if (currentNodeAtIndex !== figRef) {
            sceneRoot.appendChild(figRef);
          }
        }
      }

      // --------------------------------------------------------------------------
      // STEP 5: Prevent rendering during transformation batching
      // --------------------------------------------------------------------------
      /*
      if ((shape  ).isBatching()) {
        throw new OperationInProgressError(
          'transformation batching',
          'render operation',
          'Renderer.render'
        );
      }
			*/

      const rShape = shape as unknown as GraphicsRenderNode;
      if (rShape.filters.hasFilter()) {
        this.#processFilters(rShape, resourceHost);
      }
      const renderUpdateType = geoRef.renderUpdateType;
      if (renderUpdateType === "TRANSFORM") {
        const styleCache = this.#getOrInitStyleCache(figRef);
        /**
         * Applies the computed world transform to the DOM shapeement.
         *
         * - Uses `worldMatrix` as the single source of truth for rendering.
         * - Updates only when `dirty` or `worldDirty` is true to avoid redundant writes.
         * - Converts Float32Array matrix into SVG `matrix(a b c d e f)` format.
         * - Uses `styleCache` to prevent unnecessary DOM mutations.
         */
        const world = geoRef.worldMatrix as Float32Array;

        if (geoRef.worldDirty || geoRef.localDirty) {
          const a = world[0],
            b = world[1],
            c = world[3],
            d = world[4],
            e = world[6],
            f = world[7];

          const transformStr = `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;

          if (styleCache["transform"] !== transformStr) {
            figRef.setAttribute("transform", transformStr);
            styleCache["transform"] = transformStr;
          }
        }
      } else if (
        renderUpdateType === "GEOMETRY" ||
        renderUpdateType == "STYLE"
      ) {
        this.#attributeSetter(shape);
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
       *   → will NOT enter rendering pipshapeine in next frame
       *
       * PERFORMANCE IMPACT
       * ----------------------------------------------------------------------------
       * This is the core mechanism enabling:
       *   O(changed_shapes) rendering instead of O(total_shapes)
       */

      geoRef.localDirty = false;
    }
  }

  #attributeSetter(shape: GraphicsNodeWithInternalAccessMethods) {
    // --------------------------------------------------------------------------
    // STEP 2: Extract geometry reference (internal state)
    // --------------------------------------------------------------------------
    const geoRef = shape[GET_INTERNAL_GEOMETRY_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    ) as Partial<{
      localDirty: boolean; // indicates if re-render is needed
      buffer: Float32Array; // geometry buffer (used in poly shapes)
      transformStack: TransformStack; // transformation stack (if applicable)
      shape: string; // shape type identifier
      renderUpdateType: RenderUpdateType;
    }>;

    // Geometry must exist for rendering
    if (!geoRef) {
      throw new InvalidInternalStateError(
        geoRef,
        "initialized geometry reference",
        "Shape geometry is missing",
        "Renderer.render",
      );
    }

    // --------------------------------------------------------------------------
    // STEP 3: Skip non-dirty shapes (performance optimization)
    // --------------------------------------------------------------------------
    if (!geoRef.localDirty) return;

    // --------------------------------------------------------------------------
    // STEP 4: Extract style and DOM references
    // --------------------------------------------------------------------------
    const styleRef = shape[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY); // style object

    let figRef = shape[GET_INTERNAL_GRAPHICS_METHOD](DEV_INTERNAL_ACCESS_KEY); // actual SVG DOM node
    const shapeType = geoRef?.shape; // shape type

    // --------------------------------------------------------------------------
    // STEP 6: Initialize per-shapeement caches
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
     * - Extract required geometry fishapeds
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

    switch (shapeType) {
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
      case "dot": {
        const { cx, cy, r } = geoRef as {
          cx: number;
          cy: number;
          r: number;
        };
        const cr = r < 1 ? 1 : r > 5 ? 5 : r;

        const cxStr = this.#numToStr(cx);
        const cyStr = this.#numToStr(cy);
        const rStr = this.#numToStr(cr);

        geoCache["__cx"] !== cxStr && (desiredAttrs["cx"] = cxStr);
        geoCache["__cy"] !== cyStr && (desiredAttrs["cy"] = cyStr);
        geoCache["__r"] !== rStr && (desiredAttrs["r"] = rStr);

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
      case "line": {
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

        geoCache["__x1"] !== x1s && (desiredAttrs["x1"] = x1s);
        geoCache["__y1"] !== y1s && (desiredAttrs["y1"] = y1s);
        geoCache["__x2"] !== x2s && (desiredAttrs["x2"] = x2s);
        geoCache["__y2"] !== y2s && (desiredAttrs["y2"] = y2s);

        break;
      }

      /**
       * CIRCLE
       * ----------------------------------------------------------------------------
       * Standard SVG circle shapeement.
       *
       * Attributes:
       * - cx, cy → center
       * - r      → radius
       *
       * Uses direct numeric-to-string conversion and cache comparison.
       */
      case "circle": {
        const { cx, cy, r } = geoRef as {
          cx: number;
          cy: number;
          r: number;
        };

        const cxs = this.#numToStr(cx);
        const cys = this.#numToStr(cy);
        const rs = this.#numToStr(r);

        geoCache["__cx"] !== cxs && (desiredAttrs["cx"] = cxs);
        geoCache["__cy"] !== cys && (desiredAttrs["cy"] = cys);
        geoCache["__r"] !== rs && (desiredAttrs["r"] = rs);

        break;
      }

      /**
       * shapeLIPSE
       * ----------------------------------------------------------------------------
       * Represents an shapelipse with different radii.
       *
       * Attributes:
       * - cx, cy → center
       * - rx, ry → radii on x and y axes
       *
       * Each attribute is independently diff-checked.
       */
      case "ellipse": {
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

        geoCache["__cx"] !== cxs && (desiredAttrs["cx"] = cxs);
        geoCache["__cy"] !== cys && (desiredAttrs["cy"] = cys);
        geoCache["__rx"] !== rxs && (desiredAttrs["rx"] = rxs);
        geoCache["__ry"] !== rys && (desiredAttrs["ry"] = rys);

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
      case "rect": {
        const {
          x,
          y,
          width,
          height,
          rx = 0,
          ry = 0,
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

        geoCache["__x"] !== xs && (desiredAttrs["x"] = xs);
        geoCache["__y"] !== ys && (desiredAttrs["y"] = ys);
        geoCache["__width"] !== ws && (desiredAttrs["width"] = ws);
        geoCache["__height"] !== hs && (desiredAttrs["height"] = hs);
        geoCache["__rx"] !== rxs && (desiredAttrs["rx"] = rxs);
        geoCache["__ry"] !== rys && (desiredAttrs["ry"] = rys);

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
      case "polyline":
      case "polygon":
      case "curve": {
        const { buffer: matrix } = geoRef as {
          buffer: Float32Array;
        };

        const prevMatrixRef = geoCache["__buffer"] as Float32Array;

        if (prevMatrixRef !== matrix) {
          const len = matrix.length;
          const parts: string[] = new Array(len);

          for (let i = 0; i < len; i = i + 3) {
            parts[i] = `${matrix[i]},${matrix[i + 1]}`;
          }

          desiredAttrs["points"] = parts.join(" ");
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
      case "path": {
        const { d } = geoRef as { d: string };

        if (typeof d === "string") {
          if (geoCache["__d"] !== d) {
            desiredAttrs["d"] = d;
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
      case "text": {
        const { x, y, text } = geoRef as {
          x: number;
          y: number;
          text: string;
        };

        const xs = this.#numToStr(x);
        const ys = this.#numToStr(y);

        geoCache["__x"] !== xs && (desiredAttrs["x"] = xs);
        geoCache["__y"] !== ys && (desiredAttrs["y"] = ys);

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
      case "image": {
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

        geoCache["__x"] !== xs && (desiredAttrs["x"] = xs);
        geoCache["__y"] !== ys && (desiredAttrs["y"] = ys);
        geoCache["__width"] !== ws && (desiredAttrs["width"] = ws);
        geoCache["__height"] !== hs && (desiredAttrs["height"] = hs);
        geoCache["__href"] !== href && (desiredAttrs["href"] = href);

        break;
      }

      /**
       * DEFAULT
       * ----------------------------------------------------------------------------
       * No operation for unsupported or unknown shapes.
       * Renderer safshapey ignores unrecognized shape types.
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
     * Applies style-rshapeated attributes to the SVG element using the same
     * diff-based strategy as geometry.
     *
     * Styles are treated separatshapey because:
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
     * - shapeiminates redundant style writes
     * - Prevents unnecessary style recalculations in browser
     * - Uses per-shapeement cache for O(1) comparisons
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

    if (styleRef && typeof styleRef === "object") {
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
    geoRef.renderUpdateType = "TRANSFORM";
  }

  //===================================
  // Filters Section
  //===================================

  /**
   * Cache of initialized SVG filter definitions.
   *
   * Each entry maps a unique filter identifier to its corresponding SVG
   * `<filter>` element. Once created, filter definitions are reused instead
   * of being recreated on every render pass.
   *
   * A cached filter should only be removed when it is no longer referenced
   * by any graphical object.
   */
  #filtersCache = new Map<string, SVGFilterElement>();

  /**
   * Tracks the set of filter identifiers currently associated with each
   * graphical object during the previous render pass.
   *
   * This cache allows the renderer to efficiently determine:
   * - Newly added filters.
   * - Removed filters.
   * - Unchanged filters.
   *
   * A {@link WeakMap} is used so that entries are automatically eligible
   * for garbage collection when their corresponding graphical objects are
   * destroyed.
   */
  #shapeFiltersCache = new WeakMap<GraphicsRenderNode, Set<string>>();

  #initializeFilter(
    filterId: string,
    filterData: FilterRecord,
  ): SVGFilterElement {
    let filter!: SVGFilterElement;
    const fType = filterData.type;

    switch (fType) {
      case "blur": {
        filter = SVGFilters.blur(filterId, filterData.props.radius);
        break;
      }
      case "contrast": {
        filter = SVGFilters.contrast(filterId, filterData.props.amount);
        break;
      }

      case "saturate": {
        filter = SVGFilters.saturate(filterId, filterData.props.amount);
        break;
      }
      case "grayscale": {
        filter = SVGFilters.grayscale(filterId, filterData.props.amount);
        break;
      }

      case "hueRotate": {
        filter = SVGFilters.hueRotate(filterId, filterData.props.angle);
        break;
      }

      case "glow": {
        filter = SVGFilters.glow(filterId, filterData.props);
        break;
      }

      case "shadow": {
        filter = SVGFilters.shadow(filterId, filterData.props);
        break;
      }
    }

    return filter;
  }

  /**
   * Synchronizes the filter definitions associated with the specified
   * graphical object.
   *
   * This method compares the filters currently registered on the graphical
   * object with those processed during the previous render pass.
   *
   * During synchronization it will:
   *
   * - Remove SVG filter definitions that are no longer present.
   * - Create SVG filter definitions for newly added filters.
   * - Reuse previously initialized filter definitions whenever possible.
   * - Update the renderer's internal filter caches.
   *
   * @param node Graphical object whose filters should be synchronized.
   */
  #processFilters(node: GraphicsRenderNode, resourceHost: SVGDefsElement) {
    const currentFilters = node.filters.getAllFilters();

    /**
     * Filter identifiers currently registered on the graphical object.
     */
    const currentIds = new Set(currentFilters.keys());

    /**
     * Filter identifiers processed during the previous render pass.
     */
    const previousIds = this.#shapeFiltersCache.get(node) ?? new Set<string>();

    // ---------------------------------------------------------------------
    // Remove deleted filters.
    // ---------------------------------------------------------------------

    for (const filterId of previousIds) {
      if (currentIds.has(filterId)) continue;

      const filterElement = this.#filtersCache.get(filterId);

      if (filterElement) {
        filterElement.remove();

        this.#filtersCache.delete(filterId);
      }
    }

    // ---------------------------------------------------------------------
    // Create newly added filters.
    // ---------------------------------------------------------------------

    for (const [filterId, filterData] of currentFilters) {
      if (this.#filtersCache.has(filterId)) continue;

      const filterElement = this.#initializeFilter(filterId, filterData);

      resourceHost.appendChild(filterElement);

      this.#filtersCache.set(filterId, filterElement);
    }

    // ---------------------------------------------------------------------
    // Store the current filter state for the next render pass.
    // ---------------------------------------------------------------------

    this.#shapeFiltersCache.set(node, currentIds);
  }
}
