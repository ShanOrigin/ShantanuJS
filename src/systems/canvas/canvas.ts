/* -------------------------------------------------------------------------- */
/*                            Internal Capability Keys                         */
/* -------------------------------------------------------------------------- */

import {
  CanvasParentNotFoundError,
  NotInitializedError,
} from "../../errors/index.js";
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GRAPHICS_METHOD,
} from "../../internal/keys/dev-keys.js";

import {
  GET_SCENE_ELEMENTS_METHOD,
  GET_SCENE_ELEMENT_ID_MAP_METHOD,
  GET_SCENE_Z_ORDER_RESOLVER_METHOD,
  SYSTEM_INTERNAL_ACCESS_KEY,
} from "../../internal/keys/system-keys.js";

/* -------------------------------------------------------------------------- */
/*                             Interface Contracts                             */
/* -------------------------------------------------------------------------- */

import type { ICanvas } from "../../models/interfaces/canvas";

import type {
  GraphicsNode,
  IGraphicsContainer,
} from "../../models/interfaces/graphics-container";
import type { GraphicsRenderNode } from "../../models/interfaces/render-node";
import type { IRenderer } from "../../models/interfaces/renderer";

/* -------------------------------------------------------------------------- */
/*                                Common Types                                 */
/* -------------------------------------------------------------------------- */

import type {
  CanvasAttrsPropsTypes,
  CanvasInitProps,
} from "../../models/types/canvas";

import type { AttrsMethodReturnTypes } from "../../models/types/common";

import { Log } from "../../utils/helpers/helpers.js";

/* -------------------------------------------------------------------------- */
/*                          Runtime Engine Subsystems                          */
/* -------------------------------------------------------------------------- */

import { Engine } from "../engine/engine.js";

import { EventSystem } from "../event/event-system.js";

import { initRenderer } from "../renderer/renderer.js";

import { SceneModel } from "../scene/scene-model.js";

/**
 * Root graphical canvas container responsible for orchestrating:
 * - Scene management
 * - Rendering coordination
 * - Engine lifecycle integration
 * - Event dispatch integration
 *
 * ============================================================================
 * ARCHITECTURAL ROLE
 * ============================================================================
 *
 * `Canvas` acts as the primary orchestration layer of the rendering system.
 *
 * It coordinates communication between:
 * - SceneModel        → structural scene state
 * - Renderer          → backend rendering abstraction
 * - Engine            → rendering execution lifecycle
 * - EventSystem       → synthetic interaction dispatching
 *
 *
 * ============================================================================
 * RESPONSIBILITIES
 * ============================================================================
 *
 * Structural Responsibilities:
 * - Root scene graph ownership
 * - Graphical entity registration/removal
 * - Scene-level element access
 *
 * Runtime Responsibilities:
 * - Engine initialization
 * - Renderer initialization
 * - DOM event binding
 * - Internal subsystem orchestration
 *
 * Event Responsibilities:
 * - DOM pointer event bridging
 * - Synthetic event dispatch delegation
 *
 *
 * ============================================================================
 * DESIGN CHARACTERISTICS
 * ============================================================================
 *
 * - Acts as public-facing orchestration API
 * - Delegates structural state management to `SceneModel`
 * - Delegates rendering execution to `Engine`
 * - Delegates event propagation to `EventSystem`
 * - Uses capability-based internal access for privileged subsystem coordination
 *
 *
 * ============================================================================
 * INTERNAL ACCESS MODEL
 * ============================================================================
 *
 * Canvas internally accesses SceneModel state through:
 * - Symbol-keyed computed methods
 * - Capability-token validation
 *
 * This preserves:
 * - Encapsulation boundaries
 * - Structural invariants
 * - Internal subsystem separation
 *
 *
 * ============================================================================
 * LIFECYCLE
 * ============================================================================
 *
 * Initialization Flow:
 *
 *   Canvas
 *      ↓
 *   SceneModel creation
 *      ↓
 *   Renderer initialization
 *      ↓
 *   Engine creation
 *      ↓
 *   EventSystem creation
 *      ↓
 *   DOM event binding
 *      ↓
 *   Engine startup
 *
 *
 * ============================================================================
 * FINAL CHARACTERIZATION
 * ============================================================================
 *
 * This class represents:
 *
 *   "The root orchestration container coordinating scene state,
 *    rendering systems, engine execution, and interaction flow."
 */
export class Canvas implements IGraphicsContainer, ICanvas {
  /**
   * Host DOM container into which the rendered canvas
   * root graphical primitive is mounted.
   *
   * Responsibilities:
   * - Acts as browser-level mounting boundary
   * - Owns external DOM attachment relationship
   *
   * Important:
   * - Independent from logical scene graph hierarchy
   * - Does not represent graphical parent relationship
   */
  #hostElement: HTMLElement | null = null;

