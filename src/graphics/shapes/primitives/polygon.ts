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
import { computeAABBPoints } from "../../../utils/geometry/bounding-box/axis-aligned-bounding-box.js";

type PolygonBaseProps = ConstructorPropsTypes<"polygon">;
type PolygonConstructorProps = Omit<PolygonBaseProps, "points"> & {
  points: string | number[][];
};

export class Polygon extends RenderNode<"polygon"> {
  #copies: number = 0;
  /**
   * Reference to the base class’s internal geometry object.
   *
   * This is a direct reference, not a copy. Any mutation performed through this
   * field will affect the original geometry maintained by the parent/base class.
   * Intended strictly for internal use with privileged access.
   *
   * @private
   */
  #geometry = this[GET_INTERNAL_GEOMETRY_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Reference to the base class’s internal style object.
   *
   * This field points to the original style state owned by the parent/base class.
   * Mutations propagate immediately to the source style and influence rendering
   * or appearance wherever that style is consumed.
   *
   * @private
   */
  #style = this[GET_INTERNAL_STYLE_METHOD](DEV_INTERNAL_ACCESS_KEY);

  /**
   * Reference to the parent class’s internal private properties container.
   *
   * Provides privileged access to selected private state of the parent class.
   * This is used to coordinate behavior across inheritance boundaries without
   * duplicating or re-owning state.
   *
   * @private
   */
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS_KEY);

  constructor(props: PolygonConstructorProps) {
    super("polygon", props?.id ?? "");

    "id" in props && delete props.id;
    let pointsAttr: string = "";

    const points = props?.points;
    if (points && typeof points === "string") {
      // Form: "x1,y1 x2,y2 x3,y3 ..."
      pointsAttr = points.trim();
    } else {
      // Form: [[x1, y1], [x2, y2], ...]
      if (
        (points && !Array.isArray(points)) ||
        !(points as number[][]).every(
          (row: number[]) =>
            Array.isArray(row) &&
            row.length === 2 &&
            typeof row[0] == "number" &&
            typeof row[1] == "number",
        )
      ) {
        throw new Error(
          "Invalid matrix: must be an array of [x, y] coordinates.",
        );
      }

      for (let i = 0; i < points.length; i++) {
        pointsAttr += points[i]![0] + "," + points[i]![1];
        if (i < points.length - 1) {
          pointsAttr += " ";
        }
      }
    }
    pointsAttr += " Z";
    if (pointsAttr[pointsAttr.length - 1]!.toLowerCase() !== "z") {
      throw new Error("Given Path is Not Closed please close path with 'Z'");
    }

    props.points = pointsAttr as string;

    parameterTypeValidator(
      props as PolygonBaseProps,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      "polygon",
    );

    // for initial setup through RenderNode
    (props as ConstructorPropsTypes<"polygon"> & InitialProps)["initial"] =
      true;
    this.attrs(props as PolygonBaseProps);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      "polygon",
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Polygon {
    if (
      this.#geometry &&
      typeof this.#geometry === "object" &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === "object" &&
      this.#style !== null
    ) {
      const { buffer } = this.#geometry;

      const newPoints = [];
      for (let i = 0; i < buffer!.length!; i += 3) {
        const x = buffer![i]!;
        const y = buffer![i + 1]!;
        newPoints.push([x + offsetX, y + offsetY]);
      }

      const style = { ...this.#style };
      if ("id" in style && style.id !== "") {
        style.id = `${style.id}-c${++this.#copies}`;
      }

      return new Polygon({
        points: newPoints,
        ...style,
        initial: true,
      } as ConstructorPropsTypes<"polygon"> &
        InitialProps & { points: number[][] });
    }

    throw new Error("Cannot clone: geometry or style is invalid.");
  }

  #validatePolygonCoordinates(path: string) {
    // Match the pattern of "x,y" coordinates separated by spaces

    const coordinateListRegex =
      /^(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)(\s+-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)*(?:\s+[Zz])?$/;

    // Check if the path matches the valid polyline format
    if (!coordinateListRegex.test(path)) {
      throw new Error("Given Path is not correct please check");
    }

    const rowVertex = path
      .trim()

      .split(/\s+/);
    const Vertex = new Float32Array((rowVertex.length - 1) * 3); // 3 floats per vertex: x, y, 1

    for (let i = 0; i < rowVertex.length - 1; i++) {
      const pair = rowVertex[i]!.trim();
      const s = pair.indexOf(",");
      const x = parseFloat(pair.slice(0, s));
      const y = parseFloat(pair.slice(s + 1));

      if (isNaN(x) || isNaN(y)) {
        throw new Error("X or Y are not numbers");
      }

      const offset = i * 3;
      Vertex[offset] = x;
      Vertex[offset + 1] = y;
      Vertex[offset + 2] = 1; // homogeneous coordinate
    }

    // Optional validation
    // const totalCoordinates = Vertex.length;
    return Vertex;
  }

  // specially for polyline because throught .attrs() , .setSMatrix() user can change acutual shape matrix if he/she gives less or more coordinates than original size

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);

      const geo = this.#geometry as {
        points: string;
        buffer: Float32Array;
      };

      if (!geo) return;

      const rawPoints = this.attrs("points") as string;
      const vmat = this.#validatePolygonCoordinates(rawPoints);
      if (!(vmat instanceof Float32Array)) {
        throw new Error(
          "Invalid point data: could not generate transformation matrix.",
        );
      }

      const m = vmat.length / 3;

      // Retrieve expected matrix dimensions for a line
      const [_, n] = dimensions["polygon"] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set(vmat, 0);

      this.restoreDimension(DEV_INTERNAL_ACCESS_KEY, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array,
  ) {
    try {
      assertAccess(accessKey);
      const m = temporaryState;
      if (!this.#geometry) return;

      // Replacing reduce with traditional loop

      let points = "";
      for (let i = 0; i < m.length; i += 3) {
        points += `${m[i]!},${m[i + 1]!} `;
      }
      this.#geometry!.points = points;
      this.#computeBounds(temporaryState);
    } catch (e) {
      throw e;
    }
  }

  #computeBounds(buffer: Float32Array) {
    const geo = this.#geometry as {
      bounds: Float32Array;
    };
    const bounds = computeAABBPoints(buffer);

    // Allocate the buffer once or reallocate only if the size has changed
    if (!geo.bounds || geo.bounds.length !== 4) {
      geo.bounds = new Float32Array(4);
    }

    geo.bounds[0] = bounds.maxX;
    geo.bounds[1] = bounds.minY;
    geo.bounds[2] = bounds.maxX;
    geo.bounds[3] = bounds.maxY;
  }
}
