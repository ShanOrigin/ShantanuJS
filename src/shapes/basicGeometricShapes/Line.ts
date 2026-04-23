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
  isValidMatrix,
  validProps,
  parameterTypeValidator
} from '../../utils/provider/utils.js';

import { linePropsType } from '../../types/shapes';

/**
 * Represents a line shape defined by two endpoints in 2D space.
 *
 * The `Line` class encapsulates the geometric representation, styling, and
 * internal matrix handling required to model and render a straight line.
 * It manages endpoint coordinates, supports cloning with positional offsets,
 * validates line-specific matrices, and integrates with the internal shape
 * pipeline through privileged access controls.
 *
 * This class relies on inherited shape infrastructure for property validation,
 * state management, and rendering integration, while providing line-specific
 * geometry logic and constraints.
 */

export class Line extends GraphicsEntity<'line'> {
  /**
   * Reference to the base class’s internal geometry object.
   *
   * This is a direct reference, not a copy. Any mutation performed through this
   * field will affect the original geometry maintained by the parent/base class.
   * Intended strictly for internal use with privileged access.
   *
   * @private
   */
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

  /**
   * Reference to the base class’s internal style object.
   *
   * This field points to the original style state owned by the parent/base class.
   * Mutations propagate immediately to the source style and influence rendering
   * or appearance wherever that style is consumed.
   *
   * @private
   */
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);

  /**
   * Reference to the parent class’s internal private properties container.
   *
   * Provides privileged access to selected private state of the parent class.
   * This is used to coordinate behavior across inheritance boundaries without
   * duplicating or re-owning state.
   *
   * @private
   */
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  /**
   * Creates a line graphical element between two points.
   *
   * This constructor initializes a line using the provided start and end
   * coordinates, then applies optional property-based offsets and style
   * attributes. The input properties are validated in two phases: first in their
   * raw form, and then again after normalization and default injection.
   *
   * Coordinate offsets (`x1`, `y1`, `x2`, `y2`) provided via `props` are treated as
   * relative deltas and are added to the absolute coordinates passed to the
   * constructor. The resulting values are normalized into a safe internal
   * property object before being committed to the element state.
   *
   * @param x1 - Absolute x-coordinate of the line’s starting point.
   * @param y1 - Absolute y-coordinate of the line’s starting point.
   * @param x2 - Absolute x-coordinate of the line’s ending point.
   * @param y2 - Absolute y-coordinate of the line’s ending point.
   * @param props - Optional line-specific properties, including relative
   *                coordinate offsets, styling options, and an optional element
   *                identifier.
   */
  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    props: linePropsType = {}
  ) {
    // Initialize the base graphical element as a line and extract the optional identifier
    super('line', props?.id ?? '');
    'id' in props && delete props.id;
    // Extract relative coordinate offsets from props, defaulting to zero when absent
    const {
      x1: dx1 = 0,
      y1: dy1 = 0,
      x2: dx2 = 0,
      y2: dy2 = 0,
      ...rest
    } = props as linePropsType;

    // Normalize coordinates, inject defaults, and merge remaining properties
    const safeProps = {
      'stroke-linecap': 'square',
      initial: true,
      x1: x1 + +dx1,
      y1: y1 + +dy1,
      x2: x2 + +dx2,
      y2: y2 + +dy2,
      ...rest
    };

    // Perform final validation on the normalized property set before mutating state
    parameterTypeValidator(
      safeProps,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      'line'
    );

    // Commit the validated and normalized attributes to the element
    this.attrs(safeProps);
  }

  /**
   * Returns the complete set of valid properties applicable to a line shape.
   *
   * This method aggregates and exposes all properties that are legally supported
   * by a line element, including:
   * - Common geometric properties shared across graphical shapes
   * - Style-related properties applicable to graphical shapes
   * - Core graphical element properties
   *
   * The returned result is typically used for validation, introspection,
   * tooling, or user-facing APIs to determine which properties are accepted
   * when creating or mutating a line element.
   *
   * @returns An object describing all valid geometric and style properties
   *          supported by the line shape.
   */
  static validProperties() {
    // User-facing aggregation of all supported geometric and style properties for a line
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'line'
    );
  }

  /**
   * Creates a new `Line` instance by cloning the current line with an optional positional offset.
   *
   * This method performs a shallow clone of the line by:
   * - Reading the current geometry and style state.
   * - Incrementing an internal `copies` counter stored on the geometry.
   * - Offsetting the original coordinates by the provided `offsetX` and `offsetY`.
   * - Cloning the style object and updating its `id` to reflect the clone count.
   *
   * The original line is mutated by incrementing its `copies` property.
   * The returned line is a new instance with independent geometry and style state.
   *
   * @param offsetX - Horizontal offset applied to both start and end points of the cloned line.
   * @param offsetY - Vertical offset applied to both start and end points of the cloned line.
   * @returns A new `Line` instance representing the cloned line.
   *
   * @throws Error if the internal geometry or style state is missing or invalid.
   */
  public clone(offsetX: number = 10, offsetY: number = 10): Line {
    // Ensure internal geometry and style references exist and are valid objects
    if (this.#geometry && this.#style) {
      // Extract geometry values and current clone count with safe defaults
      const { copies = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.#geometry;

      // Compute the next clone index
      const nextCopies = copies + 1;

      // Create a shallow copy of the style to avoid mutating the original style object
      const style = { ...this.#style } as StyleForGShapeTag<'line'>;

      // Update the style identifier to reflect the clone number, if an id exists
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }

      // Persist the updated clone count on the original geometry
      this.#geometry['copies'] = nextCopies;

      // Create and return a new Line instance with offset coordinates and cloned style
      return new Line(
        offsetX + x1,
        offsetY + y1,
        offsetX + x2,
        offsetY + y2,
        style as linePropsType
      );
    }

    // Fail fast if cloning is not possible due to invalid internal state
    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  /**
   * Generates and updates the internal transformation buffer for the line geometry.
   *
   * This method constructs a homogeneous-coordinate matrix representation of the
   * line using its current geometric endpoints. The resulting data is written
   * into an internal `Float32Array` buffer that is reused across calls to avoid
   * unnecessary allocations.
   *
   * Access to this method is restricted via a privileged access key. If the key
   * is invalid, execution is aborted by the access assertion.
   *
   * The method mutates the internal geometry state by allocating or updating the
   * geometry buffer and restoring the expected dimensional layout for downstream
   * rendering or processing stages.
   *
   * @param accessKey - A privileged symbol used to assert internal-only access.
   * @returns void
   *
   * @throws Error if access validation fails or an unexpected runtime error occurs.
   */
  protected override generateMatrix(accessKey: symbol): void {
    try {
      // Verify that the caller has privileged internal access
      assertAccess(accessKey);

      // Cast internal geometry to the expected line-specific structure
      const geo = this.#geometry as {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        buffer: Float32Array;
      };

      // Abort if geometry is not available
      if (!geo) return;

      // Extract endpoint coordinates with safe defaults
      const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = geo;

      // Retrieve expected matrix dimensions for a line
      const [m, n] = dimensions['line'] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      // Populate the buffer with homogeneous coordinates for the line endpoints
      const sb = geo.buffer as Float32Array;
      sb.set([x1, y1, 1, x2, y2, 1], 0);

      // Restore or normalize the buffer layout according to internal dimensional rules
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      // Propagate any error without modification
      throw e;
    }
  }

  /**
   * Restores line geometry coordinates from a temporary homogeneous state buffer.
   *
   * This method maps values from a flattened internal matrix buffer back into
   * the line’s geometric representation. It assumes the buffer follows the
   * line-specific homogeneous coordinate layout:
   * `[x1, y1, 1, x2, y2, 1]`.
   *
   * Access to this method is restricted to internal callers via a privileged
   * access key. The method mutates the internal geometry state by updating
   * endpoint coordinates in place.
   *
   * @param accessKey - A privileged symbol used to assert internal-only access.
   * @param temporaryState - A `Float32Array` containing the line’s coordinates
   *                         in homogeneous matrix form.
   * @returns void
   *
   * @throws Error if access validation fails.
   */
  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ) {
    // Ensure the caller has privileged internal access
    assertAccess(accessKey);

    // Treat the temporary state as a flat homogeneous coordinate buffer
    const m = temporaryState as Float32Array;

    // Abort if geometry is not initialized
    if (!this.#geometry) return;

    // Cast internal geometry to the expected line-specific structure
    const geo = this.#geometry as {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };

    // Restore start point coordinates from the buffer
    [geo.x1, geo.y1] = [m[0] as number, m[1] as number];

    // Restore end point coordinates from the buffer
    [geo.x2, geo.y2] = [m[3] as number, m[4] as number];
  }
}
