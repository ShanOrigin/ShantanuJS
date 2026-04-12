import { DEV_INTERNAL_ACCESS } from '../../utils/provider/accesskeys.js';
import type { Renderer } from '../graphics/backends/renderers';
import { GraphicsModel } from '../graphics/graphicsModel/graphicsModel.js';

import type { iShape } from '../../shapes/provider/shapesTypes';
import {
  InvalidArgumentError,
  InvalidInternalStateError
} from '../../utils/errors/provider/shantanuJSErrors.js';
import { Log } from '../../utils/helpers/helpers.js';

/**
 * Core engine responsible for orchestrating the rendering lifecycle.
 *
 * ============================================================================
 * WHAT THIS CLASS IS
 * ============================================================================
 * The Engine is the central coordinator of the rendering and animation system.
 *
 * It owns and controls:
 * - the global requestAnimationFrame loop
 * - animation update timing
 * - delegation of rendering to a concrete Renderer
 * - invocation of z-order resolution logic (injected from Canvas)
 *
 * The Engine itself performs NO drawing and NO animation logic.
 *
 * ============================================================================
 * CORE RESPONSIBILITIES
 * ============================================================================
 * The Engine is responsible for:
 *
 * 1. Managing a single, controlled requestAnimationFrame loop
 * 2. Resolving z-order operations via injected resolver (before each frame)
 * 3. Advancing animation state on all registered shapes
 * 4. Sorting shapes deterministically based on zIndex
 * 5. Delegating visual output to the active Renderer
 * 6. Enforcing engine-level lifecycle invariants
 *
 * ============================================================================
 * Z-ORDER RESOLUTION MODEL
 * ============================================================================
 * The Engine integrates a deferred z-order system using an injected resolver:
 *
 * - Shapes express intent via internal flags (e.g., toFront / toBack)
 * - The Engine invokes a resolver function at the start of each frame
 * - The resolver (owned by Canvas) mutates shape.style.zIndex
 *
 * Ordering is then established by:
 *
 * - Sorting shapes based on zIndex (ascending)
 * - Producing a deterministic render sequence for the current frame
 *
 * This ensures:
 * - separation of concerns (Engine does not own zIndex logic)
 * - no circular dependency between Engine and Canvas
 * - consistent ordering across all rendering backends
 *
 * ============================================================================
 * EXPLICIT NON-RESPONSIBILITIES
 * ============================================================================
 * The Engine does NOT:
 *
 * - perform any drawing operations
 * - contain rendering backend logic
 * - implement animation algorithms
 * - mutate geometry directly
 * - compute or own zIndex values
 *
 * It coordinates; it does not execute domain logic.
 *
 * ============================================================================
 * DESIGN INVARIANTS
 * ============================================================================
 * - Only one engine loop may be active at a time
 * - All shapes managed by the engine must be renderable
 * - Z-order resolution occurs exactly once per frame
 * - Animation updates always occur after z-order resolution
 * - Sorting reflects the current zIndex state
 * - Rendering is delegated, never embedded
 *
 * ============================================================================
 * LIFECYCLE MODEL
 * ============================================================================
 * The Engine exposes an explicit lifecycle:
 *
 * - start() : begins the animation/render loop
 * - stop()  : halts the loop without destroying state
 * - flush() : forces a single render pass (includes z-order resolution)
 *
 * The Engine remains reusable after stopping.
 *
 * ============================================================================
 * SUMMARY
 * ============================================================================
 * The Engine is the temporal backbone of the system.
 *
 * It does not care *what* is being animated or *how* it is drawn.
 * It only ensures that everything happens:
 *
 * - in the correct order (via zIndex resolution + sorting)
 * - at the correct time
 * - under strict lifecycle control
 */

export class Engine {
  /**
   * Internal collection of all shapes managed by the engine.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Stores strong references to every shape instance that is currently
   * registered with this engine.
   *
   * This array represents the authoritative render and update order
   * for all shapes under engine control.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Initialized as an empty array at engine creation
   * - Shapes are added when registered with the engine
   * - Shapes are removed when explicitly detached or destroyed
   *
   * -------------------------------------------------------------------------
   * IMPORTANT NOTE
   * -------------------------------------------------------------------------
   * This collection is engine-internal and must never be exposed
   * directly to userland code.
   */
  #shapes: iShape[] = [];

