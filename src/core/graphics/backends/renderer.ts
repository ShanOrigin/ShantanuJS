import { SVGRenderer } from './svg/svgRenderer/svgRenderer.js';

import type { CONTEXT } from '../../../types/graphicsElements';
import type { Renderer } from './renderers';
import { UnsupportedRenderingBackendError } from '../../../utils/errors/provider/shantanuJSErrors.js';

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
 * SUPPORTED CONTEXTS
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
export function initRenderer(context: CONTEXT): Renderer {
  // --------------------------------------------------------------------------
  // Select renderer implementation based on context
  // --------------------------------------------------------------------------
  switch (context) {
    case 'svg':
      // Instantiate SVG rendering backend
      return new SVGRenderer();

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
