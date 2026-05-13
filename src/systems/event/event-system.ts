import { SyntheticEvent, EventPhase } from './syntheticEvent.js';

import type { IGraphicalElementProperties } from '../../properties/specific/specificProperties';
import type { GraphicsEntity } from '../../shapes/graphicsEntity/graphicsEntity';
import type { GraphicsModel } from '../provider/graphics';
import type { SupportedEvents } from './eventTarget';
import { Log, Warn } from '../../utils/helpers/helpers.js';
import { hitTestShape } from './hitTestShape.js';

type SupportedShapes = GraphicsModel<keyof IGraphicalElementProperties>;
type Shape = GraphicsEntity<keyof IGraphicalElementProperties>;

/**
 * ============================================================================
 * EVENT SYSTEM (LINEAR SCAN - CURRENT PHASE)
 * ============================================================================
 *
 * PURPOSE
 * ----------------------------------------------------------------------------
 * Centralized event dispatcher responsible for:
 *
 * ✔ Hit testing (bounding-box based)
 * ✔ Target resolution (z-index aware)
 * ✔ ECS-based propagation path (via `inside`)
 * ✔ Phase execution (capture → target → bubble)
 *
 * ----------------------------------------------------------------------------
 * CURRENT STRATEGY
 * ----------------------------------------------------------------------------
 *
 * - Uses linear scan for hit testing (O(n))
 * - Optimized for correctness and simplicity
 * - No spatial index (intentionally removed)
 *
 * This will eliminate false positives caused by AABB.
 *
 * ============================================================================
 */
export class EventSystem {
  #shapes!: SupportedShapes[];
  #elementsIdMap!: Map<string, SupportedShapes>;

  constructor(
    shapes: SupportedShapes[],
    elementsIdMap: Map<string, SupportedShapes>
  ) {
    this.#shapes = shapes;
    this.#elementsIdMap = elementsIdMap;
  }

  // ========================================================================
  // PUBLIC ENTRY
  // ========================================================================

  /**
   * Dispatches a pointer event into the synthetic event system with
   * CANVAS-LOCAL coordinate normalization.
   *
   * ============================================================================
   * PURPOSE
   * ============================================================================
   *
   * Converts browser (viewport) coordinates → canvas-local coordinates,
   * ensuring hit testing operates in the same coordinate space as rendering.
   *
   * ============================================================================
   * COORDINATE TRANSFORMATION
   * ============================================================================
   *
   * Native Event:
   *   clientX / clientY → relative to viewport (screen space)
   *
   * Required:
   *   localX / localY → relative to canvas content box
   *
   * Transformation:
   *
   *   localX = clientX - (canvasRect.left + borderLeft + paddingLeft)
   *   localY = clientY - (canvasRect.top  + borderTop  + paddingTop)
   *
   * This ensures:
   * ✔ Correct hit testing regardless of canvas position in DOM
   * ✔ Proper alignment with rendering coordinate system
   *
   * ============================================================================
   * FLOW
   * ============================================================================
   *
   * 1. Normalize pointer → canvas-local space
   * 2. Perform hit test (AABB - current phase)
   * 3. Resolve topmost target (z-index)
   * 4. Build ECS propagation path
   * 5. Execute phases (capture → target → bubble)
   *
   * ============================================================================
   * IMPORTANT
   * ============================================================================
   *
   * - All hit testing MUST use normalized coordinates
   * - Raw clientX/clientY must NEVER be used directly
   *
   *
   * ============================================================================
   *
   * @param el          Canvas DOM element
   * @param nativeEvent PointerEvent from browser
   */
  dispatch(el: HTMLElement, nativeEvent: PointerEvent): void {
    const elements = this.#shapes;

    // ----------------------------------------------------------------------
    // STEP 1: Normalize pointer coordinates (viewport → canvas space)
    // ----------------------------------------------------------------------

    const clientX = nativeEvent.clientX;
    const clientY = nativeEvent.clientY;

    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);

    const borderLeft = parseFloat(styles.borderLeftWidth || '0');
    const borderTop = parseFloat(styles.borderTopWidth || '0');

    const paddingLeft = parseFloat(styles.paddingLeft || '0');
    const paddingTop = parseFloat(styles.paddingTop || '0');

    const offsetX = rect.left + borderLeft + paddingLeft;
    const offsetY = rect.top + borderTop + paddingTop;

    const x = clientX - offsetX;
    const y = clientY - offsetY;

    // ----------------------------------------------------------------------
    // STEP 2: Hit testing (linear + AABB)
    // ----------------------------------------------------------------------

    const target = this.#hitTest(elements, x, y);

    if (!target) return;

    // ----------------------------------------------------------------------
    // STEP 3: Create synthetic event
    // ----------------------------------------------------------------------

