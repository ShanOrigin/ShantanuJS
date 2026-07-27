/**
 * Events supported by the graphics event system.
 */
export type SupportedEvents =
  | "click"
  | "dblclick"
  | "pointerdown"
  | "pointermove"
  | "pointerup"
  | "pointerenter"
  | "pointerleave";

/**
 * Callback invoked when an event is dispatched to a graphics object.
 *
 * @param e The synthetic event describing the interaction.
 */
export type Handler = (e: SyntheticEvent) => void;

/**
 * Defines the public event API implemented by interactive graphics
 * objects.
 *
 * The event system provides registration, removal and one-time
 * subscription of event handlers for supported interaction events.
 */
export interface IEvent {
  /**
   * Registers an event handler.
   *
   * Multiple handlers may be registered for the same event.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke when the event is dispatched.
   */
  on(event: SupportedEvents, callback: Handler): void;

  /**
   * Removes event handlers associated with an event.
   *
   * If `callback` is provided, only that handler is removed.
   * Otherwise, all handlers registered for the event are removed.
   *
   * @param event The event to unsubscribe from.
   * @param callback Optional handler to remove.
   */
  off(event: SupportedEvents): void;

  /**
   * Registers an event handler that is invoked at most once.
   *
   * After the first invocation, the handler is automatically removed.
   *
   * @param event The event to subscribe to.
   * @param callback The handler to invoke once.
   */
  once(event: SupportedEvents, callback: Handler): void;

  /**
   * Returns handler for given event type.
   *
   * IMPORTANT:
   * - Intended ONLY for EventSystem usage
   * - Not part of public contract
   *
   * @param type Event type
   * @returns Handler or undefined
   *
   */

  getEventHandler(type: SupportedEvents): Handler | void;

  /**
   * Checks whether a handler exists for given event type.
   *
   * Useful for fast path skipping in dispatcher.
   */
  hasEventHandler(type?: SupportedEvents): boolean;
}
