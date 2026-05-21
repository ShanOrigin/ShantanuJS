/**
 * ============================================================================
 * RENDER INFRASTRUCTURE
 * ============================================================================
 *
 * Backend-specific projection infrastructure associated with a scene.
 *
 * This structure contains renderer-owned runtime resources required for
 * projecting and managing a scene inside a rendering backend.
 *
 * IMPORTANT:
 * - This is NOT authoritative scene state.
 * - This is NOT owned by the scene model.
 * - This is renderer-local projection infrastructure.
 *
 * Examples:
 *
 * SVG Backend:
 * - viewportHost   -> <svg>
 * - resourceHost   -> <defs>
 * - surfaceHost    -> <rect>
 * - contentHost    -> <g>
 *
 * Canvas2D Backend:
 * - viewportHost   -> <canvas>
 * - resourceHost   -> gradient/pattern cache
 * - surfaceHost    -> background render phase
 * - contentHost    -> render traversal root
 *
 * WebGL Backend:
 * - viewportHost   -> <canvas>
 * - resourceHost   -> GPU resource registry
 * - surfaceHost    -> framebuffer clear target
 * - contentHost    -> render batch root
 *
 * ============================================================================
 */

export type RenderInfrastructure<
  TViewportHost = unknown,
  TResourceHost = unknown,
  TSurfaceHost = unknown,
  TContentHost = unknown
> = {
  /**
   * Primary backend viewport or render host.
   *
   * Examples:
   * - SVG root
   * - HTMLCanvasElement
   * - WebGPU canvas surface
   */
  viewportHost: TViewportHost;

  /**
   * Backend resource container or registry.
   *
   * Examples:
   * - SVG <defs>
   * - gradient cache
   * - GPU resource manager
   */
  resourceHost: TResourceHost;

  /**
   * Backend surface representation.
   *
   * Examples:
   * - SVG background rect
   * - framebuffer clear target
   * - canvas background pass
   */
  surfaceHost: TSurfaceHost;

  /**
   * Root projection container for renderable scene content.
   *
   * Examples:
   * - SVG scene group
   * - render traversal root
   * - render batch root
   */
  contentHost: TContentHost;
};