  /**
   * Internal structural scene state container.
   *
   * Responsibilities:
   * - Element collection ownership
   * - Scene graph structural operations
   * - Element lookup management
   * - Z-order state coordination
   *
   * Architectural Note:
   * - Does NOT own renderer or engine runtime systems.
   * - Acts purely as structural scene-state layer.
   */
  #sceneModel!: SceneModel;

  /**
   * Rendering backend abstraction responsible for translating
   * graphical entities into backend-specific drawable primitives.
   *
   * Supported Backend Types:
   * - SVG
   * - Canvas2D
   * - Future rendering backends
   *
   * Responsibilities:
   * - Primitive generation
   * - Render synchronization
   * - Backend-specific drawing operations
   *
   * Invariant:
   * - Must be initialized before rendering execution begins.
   */
  #renderer!: IRenderer;

  /**
   * Rendering execution engine coordinating:
   * - Frame lifecycle execution
   * - Render scheduling
   * - State propagation
   * - Render synchronization
   *
   * Architectural Role:
   * - Acts as runtime execution coordinator for rendering operations.
   *
   * Invariant:
   * - Must remain synchronized with scene state collections.
   */
  public engine!: Engine;

  /**
   * Centralized synthetic event dispatch system for the canvas.
   *
   * Responsibilities:
   * - Native DOM event ingestion
   * - Pointer hit testing
   * - Event target resolution
   * - Propagation path construction
   * - Capture/target/bubble phase execution
   *
   * Design Constraints:
   * - Single dispatch authority per canvas instance
   * - Consumes live scene collections from SceneModel
   * - Remains structurally decoupled from rendering backend
   *
   * Lifecycle:
   * - Created once during canvas initialization
   * - Reused for all interaction dispatch operations
   */
  #eventSystem!: EventSystem;

  /**
   * Creates a new root canvas container instance.
   *
   * Responsibilities:
   * - Initializes scene state
   * - Initializes rendering backend
   * - Mounts renderer output into DOM
   * - Initializes rendering engine
   * - Initializes event dispatch system
   * - Binds native DOM interaction events
   *
   * Initialization Flow:
   *
   *   SceneModel
   *      ↓
   *   Renderer
   *      ↓
   *   DOM Mount
   *      ↓
   *   Engine
   *      ↓
   *   EventSystem
   *      ↓
   *   Event Binding
   *
   * @param props - Canvas initialization configuration
   */
  constructor(props: CanvasInitProps & CanvasAttrsPropsTypes) {
    // =========================================================
    // Initialize Rendering Backend + Scene Model
    // =========================================================

    const { id, width, height, x = 0, y = 0, context = "SVG", ...rest } = props;
    this.#sceneModel = new SceneModel({ id, width, height, x, y, ...rest });

    this.#renderer = initRenderer(context, this.#sceneModel);

    // =========================================================
    // Mount Renderer Output Into DOM
    // =========================================================

    this.#mountToDOM(id);

    // =========================================================
    // Resolve Internal Scene References
    // =========================================================

    const canvasElements = this.#sceneModel[GET_SCENE_ELEMENTS_METHOD](
      SYSTEM_INTERNAL_ACCESS_KEY,
    );

