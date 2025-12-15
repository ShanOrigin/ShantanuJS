import type { Renderer } from '../renderer/renderer';
import type {
  GraphicalElement,
  GShpesTages
} from '../graphics/graphicalElement';
/**
 * Engine
 * -------
 * The Engine controls the entire rendering lifecycle.
 * It runs a single requestAnimationFrame loop that:
 *   1. Updates all animations attached to Shapes.
 *   2. Delegates rendering to the Renderer.
 *
 * The Engine never performs drawing itself.
 * The Engine never triggers animation logic beyond calling update().
 * The Engine only manages timing, looping, and coordination.
 */

type AllowedShapesTypes = Array<GraphicalElement<GShpesTages>>;
export class Engine {
  /** @type {Array} */
  #shapes: AllowedShapesTypes = [];

  /** @type {Renderer} */
  #renderer: Renderer;

  /** @type {boolean} */
  #running: boolean;

  /** @type {number | null} */
  #rafId: number | null;

  /**
   * Creates a new Engine instance.
   * @param {Array} shapes - Array reference to all Shapes in the Canvas Stack.
   * @param {Renderer} renderer - The active Renderer (SVGRenderer, CanvasRenderer, etc.).
   */
  constructor(shapes: AllowedShapesTypes, renderer: Renderer) {
    this.#shapes = shapes;
    this.#renderer = renderer;
    this.#running = false;
    this.#rafId = null;
  }

  /**
   * Starts the Engine loop if not already running.
   * The loop updates animations and renders the scene every frame.
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    this.#rafId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Stops the Engine loop.
   * This halts animation updates and rendering until start() is called again.
   */
  stop() {
    if (!this.#running) return;
    this.#running = false;

    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  /**
   * Internal loop function called every frame by requestAnimationFrame.
   * @param {DOMHighResTimeStamp} time - The high-resolution timestamp provided by rAF.
   */
  loop(time: number) {
    // If stopped between frames, do not continue.
    if (!this.#running) return;

    // 1. Update animations
    //    Use a traditional for loop for maximum speed and predictability.
    const len = this.#shapes.length;
    for (let i = 0; i < len; i++) {
      const shape = this.#shapes[i];
      /*
      if (shape.animation !== null && shape.animation !== undefined) {
        shape.animation.update(time);
      }
			*/
    }

    // 2. Render entire scene once
    //   this.#renderer.render(this.#shapes);

    // Continue loop
    this.#rafId = requestAnimationFrame(this.loop.bind(this));
  }
}
