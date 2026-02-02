import { DEV_INTERNAL_ACCESS } from '../../utils/provider/accesskeys.js';
import type { Renderer } from '../graphics/backends/renderers';
import { GraphicsModel } from '../graphics/graphicsModel/graphicsModel.js';

import type { iShape } from '../../shapes/provider/shapesTypes';
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

//type iShape = Array<GraphicalElement<GShpesTages>>;
export class Engine {
  /** @type {Array} */
  #shapes: iShape[] = [];

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
  constructor(shapes: iShape[], renderer: Renderer) {
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
    time;
    for (let i = 0; i < len; i++) {
      const shape = this.#shapes[i];

      if (!(shape instanceof GraphicsModel))
        throw new Error(
          'Given Shape is not Renderable: necessary parameters are not provided'
        );
      i;
      shape.updateAnimation(DEV_INTERNAL_ACCESS, time);
      // get geometry/style/DOM handle
      const geoRef = shape.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
        dirty: boolean;

        shape: string;
      }>;

      if (!geoRef)
        throw new Error('Shape geometry or canonicalMatrix is missing');

      // Render Only that shapes which actually needs to be rendered avoid unchanged shapes
      if (!geoRef.dirty) continue;
    }

    // 2. Render entire scene once
    this.#renderer.render(this.#shapes);

    // Continue loop
    this.#rafId = requestAnimationFrame(this.loop.bind(this));
  }
}
