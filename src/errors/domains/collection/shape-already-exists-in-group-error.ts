import { UsageError } from "../../core/errors/usage-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when attempting to add a shape to a group that already
 * contains the same shape.
 *
 * This error indicates incorrect usage of the grouping API, where duplicate
 * insertion of a shape into the same group is not allowed in order to
 * preserve group integrity and ordering invariants.
 */
export class ShapeAlreadyExistsInGroupError extends UsageError {
  /**
   * Creates a new ShapeAlreadyExistsInGroupError instance.
   *
   * @param shapeId - Identifier of the shape that already exists in the group.
   * @param groupId - Identifier of the group containing the shape.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(shapeId: string, groupId: string, source: string) {
    super(
      "GROUP_SHAPE_ALREADY_EXISTS",
      "Shape already exists in the group.",
      new ErrorContext(
        { shapeId, groupId },
        "shape must not already be added to the group",
        source,
      ),
    );
  }
}
