import { GraphicsNode } from './graphics-container';

/**
 * ============================================================================
 * NORMALIZED POINTER DATA
 * ============================================================================
 *
 * Backend-agnostic pointer representation extracted from native event.
 * Ensures consistent behavior across Canvas, SVG, etc.
 */
export type NormalizedPointer = Readonly<{
  x: number;
  y: number;
  pointerId: number;
  pointerType: string;
  pressure: number;
  tiltX: number;
  tiltY: number;
  button: number;
  buttons: number;
}>;

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
export type EventPhase = 1 | 2 | 3;

export interface ISyntheticEvent {
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
  currentTarget: GraphicsNode | null;

  /**
   * Current propagation phase.
   * Set ONLY by dispatcher.
   */
  eventPhase: EventPhase;

  // ========================================================================
  // PROPAGATION CONTROL
  // ========================================================================

  /**
   * Stops further propagation in the current event path.
   *
   * Effect:
   * - Prevents event from reaching further ancestors
   */
  stopPropagation(): void;
  /**
   * Stops propagation AND prevents remaining handlers on current node.
   *
   * Effect:
   * - Stops all further handlers immediately
   * - Prevents bubbling to ancestors
   */
  stopImmediatePropagation(): void;

  /**
   * Returns whether propagation has been stopped.
   */
  isPropagationStopped(): boolean;

  /**
   * Returns whether immediate propagation has been stopped.
   */
  isImmediatePropagationStopped(): boolean;

  // ========================================================================
  // DEFAULT PREVENTION
  // ========================================================================

  /**
   * Prevents browser default behavior.
   *
   * Note:
   * - Does NOT affect synthetic propagation
   */
  preventDefault(): void;
}
