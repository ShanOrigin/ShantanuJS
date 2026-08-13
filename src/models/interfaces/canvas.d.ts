import { IEngine } from "./engine";

/**
 * Core canvas container contract.
 *
 * ============================================================================
 * RESPONSIBILITY
 * ============================================================================
 *
 * Defines the structural and lifecycle operations supported
 * by the rendering canvas system.
 *
 * The canvas acts as:
 * - Root scene graph container
 * - Rendering orchestration entry point
 * - Element management controller
 *
 *
 * ============================================================================
 * STRUCTURAL ROLE
 * ============================================================================
 *
 * Responsible for:
 * - Managing graphical entity membership
 * - Maintaining renderable element collection
 * - Controlling rendering engine lifecycle
 * - Providing scene graph manipulation operations
 *
 *
 * ============================================================================
 * ENGINE ROLE
 * ============================================================================
 *
 * The canvas controls:
 * - Engine startup/shutdown
 * - Render flushing
 * - Structural scene updates
 * - Element ordering and management
 */
export interface ICanvas {
  /**
   * Rendering engine instance associated with the canvas.
   *
   * Responsible for:
   * - Render execution lifecycle
   * - Frame scheduling
   * - Rendering synchronization
   * - Pipeline orchestration
   */
  engine: IEngine;
}