    const eventType = nativeEvent.type as SyntheticEvent['type'];
    const event = new SyntheticEvent(eventType, target, nativeEvent);

    // ----------------------------------------------------------------------
    // STEP 4: Build propagation path
    // ----------------------------------------------------------------------

    const path = this.#buildPath(target);

    // ----------------------------------------------------------------------
    // STEP 5: CAPTURE phase (root → target)
    // ----------------------------------------------------------------------

    event.eventPhase = EventPhase.CAPTURE;

    for (let i = path.length - 1; i > 0; i--) {
      event.currentTarget = path[i];
      if (this.#invoke(path[i], event)) return;
    }

    // ----------------------------------------------------------------------
    // STEP 6: TARGET phase
    // ----------------------------------------------------------------------

    event.eventPhase = EventPhase.TARGET;

    event.currentTarget = target;
    if (this.#invoke(target, event)) return;

    // ----------------------------------------------------------------------
    // STEP 7: BUBBLE phase (target → root)
    // ----------------------------------------------------------------------

    event.eventPhase = EventPhase.BUBBLE;

    for (let i = 1; i < path.length; i++) {
      event.currentTarget = path[i];
      if (this.#invoke(path[i], event)) return;
    }
  }

  /**
   * ============================================================================
   * HIT TEST (LINEAR + BROAD + NARROW PHASE)
   * ============================================================================
   *
   * PURPOSE:
   * --------
   * Resolves the topmost element under given pointer coordinates.
   *
   * STRATEGY:
   * ---------
   * 1. Broad-phase → AABB rejection (fast, O(1))
   * 2. Narrow-phase → precise shape hit test (geometry-based)
   * 3. Depth resolution → highest zIndex wins
   *
   * PERFORMANCE:
   * ------------
   * - Single linear scan (O(n))
   * - Zero extra allocations inside loop
   * - Early rejection to minimize expensive geometry checks
   *
   * NOTE:
   * -----
   * - AABB is only a coarse filter
   * - Precise hit testing guarantees correctness
   */
  #hitTest(
    elements: SupportedShapes[],
    x: number,
    y: number
  ): SupportedShapes | null {
    let best: SupportedShapes | null = null;
    let bestZ = -Infinity;

    for (let i = 0, len = elements.length; i < len; i++) {
      const el = elements[i] as Shape;

      // ------------------------------------------------------------
      // STEP 1: Broad-phase → AABB rejection
      // ------------------------------------------------------------
      const box = el.getBBox(true);
      if (!box) continue;

      if (!this.#aabbContains(x, y, box)) continue;

      // ------------------------------------------------------------
      // STEP 2: Narrow-phase → precise geometry hit test
      // ------------------------------------------------------------
      if (!hitTestShape(el, x, y)) continue;

      // ------------------------------------------------------------
      // STEP 3: Depth resolution → z-index
      // ------------------------------------------------------------
      const z = el?.geometry?.zIndex ?? 0;

      if (z >= bestZ) {
        best = el;
        bestZ = z;
      }
    }

    return best;
  }

  /**
   * Fast AABB containment test.
   *
   * - Performs constant-time bounding check
   * - Used as broad-phase filter before expensive geometry testing
   * - Avoids unnecessary hitTestShape calls
   *
   * @param x Pointer X (canvas-local)
   * @param y Pointer Y (canvas-local)
   * @param box Axis-aligned bounding box
   */
  #aabbContains(
    x: number,
    y: number,
    box: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    );
  }

  // ========================================================================
  // PATH BUILDING (ECS RELATIONAL)
  // ========================================================================

  /**
   * Builds propagation path using ECS `inside` relationship.
   *
   * FORMAT:
   * inside = "group-123", "canvas-1"
   *
   * RESULT:
   * [target → parent → ... → root]
   *
   * OPTIMIZATION:
   * - Uses single map for O(1) lookup
   * - Avoids repeated scans
   */
  #buildPath(target: SupportedShapes): SupportedShapes[] {
    const map = this.#elementsIdMap;

    const path: SupportedShapes[] = [];

    let current: SupportedShapes | null = target;

    while (current) {
      path.push(current);

      const inside = current.style.inside as string | undefined;
      if (!inside) break;

      // Extract parent ID (after '-')
      const idx = inside.indexOf('-');
      if (idx === -1) break;

      const parentId = inside.slice(idx + 1);

      current = map.get(parentId) ?? null;
    }

    return path;
  }

  // ========================================================================
  // INVOCATION
  // ========================================================================

  /**
   * Executes handler for given node if present.
   *
   * RETURNS:
   * true  → stop propagation
   * false → continue
   */
  #invoke(node: SupportedShapes, event: SyntheticEvent): boolean {
    const handler = (node as Shape).getHandler(event.type as SupportedEvents);
    if (!handler) return false;

    handler(event);

    return event.isPropagationStopped();
  }
}
