import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  validProps,
  parameterTypeValidator,
  autoFixGeometry
} from '../../utils/provider/utils.js';

import { pointPropsType } from '../../types/shapes';

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

export class Point extends GraphicsEntity<'dot'> {
  /**
   * Internal reference to the base class geometry object.
   *
   * This is not a copy.
   * Mutations on this reference directly affect the original geometry
   * maintained by the parent/base class.
   *
   * Access is restricted via DEV_INTERNAL_ACCESS to prevent public misuse.
   */
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

  /**
   * Internal reference to the base class style object.
   *
   * This provides direct access to the parent style state.
   * Any mutation here is reflected immediately in the base class styling.
   *
   * Intended strictly for internal engine-level operations.
   */
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);
  /**
   * Internal reference to parent class properties/state container.
   *
   * Acts as a shared internal state bridge between parent and child.
   * This allows coordinated updates without duplicating or syncing state.
   *
   * Must never be exposed outside trusted/internal code paths.
   */
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

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
  constructor(cx: number, cy: number, r: number, props: pointPropsType = {}) {
    super('dot', props.id ?? '');
    try {
      // Extract delta overrides while preserving remaining properties
      const { cx: dcx = 0, cy: dcy = 0, r: dr = 0, ...rest } = props;

      // Prevent id leakage into attribute validation
      'id' in props && delete props.id;
      parameterTypeValidator(props, GraphicalElementProperties, {}, {}, 'dot');

      // Remove geometry attributes not applicable to a point
      autoFixGeometry(props, ['cx', 'cy', 'r', 'stroke-width']);

      // Final resolved geometry after applying deltas
      const safeProps = {
        initial: true,
        cx: cx + +dcx,
        cy: cy + +dcy,
        r: r + +dr,
        ...rest
      };

      // Full validation against geometry, style, and inherited class state
      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'dot'
      );

      // Final cleanup of conflicting or invalid geometry-related properties
      autoFixGeometry(props, ['cx', 'cy', 'r', 'stroke-width']);

      // Apply attributes to internal state
      this.attrs(safeProps);
    } catch (e) {
      throw e;
    }
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
      'dot'
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
    visibleRadius?: number
  ): Point {
    if (this.#geometry && this.#style) {
      // Extract current geometry state with safe fallbacks
      const { copies = 0, cx = 0, cy = 0, r = 0 } = this.#geometry;

      const nextCopies = copies + 1;

      // Shallow-copy style to prevent mutation of the original instance
      const style = { ...this.#style } as StyleForGShapeTag<'dot'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      // Track number of clones created from this geometry
      this.#geometry['copies'] = nextCopies;
      return new Point(
        offsetX + cx,
        offsetY + cy,
        (visibleRadius ?? 0) + r,
        style as pointPropsType
      );
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
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
        canonicalMatrix: Float32Array[];
        sharedBuffer: Float32Array;
      };
      if (!geo) return;

      const { cx = 0, cy = 0 } = geo;

      const [m, n] = dimensions['dot']!;
      const totalLength = m * n;

      // Allocate once and reuse to minimize GC pressure
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      // Homogeneous coordinate for a point: [x, y, 1]
      sb.set([cx, cy, 1], 0);

      // Only recreate typed-array views when the buffer changes
      if (!geo.canonicalMatrix) {
        geo.canonicalMatrix = [new Float32Array(sb.buffer, 0 * 4, 3)];
      }

      // Restore expected dimensional state using the updated buffer
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
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
    temporaryState: Float32Array
  ) {
    try {
      assertAccess(accessKey);
      if (!this.#geometry) return;

      [this.#geometry.cx, this.#geometry.cy] = [
        temporaryState[0] as number,
        temporaryState[1] as number
      ]; // center if circle
    } catch (e) {
      throw e;
    }
  }

  /**
   * Validates the structural correctness of a transformation matrix
   * for the Point (dot) shape.
   *
   * This method ensures the matrix conforms to the expected
   * homogeneous point representation and contains valid numeric values.
   *
   * @param accessKey - Internal access token required to perform validation.
   * @param matrix - Canonical matrix representation to validate.
   *
   * @returns `true` if the matrix is structurally valid, otherwise `false`.
   */
  protected override validateShapeMatrix(
    accessKey: symbol,
    matrix: Float32Array[]
  ): boolean {
    assertAccess(accessKey);
    // Expect fixed-length canonical homogeneous matrix and valid x/y coordinates
    if (matrix.length != 3 || isNaN(matrix[0]![0]!) || isNaN(matrix[0]![1]!))
      return false;

    return true;
  }
}
