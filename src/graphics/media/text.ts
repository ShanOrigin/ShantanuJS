import { RenderNode } from "../render-node/render-node.js";
import {
  DEV_INTERNAL_ACCESS_KEY,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD,
  assertAccess,
} from "../../internal/keys/dev-keys.js";
import {
  CommonGeometricProperties,
  AllGShapeStyleProperties,
} from "../../property-definitions/common/common-properties.js";

import {
  GraphicalElementProperties,
  dimensions,
} from "../../property-definitions/specific/specific-properties.js";
import type {
  InitialProps,
  ConstructorPropsTypes,
} from "../../models/types/common";

import {
  Log,
  parameterTypeValidator,
  validProps,
} from "../../utils/helpers/helpers.js";

export class Text extends RenderNode<"text"> {
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

  constructor(props: ConstructorPropsTypes<"text">) {
    super("text", props.id ?? "");

    "id" in props && delete props.id;
    parameterTypeValidator(
      props,
      GraphicalElementProperties,
      AllGShapeStyleProperties,
      this.#classProp,
      "text",
    );

    props["font-size"] ??= 16;
    props["font-weight"] ??= "bold";
    props["font-style"] ??= "normal";
    props["letter-spacing"] ??= "0";
    props["word-spacing"] ??= "0";
    props["text-anchor"] ??= "middle";
    props["alignment-baseline"] ??= "middle";
    props["dominant-baseline"] ??= "";

    // for initial setup through RenderNode
    (props as ConstructorPropsTypes<"text"> & InitialProps)["initial"] = true;
    this.attrs(props);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      "text",
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Text {
    if (
      this.#geometry &&
      typeof this.#geometry === "object" &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === "object" &&
      this.#style !== null
    ) {
      const { x = 0, y = 0, text = "" } = this.#geometry;

      const style = { ...this.#style };
      if ("id" in style && style.id !== "") {
        style.id = `${style.id}-c${++this.#copies}`;
      }

      return new Text({
        x: offsetX + x,
        y: offsetY + y,
        text,
        initial: true,
        ...style,
      } as ConstructorPropsTypes<"text"> & InitialProps);
    }

    throw new Error("Cannot clone: geometry or style is invalid.");
  }

  protected override generateMatrix(accessKey: symbol): void {
    try {
      assertAccess(accessKey);
      const geo = this.#geometry as {
        buffer: Float32Array;
        text: string;
        x: number;
        y: number;
      };

      const style = this.#style as {
        "font-size": number;
        "font-weight": string;
        "font-style": string;
        "letter-spacing": string;
        "word-spacing": string;
        "text-anchor": string;
        "alignment-baseline": string;
        "dominant-baseline": string;
      };

      if (!geo || !style) return;

      const { text, x = 0, y = 0 } = geo;

      const { minX, minY, maxX, maxY } = this.#calculatePseudoBBox(
        text,
        x,
        y,

        style["font-size"],
        style["font-weight"],

        style["font-style"],
        Number(style["letter-spacing"]),
        Number(style["word-spacing"]),
        style["text-anchor"],
        style["alignment-baseline"],
        style["dominant-baseline"],
      );
      const [m, n] = dimensions["text"]!;
      const totalLength = m * n;

      // Allocate once and reuse to minimize GC pressure
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set([minX, minY, 1, maxX, minY, 1, maxX, maxY, 1, minX, maxY, 1], 0);

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

      if (!this.#geometry) return;

      [this.#geometry.x, this.#geometry.y] = [
        temporaryState[0]!,
        temporaryState[1]!,
      ]; // center if circle
    } catch (e) {
      throw e;
    }
  }

  /**
   * Computes an approximate bounding box for a text node prior to
   * renderer realization.
   *
   * This method provides a lightweight estimation using:
   * - text length
   * - font size
   * - font style and weight
   * - character and word spacing
   * - horizontal anchor alignment
   * - vertical baseline alignment
   *
   * The resulting bounds are intended for logical geometry queries
   * and layout calculations before exact text metrics become available.
   *
   * Accuracy is not guaranteed and the computed bounds may differ
   * from the renderer-measured bounding box after realization.
   *
   * @returns Estimated text bounding box in local coordinates.
   */
  #calculatePseudoBBox(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string,
    fontStyle: string,
    letterSpacing: number,
    wordSpacing: number,
    textAnchor: string,
    alignmentBaseline: string,
    dominantBaseline: string,
  ) {
    // ---------------------------------------------------------
    // Width approximation
    // ---------------------------------------------------------

    let widthFactor = 0.55;

    switch (fontWeight) {
      case "bold":
        widthFactor *= 1.05;
        break;

      case "bolder":
        widthFactor *= 1.1;
        break;

      case "lighter":
        widthFactor *= 0.95;
        break;
    }

    switch (fontStyle) {
      case "italic":
      case "oblique":
        widthFactor *= 1.02;
        break;
    }

    const charWidth = text.length * fontSize * widthFactor;

    const letterWidth = Math.max(0, text.length - 1) * letterSpacing;

    const spaceCount = (text.match(/ /g) || []).length;

    const wordWidth = spaceCount * wordSpacing;

    const width = charWidth + letterWidth + wordWidth;

    // ---------------------------------------------------------
    // Height approximation
    // ---------------------------------------------------------

    const height = fontSize;

    // ---------------------------------------------------------
    // Horizontal anchor
    // ---------------------------------------------------------

    let minX = x;
    let maxX = x + width;

    switch (textAnchor) {
      case "middle":
        minX = x - width / 2;
        maxX = x + width / 2;
        break;

      case "end":
        minX = x - width;
        maxX = x;
        break;

      case "start":
      default:
        minX = x;
        maxX = x + width;
        break;
    }

    // ---------------------------------------------------------
    // Vertical baseline
    // ---------------------------------------------------------

    const baseline = dominantBaseline || alignmentBaseline;

    let minY = y;
    let maxY = y + height;

    switch (baseline) {
      case "middle":
      case "central":
        minY = y - height / 2;
        maxY = y + height / 2;
        break;

      case "hanging":
        minY = y;
        maxY = y + height;
        break;

      case "text-bottom":
      case "bottom":
        minY = y - height;
        maxY = y;
        break;

      case "baseline":
      default:
        // SVG baseline approximation:
        // ~80% ascent, ~20% descent

        minY = y - height * 0.8;
        maxY = y + height * 0.2;
        break;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
    };
  }
}