  /**
   * Rendering backend responsible for visual output.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Acts as the abstraction layer between the engine and the actual
   * rendering implementation (Canvas, SVG, WebGL, etc.).
   *
   * All draw, clear, and frame-related operations are delegated
   * to this renderer instance.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Assigned during engine initialization
   * - Remains constant for the lifetime of the engine instance
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANT
   * -------------------------------------------------------------------------
   * The renderer is assumed to be valid and fully initialized
   * before the engine enters the running state.
   */
  #renderer: Renderer;

  /**
   * Flag indicating whether the engine main loop is currently active.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Tracks the execution state of the engine’s animation/render loop.
   *
   * This flag is used to:
   * - prevent multiple concurrent loops
   * - guard start/stop lifecycle transitions
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Set to true when the engine loop starts
   * - Set to false when the engine loop stops or is cancelled
   */
  #running: boolean;

  /**
   * RequestAnimationFrame identifier for the active engine loop.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Stores the identifier returned by requestAnimationFrame
   * for the currently scheduled frame callback.
   *
   * This enables explicit cancellation of the animation loop
   * when the engine is stopped.
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE
   * -------------------------------------------------------------------------
   * - Assigned when a frame is scheduled
   * - Cleared (set to null) when the loop is cancelled or stopped
   *
   * -------------------------------------------------------------------------
   * IMPORTANT NOTE
   * -------------------------------------------------------------------------
   * A null value indicates that no frame callback is currently pending.
   */
  #rafId: number | null;

  /**
   * Z-order resolution hook injected by the owning Canvas.
   *
   * -------------------------------------------------------------------------
   * ROLE
   * -------------------------------------------------------------------------
   * Provides a deferred mechanism for resolving z-order operations
   * (e.g., toFront / toBack) without introducing direct dependency
   * on the Canvas class.
   *
   * -------------------------------------------------------------------------
   * DESIGN PRINCIPLE
   * -------------------------------------------------------------------------
   * Implements Inversion of Control (IoC):
   * - Engine does NOT own z-order state
   * - Canvas owns and mutates zIndex
   * - Engine only triggers resolution at the correct lifecycle point
   *
   * -------------------------------------------------------------------------
   * EXECUTION CONTRACT
   * -------------------------------------------------------------------------
   * This function MUST:
   * - Resolve all pending z-order operations
   * - Mutate shape.style.zIndex deterministically
   * - Maintain ordering invariants (unique, monotonic values)
   *
   * -------------------------------------------------------------------------
   * TIMING
   * -------------------------------------------------------------------------
   * Invoked at the beginning of each frame BEFORE sorting and rendering.
   *
   * -------------------------------------------------------------------------
   * INVARIANT
   * -------------------------------------------------------------------------
   * Must be a valid function reference. Engine assumes it is safe to call
   * without additional guards.
   */
  #resolveZOrder!: () => void;

  /**
   * Constructs a new Engine instance.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Initializes the engine with the foundational components required
   * to drive rendering and animation:
   *
   * - a collection of shapes to manage
   * - a concrete rendering backend
   * - a z-order resolution hook (injected from Canvas)
   *
   * This constructor establishes ownership and initial lifecycle state
   * but does NOT start the engine loop.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - The engine operates on the provided shapes array by reference
   * - The renderer instance is assumed to be fully initialized
   * - The z-order resolver is provided externally (no Canvas dependency)
   * - No validation or cloning is performed at construction time
   *
   * The engine trusts upstream code to provide valid inputs.
   *
   * -------------------------------------------------------------------------
   * Z-ORDER RESOLUTION MODEL
   * -------------------------------------------------------------------------
   * - Engine does NOT compute or own zIndex
   * - Engine invokes the injected resolver before each frame
   * - Canvas remains the single authority for zIndex mutation
   *
   * This ensures:
   * - separation of concerns
   * - no circular dependency between Engine and Canvas
   * - deterministic ordering pipeline
   *
   * -------------------------------------------------------------------------
   * INITIAL STATE
   * -------------------------------------------------------------------------
   * After construction:
   * - The engine is NOT running
   * - No animation frame is scheduled
   * - No z-order resolution has been performed
   *
   * Explicit lifecycle methods must be invoked to start execution.
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param shapes   Reference to the array containing all shape instances
   *                 managed by this engine.
   *
   * @param renderer Active rendering backend responsible for visual output.
   *
   * @param resolveZOrder
   * A function injected from Canvas that resolves pending z-order operations.
   *
   * This function is:
   * - called once per frame before rendering
   * - responsible for updating shape.style.zIndex
   * - required to maintain ordering invariants
   *
   * -------------------------------------------------------------------------
   * @throws {InvalidArgumentError}
   * If resolveZOrder is not a function (optional strict validation)
   */
  constructor(shapes: iShape[], renderer: Renderer, resolveZOrder: () => void) {
    this.#shapes = shapes;
    this.#renderer = renderer;

    this.#running = false;
    this.#rafId = null;
    if (typeof resolveZOrder !== 'function') {
      throw new InvalidArgumentError(
        'resolveZOrder',
        resolveZOrder,
        'function',
        'core.engine.constructor'
      );
    }
    this.#resolveZOrder = resolveZOrder;
  }

