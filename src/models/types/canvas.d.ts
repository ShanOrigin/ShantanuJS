import type {
  StyleForGShapeTag,
} from "../../property-definitions/common/common-properties";
import type { IGraphicalElementProperties } from "../../property-definitions/specific/specific-properties";
import type { GRAPHICS_CONTEXT } from "./graphics-model";

/**
 * Internal geometry attribute contract supported by canvas.
 *
 * Includes:
 * - Positional properties
 * - Dimension properties
 * - Canvas-specific geometric state
 */
type CanvasGeometryTypes = IGraphicalElementProperties["scene"];

/**
 * Internal style attribute contract supported by canvas.
 *
 * Includes:
 * - Stroke properties
 * - Fill properties
 * - Visual styling configuration
 */
type CanvasStyleTypes = StyleForGShapeTag<"scene">;

/**
 * Mutable canvas attribute payload accepted by:
 * - constructor initialization
 * - attrs() mutation system
 *
 * Exposes only controlled public-facing
 * canvas styling properties.
 */
export type CanvasAttrsPropsTypes = Partial<CanvasGeometryTypes> &
  Partial<Pick<CanvasStyleTypes, "stroke" | "stroke-width" | "fill">>;

/**
 * Canvas initialization configuration.
 *
 * Responsibilities:
 * - Defines root canvas dimensions
 * - Defines initial canvas position
 * - Defines rendering backend context
 * - Resolves DOM mounting target
 */
export type CanvasInitProps = {
  /**
   * Target DOM container identifier used
   * for mounting renderer output.
   */
  id: string;

  /**
   * Initial canvas width.
   */
  width: number;

  /**
   * Initial canvas height.
   */
  height: number;

  /**
   * Initial horizontal canvas position.
   *
   * Default:
   * - `0`
   */
  x?: number;

  /**
   * Initial vertical canvas position.
   *
   * Default:
   * - `0`
   */
  y?: number;

  /**
   * Rendering backend context type.
   *
   * Default:
   * - `SVG`
   */
  context?: GRAPHICS_CONTEXT;
};
