import type { GraphicsNode } from '../../models/interfaces/graphics-container';
import {
  ISyntheticEvent,
  NormalizedPointer
} from '../../models/interfaces/synthetic-event';

/**
 * ============================================================================
 * EVENT PHASE ENUM
 * ============================================================================
 *
 * Defines the current stage of propagation within the synthetic event system.
 *
 * CAPTURE → traversal from root → target (optional phase)
 * TARGET  → event is at the originating element
 * BUBBLE  → traversal from target → root
 */
export const enum EventPhase {
  CAPTURE = 1,
  TARGET = 2,
  BUBBLE = 3
}

/**
 * ============================================================================
 * SYNTHETIC EVENT (FINAL FORM)
 * ============================================================================
 *
 * A fully immutable, engine-controlled event abstraction that replaces
 * reliance on DOM event propagation and enables deterministic interaction
 * across ECS-based rendering systems.
 *
 * ============================================================================
 * DESIGN GOALS
 * ============================================================================
 *
 * - Immutable event data (no accidental mutation)
 * - Explicit propagation phases
 * - Backend-independent pointer normalization
 * - Deterministic propagation control
 * - Zero dependency on DOM tree semantics
 *
 * ============================================================================
 * MUTABILITY MODEL
 * ============================================================================
 *
 * Immutable:
 * - type
 * - target
 * - nativeEvent
 * - pointer data
 * - timestamp
 *
 * Controlled Mutable (dispatcher-only):
 * - currentTarget
 * - eventPhase
 *
 * Internal Mutable:
 * - propagationStopped
 * - immediatePropagationStopped
 *
 * ============================================================================
 */
export class SyntheticEvent implements ISyntheticEvent {
  // ========================================================================
  // INTERNAL STATE (STRICTLY CONTROLLED)
  // ========================================================================

  #propagationStopped: boolean = false;
  #immediatePropagationStopped: boolean = false;

  // ========================================================================
  // IMMUTABLE CORE PROPERTIES
  // ========================================================================

  /**
   * Logical event type (strictly controlled by engine)
   */
  readonly type: string;

  /**
   * Original native browser event (read-only reference)
   */
  readonly nativeEvent: PointerEvent;

  /**
   * Engine-resolved target (via hit testing)
   */
  readonly target: GraphicsNode;

  /**
   * Timestamp at event creation (high-resolution)
   */
  readonly timestamp: number;

  /**
   * Normalized pointer data (backend-independent)
   */
  readonly pointer: NormalizedPointer;

  // ========================================================================
  // DISPATCHER-CONTROLLED STATE
  // ========================================================================

  /**
   * Current node being processed during propagation.
   * Set ONLY by dispatcher.
   */
  currentTarget: GraphicsNode | null = null;

  /**
   * Current propagation phase.
   * Set ONLY by dispatcher.
   */
  eventPhase: EventPhase = EventPhase.TARGET;

  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================

  /**
   * Creates a fully normalized synthetic event.
   *
   * @param type         Logical event type
   * @param target       Target resolved via hit testing
   * @param nativeEvent  Native pointer event
   */
  constructor(type: string, target: GraphicsNode, nativeEvent: PointerEvent) {
    this.type = type;
    this.target = target;
    this.nativeEvent = nativeEvent;

    this.timestamp = performance.now();

    this.pointer = Object.freeze({
      x: nativeEvent.clientX,
      y: nativeEvent.clientY,
      pointerId: nativeEvent.pointerId,
      pointerType: nativeEvent.pointerType,
      pressure: nativeEvent.pressure,
      tiltX: nativeEvent.tiltX,
      tiltY: nativeEvent.tiltY,
      button: nativeEvent.button,
      buttons: nativeEvent.buttons
    });
  }

  // ========================================================================
  // PROPAGATION CONTROL
  // ========================================================================

  /**
   * Stops further propagation in the current event path.
   *
   * Effect:
   * - Prevents event from reaching further ancestors
   */
  stopPropagation(): void {
    this.#propagationStopped = true;
  }

  /**
   * Stops propagation AND prevents remaining handlers on current node.
   *
   * Effect:
   * - Stops all further handlers immediately
   * - Prevents bubbling to ancestors
   */
  stopImmediatePropagation(): void {
    this.#immediatePropagationStopped = true;
    this.#propagationStopped = true;
  }

  /**
   * Returns whether propagation has been stopped.
   */
  isPropagationStopped(): boolean {
    return this.#propagationStopped;
  }

  /**
   * Returns whether immediate propagation has been stopped.
   */
  isImmediatePropagationStopped(): boolean {
    return this.#immediatePropagationStopped;
  }

  // ========================================================================
  // DEFAULT PREVENTION
  // ========================================================================

  /**
   * Prevents browser default behavior.
   *
   * Note:
   * - Does NOT affect synthetic propagation
   */
  preventDefault(): void {
    this.nativeEvent.preventDefault();
  }
}