  /**
   * Starts the engine execution loop.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Transitions the engine into a running state and schedules
   * the first animation frame.
   *
   * Once started, the engine will:
   * - update animations
   * - advance internal state
   * - delegate rendering to the active renderer
   *
   * on every animation frame.
   *
   * -------------------------------------------------------------------------
   * STATE INVARIANTS
   * -------------------------------------------------------------------------
   * - If the engine is already running, this method performs a safe no-op
   * - Only one animation loop may be active at a time
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE BEHAVIOR
   * -------------------------------------------------------------------------
   * - Sets the internal running flag
   * - Registers the main loop via requestAnimationFrame
   *
   * This method does NOT:
   * - reset engine state
   * - reinitialize shapes
   * - force a redraw outside the normal loop
   */
  public start() {
    if (this.#running) return;

    this.#running = true;
    this.#rafId = requestAnimationFrame(this.#loop.bind(this));
  }

  /**
   * Stops the engine execution loop.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Halts the engine’s animation and rendering loop by:
   * - clearing the running state
   * - cancelling any scheduled animation frame
   *
   * The engine remains fully initialized and can be restarted
   * by calling start().
   *
   * -------------------------------------------------------------------------
   * STATE INVARIANTS
   * -------------------------------------------------------------------------
   * - If the engine is not running, this method performs a safe no-op
   * - Cancels at most one pending animation frame
   *
   * -------------------------------------------------------------------------
   * LIFECYCLE BEHAVIOR
   * -------------------------------------------------------------------------
   * - Clears the internal running flag
   * - Cancels the active requestAnimationFrame callback (if present)
   * - Resets the stored frame identifier to null
   *
   * This method does NOT:
   * - destroy shapes
   * - release renderer resources
   * - permanently shut down the engine
   */
  public stop() {
    if (!this.#running) return;

    this.#running = false;

    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  /**
   * Forces an immediate render pass outside the normal engine loop.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Explicitly marks all shapes as dirty and executes a single frame
   * render immediately.
   *
   * This method bypasses the animation loop and is intended for
   * manual or emergency re-rendering scenarios.
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - Does not start or stop the engine loop
   * - Does not alter animation timing semantics
   * - Forces geometry invalidation before rendering
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param time - Optional timestamp to use for the forced frame.
   *               Defaults to the current high-resolution time.
   */
  public flush(time: number = performance.now()) {
    // -----------------------------------------------------------
    // STEP 1: Force geometry invalidation
    // -----------------------------------------------------------

    const len = this.#shapes.length;

    for (let i = 0; i < len; i++) {
      const shape = this.#shapes[i];

      const geoRef = shape.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
        dirty: boolean;
      }>;

      // force re-render
      geoRef.dirty = true;
    }

    // -----------------------------------------------------------
    // STEP 2: Execute a single frame
    // -----------------------------------------------------------

    this.#frame(time);
  }

  /**
   * Executes a single engine frame.
   *
   * ============================================================================
   * CORE RESPONSIBILITY
   * ============================================================================
   * Advances the entire rendering pipeline for one frame by performing:
   *
   * 1. Z-order resolution (structural ordering)
   * 2. Animation updates (temporal state progression)
   * 3. Shape ordering (zIndex-based sorting)
   * 4. Rendering delegation (visual projection)
   *
   * This method represents the atomic unit of execution within the engine.
   *
   * ============================================================================
   * EXECUTION PIPELINE
   * ============================================================================
   *
   * STEP 0: Z-ORDER RESOLUTION
   * - Invokes injected resolver from Canvas
   * - Converts pending z-order intents (toFront / toBack) into numeric zIndex
   * - Ensures all shapes have consistent and comparable ordering values
   *
   * STEP 1: ANIMATION UPDATE
   * - Iterates through all shapes
   * - Advances animation state using the provided timestamp
   * - Enforces renderable invariant (must be GraphicsModel)
   *
   * STEP 2: ORDER DERIVATION (SORT)
   * - Sorts shapes based on zIndex (ascending)
   * - Establishes final render order for this frame
   * - Guarantees deterministic stacking across all backends
   *
   * STEP 3: RENDER DELEGATION
   * - Passes sorted shapes to renderer
   * - Renderer applies minimal DOM or draw operations
   *
   * ============================================================================
   * DESIGN INVARIANTS
   * ============================================================================
   * - Z-order resolution is executed exactly once per frame
   * - Animation updates occur after structural ordering is resolved
   * - Sorting is required because zIndex is independent of array position
   * - Rendering is performed exactly once per frame
   *
   * ============================================================================
   * ERROR BEHAVIOR
   * ============================================================================
   * Throws InvalidInternalStateError if:
   * - A shape in the collection is not an instance of GraphicsModel
   *
   * This indicates a violation of engine-level invariants.
   *
   * ============================================================================
   * PERFORMANCE CHARACTERISTICS
   * ============================================================================
   * - Z-order resolution: O(n)
   * - Animation update: O(n)
   * - Sorting: O(n log n)
   * - Rendering: backend-dependent
   *
   * ============================================================================
   * PARAMETERS
   * ============================================================================
   * @param time - High-resolution timestamp used for animation updates
   */
  #frame(time: number) {
    // -----------------------------------------------------------
    // STEP 0: Resolve z-order (ONCE per frame)
    // -----------------------------------------------------------
    this.#resolveZOrder();

    // -----------------------------------------------------------
    // STEP 1: Update animations for all shapes
    // -----------------------------------------------------------
    const len = this.#shapes.length;

    for (let i = 0; i < len; i++) {
      const shape = this.#shapes[i];

      if (!(shape instanceof GraphicsModel)) {
        throw new InvalidInternalStateError(
          shape,
          'valid shape',
          'Encountered non-renderable shape in engine frame execution.',
          'engine.#frame()'
        );
      }

      shape.updateAnimation(DEV_INTERNAL_ACCESS, time);
    }

    // -----------------------------------------------------------
    // STEP 2: Sort shapes by zIndex (ascending order)
    // -----------------------------------------------------------
    //

    this.#shapes.sort((a, b) => {
      b?.geometry?.zIndex ?? 0;
      return (a?.geometry?.zIndex ?? 0) - (b?.geometry?.zIndex ?? 0);
    });