    const elementIdMap = this.#sceneModel[GET_SCENE_ELEMENT_ID_MAP_METHOD](
      SYSTEM_INTERNAL_ACCESS_KEY,
    );

    // =========================================================
    // Initialize Rendering Engine
    // =========================================================

    const engine = new Engine(this.#sceneModel, this.#renderer);

    this.engine = engine;

    engine.start();

    // =========================================================
    // Initialize Event System
    // =========================================================

    this.#eventSystem = new EventSystem(
      canvasElements as GraphicsRenderNode[],
      elementIdMap as Map<string, GraphicsRenderNode>,
    );

    // =========================================================
    // Bind DOM Interaction Events
    // =========================================================

    this.#bindDOMEvents();
  }

  /**
   * Mounts the rendered scene root into the target DOM container.
   *
   * Responsibilities:
   * - Resolves host container
   * - Validates renderer output existence
   * - Attaches rendered scene root into DOM
   * - Establishes positioning context when required
   *
   * Important:
   * - DOM hierarchy is independent from scene graph hierarchy
   *
   * @param id - Target DOM container identifier
   */
  #mountToDOM(id: string): void {
    const rootGraphicsElement = this.#sceneModel[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    );

    // =========================================================
    // Resolve DOM Host Container
    // =========================================================

    const host = document.getElementById(id);

    if (__DEV__) {
      Log("canvas id ", id, host);
    }
    if (!host) {
      throw new CanvasParentNotFoundError(id, "Canvas.#mountToDOM()");
    }

    this.#hostElement = host;

    // =========================================================
    // Validate Renderer Output
    // =========================================================

    if (!rootGraphicsElement) {
      throw new NotInitializedError(
        rootGraphicsElement,
        "Root graphical primitive was not initialized by renderer",
        "Canvas.#mountToDOM()",
      );
    }

    // =========================================================
    // Attach Renderer Output To DOM
    // =========================================================

    host.appendChild(rootGraphicsElement);

    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
  }

  /**
   * Binds native DOM interaction events to the internal
   * synthetic event dispatch pipeline.
   *
   * Event Flow:
   *
   *   DOM Event
   *      ↓
   *   Canvas
   *      ↓
   *   EventSystem
   *      ↓
   *   Synthetic Event Dispatch
   *      ↓
   *   Graphical Entity Handlers
   *
   * Architectural Constraints:
   * - Canvas acts as sole DOM interaction boundary
   * - Graphical entities remain DOM-independent
   * - All interaction dispatching flows through EventSystem
   */
  #bindDOMEvents(): void {
    const el = this.#sceneModel[GET_INTERNAL_GRAPHICS_METHOD](
      DEV_INTERNAL_ACCESS_KEY,
    ) as unknown as HTMLElement;

    el.addEventListener("pointerdown", (e) => {
      this.#eventSystem.dispatch(el, e as unknown as PointerEvent);
    });

    el.addEventListener("pointermove", (e) => {
      this.#eventSystem.dispatch(el, e as unknown as PointerEvent);
    });

    el.addEventListener("pointerup", (e) => {
      this.#eventSystem.dispatch(el, e as unknown as PointerEvent);
    });

    el.addEventListener("click", (e) => {
      this.#eventSystem.dispatch(el, e as unknown as PointerEvent);
    });

    el.addEventListener("dblclick", (e) => {
      this.#eventSystem.dispatch(el, e as unknown as PointerEvent);
    });
  }

  /**
   * Unified canvas attribute access interface.
   *
   * Behavior:
   * - Delegates attribute operations to SceneModel
   * - Supports:
   *   - Getter access
   *   - Setter access
   *   - Multi-property retrieval
   *
   * @param props - Attribute query or mutation input
   * @returns Attribute operation result
   */
  public attrs(props: CanvasAttrsPropsTypes | string): AttrsMethodReturnTypes {
    return this.#sceneModel.attrs(props);
  }

  /**
   * Checks whether a graphical entity exists
   * within the canvas scene membership.
   *
   * Return Semantics:
   * - `0`  → entity does not exist
   * - `1`  → entity exists
   *
   * Architectural Note:
   * - Internally delegates structural lookup to SceneModel.
   * - Uses numeric containment semantics for lightweight
   *   membership validation.
   *
   * @param shape - Graphical entity to test
   * @returns Numeric containment state
   */
  public contains(shape: GraphicsNode): number {
    if (!shape) return 0;

    const index = this.#sceneModel.contains(shape);

    if (!index) return 0;

    return 1;
  }

  /**
   * Adds one or more graphical entities
   * to the canvas scene graph.
   *
   * Responsibilities:
   * - Registers entities into scene structure
   * - Enables rendering participation
   * - Establishes structural ownership
   *
   * @param rest - Graphical entities to add
   * @returns Current canvas instance for chaining
   */
  public add(...rest: GraphicsNode[]): this {
    this.#sceneModel.add(...rest);

    return this;
  }

  /**
   * Removes one or more graphical entities
   * from the canvas scene graph.
   *
   * Responsibilities:
   * - Detaches scene membership
   * - Removes rendering participation
   * - Clears structural ownership links
   *
   * @param targets - Graphical entities to remove
   * @returns Current canvas instance for chaining
   */
  public remove(...targets: GraphicsNode[]): this {
    this.#sceneModel.remove(...targets);

    return this;
  }

  /**
   * Clears all graphical entities from the canvas.
   *
   * Responsibilities:
   * - Resets scene graph membership
   * - Clears render participation state
   * - Removes all registered scene entities
   *
   * @returns Current canvas instance for chaining
   */
  public clear(): this {
    this.#sceneModel.clear();

    return this;
  }

  /**
   * Returns all graphical entities currently
   * registered within the canvas scene graph.
   *
   * @returns Array of scene graphical entities
   */
  public getAllElements(): Array<GraphicsNode> {
    return this.#sceneModel.getAllElements();
  }
}
