import { RenderNode } from "../../render-node/render-node.js";
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  assertAccess,
} from "../../../internal/keys/dev-keys.js";
import {
  CommonGeometricProperties,
  AllGShapeStyleProperties,
} from "../../../property-definitions/common/common-properties.js";

import {
  GraphicalElementProperties,
  dimensions,
} from "../../../property-definitions/specific/specific-properties.js";
import type {
  InitialProps,
  ConstructorPropsTypes,
} from "../../../models/types/common";

import {
  Log,
  parameterTypeValidator,
  validProps,
} from "../../../utils/helpers/helpers.js";

/**
 * Represents a zero-dimensional graphical Point (dot) shape.
 *
 * The Point is defined by a center coordinate and radius and participates
 * in the same transformation, styling, and validation pipeline as other shapes.
 *
 * Design notes:
 * - Uses minimal homogeneous matrix representation for performance.
 * - Geometry and style are internally shared with the base Shape class.
 * - Intended for internal engine use with strict access control.
 */

export class Point extends RenderNode<"dot"> {
  #copies: number = 0;
  /**
   * Internal reference to the base class geometry object.
   *
   * This is not a copy.
   * Mutations on this reference directly affect the original geometry
   * maintained by the parent/base class.
   *
   * Access is restricted via DEV_INTERNAL_ACCESS to prevent public misuse.
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Internal reference to the base class style object.
   *
   * This provides direct access to the parent style state.
   * Any mutation here is reflected immediately in the base class styling.
   *
   * Intended strictly for internal engine-level operations.
   */
  #style = this[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);
  /**
   * Internal reference to parent class properties/state container.
   *
   * Acts as a shared internal state bridge between parent and child.
   * This allows coordinated updates without duplicating or syncing state.
   *
   * Must never be exposed outside trusted/internal code paths.
   */
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS_KEY);

  /**
   * Creates a Point (dot) shape instance with validated and normalized geometry.
   *
   * @param cx - Base x-coordinate of the point center.
   * @param cy - Base y-coordinate of the point center.
   * @param r  - Base radius of the point.
   * @param props - Optional property bag supporting offsets, styling, and id.
   *
   * Behavior notes:
   * - `props` may include delta overrides (cx, cy, r) which are additive.
   * - Geometry and style are validated twice: raw input and finalized state.
   * - Geometry auto-fix is applied to remove incompatible or invalid attributes.
   * - This constructor mutates `props` (id removal, geometry normalization).
   *
   * Throws:
   * - Propagates any validation or normalization errors without interception.
   */
  constructor(props: ConstructorPropsTypes<"dot">) {
    super("dot", props.id ?? "");

    // Prevent id leakage into attribute validation
    "id" in props && delete props.id;
    // Full validation against geometry, style, and inherited class state
    parameterTypeValidator(
      props,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      "dot",
    );

    // for initial setup through RenderNode
    (props as ConstructorPropsTypes<"dot"> & InitialProps)["initial"] = true;
    this.attrs(props);
  }

  /**
   * Returns the complete set of valid properties for the Point (dot) shape.
   *
   * This includes:
   * - Common graphical element properties (id, visibility, etc.)
   * - Geometry-related properties applicable to a point
   * - Style properties supported by all graphical shapes
   *
   * The returned structure is used by validators and tooling
   * to determine which properties are allowed for this shape.
   */
  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      "dot",
    );
  }

  /**
   * Creates a cloned Point instance with positional offset and optional radius override.
   *
   * @param offsetX - Horizontal offset applied to the cloned point.
   * @param offsetY - Vertical offset applied to the cloned point.
   * @param visibleRadius - Optional radius added on top of the original radius.
   *
   * Behavior notes:
   * - Clone count is tracked via `geometry.copies` and incremented per clone.
   * - The cloned style is shallow-copied to avoid shared mutation.
   * - If an id exists, it is suffixed with a clone index for uniqueness.
   * - Geometry state of the original instance is mutated (`copies` increment).
   *
   * @returns A new Point instance derived from the current one.
   *
   * Throws:
   * - Error if geometry or style is unavailable or invalid.
   */
  public clone(
    offsetX: number = 10,
    offsetY: number = 10,
    visibleRadius?: number,
  ): Point {
    if (this.#geometry && this.#style) {
      // Extract current geometry state with safe fallbacks
      const { cx = 0, cy = 0, r = 1 } = this.#geometry;

      // Shallow-copy style to prevent mutation of the original instance
      const style = { ...this.#style };

      if ("id" in style && style.id !== "") {
        style.id = `${style.id}-c${++this.#copies}`;
      }

      // Track number of clones created from this geometry

      return new Point({
        cx: offsetX + cx,
        cy: offsetY + cy,
        r: visibleRadius ?? r,
        initial: true,
        ...style,
      } as ConstructorPropsTypes<"dot"> & InitialProps);
    }

    throw new Error("Cannot clone: geometry or style is invalid.");
  }

  /**
   * Generates or updates the canonical transformation matrix for the Point (dot).
   *
   * This method is internal and access-restricted.
   * It constructs a minimal homogeneous coordinate representation [cx, cy, 1]
   * backed by a shared Float32Array buffer for performance.
   *
   * Behavior notes:
   * - Uses a reusable shared buffer to avoid repeated allocations.
   * - Recreates matrix views only when the underlying buffer changes.
   * - Mutates internal geometry state (`sharedBuffer`, `canonicalMatrix`).
   *
   * @param accessKey - Internal access token required to invoke this method.
   *
   * Throws:
   * - Propagates access or internal errors without interception.
   */
  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        cx: number;
        cy: number;

        buffer: Float32Array;
      };
      if (!geo) return;

      const { cx = 0, cy = 0 } = geo;

      const [m, n] = dimensions["dot"]!;
      const totalLength = m * n;

      // Allocate once and reuse to minimize GC pressure
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      // Homogeneous coordinate for a point: [x, y, 1]
      sb.set([cx, cy, 1], 0);

      // Restore expected dimensional state using the updated buffer
      this.restoreDimension(DEV_INTERNAL_ACCESS_KEY, sb);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Restores geometric dimensions from a temporary transformation state.
   *
   * This method updates the point's center coordinates based on the
   * computed homogeneous matrix buffer.
   *
   * Intended to be invoked only by internal transformation pipelines.
   * Mutates the internal geometry state directly.
   *
   * @param accessKey - Internal access token required to modify geometry.
   * @param temporaryState - Shared transformation buffer containing [x, y, 1].
   *
   * Throws:
   * - Propagates access or internal errors without interception.
   */
  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array,
  ) {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;

      [this.#geometry.cx, this.#geometry.cy] = [
        temporaryState[0] as number,
        temporaryState[1] as number,
      ]; // center if circle

      this.#computeBounds(temporaryState);
    } catch (e) {
      throw e;
    }
  }

  #computeBounds(buffer: Float32Array) {
    const geo = this.#geometry as {
      bounds: Float32Array;
      r: number;
    };

    const [cx, cy, _] = buffer;
    // Allocate the buffer once or reallocate only if the size has changed
    if (!geo.bounds || geo.bounds.length !== 4) {
      geo.bounds = new Float32Array(4);
    }

    const r = geo.r;
    geo.bounds[0] = cx - r;
    geo.bounds[1] = cy - r;
    geo.bounds[2] = cx + r;
    geo.bounds[3] = cy + r;
  }
}