    // -----------------------------------------------------------
    // STEP 3: Delegate rendering to backend
    // -----------------------------------------------------------
    this.#renderer.render(this.#shapes);
  }

  /**
   * Main engine loop callback invoked by requestAnimationFrame.
   *
   * -------------------------------------------------------------------------
   * CORE RESPONSIBILITY
   * -------------------------------------------------------------------------
   * Acts as the self-scheduling driver of the engine lifecycle.
   *
   * On each invocation, this method:
   * - verifies the engine is still running
   * - executes a single frame
   * - schedules the next animation frame
   *
   * -------------------------------------------------------------------------
   * DESIGN INVARIANTS
   * -------------------------------------------------------------------------
   * - The loop terminates immediately if the engine is stopped
   * - Only one loop chain may be active at any time
   *
   * -------------------------------------------------------------------------
   * PARAMETERS
   * -------------------------------------------------------------------------
   * @param time - High-resolution timestamp provided by requestAnimationFrame.
   */
  #loop(time: number) {
    // -----------------------------------------------------------
    // STEP 1: Guard against stopped engine
    // -----------------------------------------------------------

    if (!this.#running) return;

    // -----------------------------------------------------------
    // STEP 2: Execute frame
    // -----------------------------------------------------------

    this.#frame(time);

    // -----------------------------------------------------------
    // STEP 3: Schedule next frame
    // -----------------------------------------------------------

    this.#rafId = requestAnimationFrame(this.#loop.bind(this));
  }
}
