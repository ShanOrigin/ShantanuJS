import { SVGRenderer } from './svg/svg-renderer/svg-renderer.js';

import type { GRAPHICS_CONTEXT } from '../../models/types/graphics-model';

import { UnsupportedRenderingBackendError } from '../../errors/index.js';
import type { Renderer } from '../../models/interfaces/renderer';
import { SceneModel } from '../scene/scene-model.js';

/**
 * Initializes and returns the appropriate rendering backend based on the provided context.
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * This factory function acts as the central entry point for selecting and
 * instantiating the correct rendering backend (Renderer implementation)
 * for the system.
 *
 * It abstracts away backend-specific instantiation logic and ensures that
 * the rest of the system interacts only with the generic `Renderer` interface.
 *
 * ============================================================================
 * CORE RESPONSIBILITY
 * ============================================================================
 * - Maps a given rendering context to its corresponding Renderer implementation
 * - Ensures only supported rendering backends are instantiated
 * - Throws explicit errors for unsupported contexts
 *
 * ============================================================================
 * DESIGN PRINCIPLES
 * ============================================================================
 * 1. Backend Abstraction
 *    The caller does not need to know which concrete renderer is used.
 *
 * 2. Strict Validation
 *    Unsupported contexts are rejected immediately with a domain-specific error.
 *
 * 3. Extensibility
 *    New rendering backends (e.g., Canvas2D, WebGL) can be added by extending
 *    this switch without modifying external code.
 *
 * ============================================================================
 * SUPPORTED GRAPHICS_CONTEXTS
 * ============================================================================
 * Currently:
 * - 'svg' → SVGRenderer
 *
 * Future:
 * - 'canvas'
 * - 'webgl'
 *
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 * Throws:
 * - UnsupportedRenderingBackendError
 *
 * When:
 * - The provided context does not match any known rendering backend
 *
 * ============================================================================
 * PARAMETERS
 * ============================================================================
 * @param context - The rendering context identifier.
 *                  Determines which backend renderer will be initialized.
 *
 * ============================================================================
 * RETURNS
 * ============================================================================
 * @returns Renderer
 *          A concrete implementation of the Renderer interface corresponding
 *          to the provided context.
 *
 * ============================================================================
 * USAGE EXAMPLE
 * ============================================================================
 * const renderer = initRenderer('svg');
 *
 * ============================================================================
 * SUMMARY
 * ============================================================================
 * This function is the single point of truth for renderer initialization.
 * It guarantees that only valid and supported rendering backends are used
 * within the system.
 */
export function initRenderer(
  context: GRAPHICS_CONTEXT,
  scene: SceneModel
): Renderer {
  // --------------------------------------------------------------------------
  // Select renderer implementation based on context
  // --------------------------------------------------------------------------
  switch (context) {
    case 'SVG':
      // Instantiate SVG rendering backend
      return new SVGRenderer(scene);

    default:
      // ----------------------------------------------------------------------
      // Throw explicit error for unsupported rendering backends
      // ----------------------------------------------------------------------
      throw new UnsupportedRenderingBackendError(
        context as unknown as string, // received invalid context
        ['svg'], // list of supported contexts
        'core.backend.initRenderer()' // source identifier for debugging
      );
  }
}
