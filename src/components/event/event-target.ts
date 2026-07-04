import type {
  Handler,
  IEvent,
  SupportedEvents
} from '../../models/interfaces/event';

/**
 * ============================================================================
 * EVENT TARGET (FINAL — PASSIVE EVENT CAPABILITY)
 * ============================================================================
 *
 * PURPOSE
 * ----------------------------------------------------------------------------
 * Provides event subscription capability to graphical entities in a fully
 * deterministic and minimal form.
 *
 * This class does NOT participate in:
 * - event dispatch
 * - hit testing
 * - propagation logic
 *
 * It ONLY:
 * - stores handlers
 * - exposes controlled APIs
 *
 * ============================================================================
 * DESIGN DECISIONS
 * ----------------------------------------------------------------------------
 *
 * 1. ONE HANDLER PER EVENT TYPE
 *    - No arrays, no stacking
 *    - Deterministic overwrite behavior
 *
 * 2. NO EVENT IDS
 *    - Redundant in single-handler model
 *    - Eliminates unnecessary state
 *
 * 3. CONSTANT TIME OPERATIONS
 *    - Map lookup: O(1)
 *
 * 4. INTERNAL ACCESS CONTROL
 *    - EventSystem accesses handlers via controlled method
 *
 * ============================================================================
 *
 * STORAGE MODEL
 * ----------------------------------------------------------------------------
 *
 * Map<eventType, handler>
 *
 * Example:
 * {
 *   click → handlerFn,
 *   pointerdown → handlerFn
 * }
 *
 * ============================================================================
 */
export class EventTargets implements IEvent {
  /**
   * Internal handler storage.
   *
   * Key   → event type
   * Value → handler function
   */
  #handlers: Map<SupportedEvents, Handler> = new Map();

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Registers an event handler on the canvas.
   *
   * Behavior:
   * - Associates a handler with a specific event type
   * - If a handler already exists for the same type, it is replaced
   *
   * Scope:
   * - Applies to the canvas itself (root-level events)
   * - Will be triggered if propagation reaches canvas level
   *
   * Usage:
   * canvas.on('click', handler)
   *
   * @param type Event type (click, pointerdown, etc.)
   * @param handler Function to execute when event occurs
   */
  public on(type: SupportedEvents, handler: Handler): void {
    this.#handlers.set(type, handler);
  }

  /**
   * Removes the event handler associated with the given event type.
   *
   * Behavior:
   * - Deletes handler if present
   * - No effect if handler does not exist
   *
   * Usage:
   * canvas.off('click')
   *
   * @param type Event type
   */
  public off(type: SupportedEvents): void {
    this.#handlers.delete(type);
  }

  /**
   * Registers a one-time event handler on the canvas.
   *
   * Behavior:
   * - Handler executes exactly once
   * - Automatically removed after execution
   * - Replaces any existing handler for the same event type
   *
   * Usage:
   * canvas.once('click', handler)
   *
   * Use Cases:
   * - Initialization interactions
   * - One-shot triggers
   *
   * @param type Event type
   * @param handler Function to execute once
   */
  public once(type: SupportedEvents, handler: Handler): void {
    const wrapper: Handler = (e) => {
      handler(e);
      this.#handlers.delete(type);
    };

    this.#handlers.set(type, wrapper);
  }

  // ==========================================================================
  // INTERNAL ACCESS (EVENT SYSTEM ONLY)
  // ==========================================================================

  /**
   * Returns handler for given event type.
   *
   * IMPORTANT:
   * - Intended ONLY for EventSystem usage
   * - Not part of public contract
   *
   * @param type Event type
   * @returns Handler or undefined
   */
  public getEventHandler(type: SupportedEvents): Handler | undefined {
    return this.#handlers.get(type);
  }

  /**
   * Checks whether a handler exists for given event type.
   *
   * Useful for fast path skipping in dispatcher.
   */
  public hasEventHandler(type: SupportedEvents): boolean {
    return this.#handlers.has(type);
  }
}
