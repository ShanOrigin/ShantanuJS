/**
 * SVGFilters.ts
 *
 * Factory helpers for creating SVG filter definitions.
 * Each method returns a complete <filter> element that can be appended
 * to an SVG <defs> section.
 */

import type {
  IShadowFilter,
  IGlowFilter,
} from "../../../../models/interfaces/filters";

import { createSVGElement, SVGSOURCE } from "../core/core.js";

export class SVGFilters {
  private static createFilter(id: string): SVGFilterElement {
    const filter = createSVGElement(SVGSOURCE, "filter") as SVGFilterElement;
    filter.id = id;
    return filter;
  }

  /**
   * Creates a Gaussian blur filter.
   * @param id Unique filter id.
   * @param radius Blur radius.
   */
  static blur(id: string, radius: number = 5): SVGFilterElement {
    const filter = this.createFilter(id);
    const blur = createSVGElement(SVGSOURCE, "feGaussianBlur");
    blur.setAttribute("stdDeviation", String(radius));
    filter.appendChild(blur);
    return filter;
  }

  /**
   * Creates a contrast filter.
   * @param id Unique filter id.
   * @param amount 1 = original.
   */
  static contrast(id: string, amount: number = 1): SVGFilterElement {
    const filter = this.createFilter(id);
    const ct = createSVGElement(SVGSOURCE, "feComponentTransfer");
    const intercept = (1 - amount) / 2;
    ["R", "G", "B"].forEach((c) => {
      const fn = createSVGElement(SVGSOURCE, `feFunc${c}`);
      fn.setAttribute("type", "linear");
      fn.setAttribute("slope", String(amount));
      fn.setAttribute("intercept", String(intercept));
      ct.appendChild(fn);
    });
    filter.appendChild(ct);
    return filter;
  }

  /**
   * Creates a saturation filter.
   * @param id Unique filter id.
   * @param amount 0 = grayscale, 1 = original.
   */
  static saturate(id: string, amount: number = 1): SVGFilterElement {
    const filter = this.createFilter(id);
    const m = createSVGElement(SVGSOURCE, "feColorMatrix");
    m.setAttribute("type", "saturate");
    m.setAttribute("values", String(amount));
    filter.appendChild(m);
    return filter;
  }

  /**
   * Creates a grayscale filter.
   * @param id Unique filter id.
   * @param amount 0 = original, 1 = grayscale.
   */
  static grayscale(id: string, amount: number = 1): SVGFilterElement {
    const filter = this.createFilter(id);
    const m = createSVGElement(SVGSOURCE, "feColorMatrix");
    m.setAttribute("type", "saturate");
    m.setAttribute("values", String(1 - amount));
    filter.appendChild(m);
    return filter;
  }

  /**
   * Creates a hue rotation filter.
   * @param id Unique filter id.
   * @param angle Rotation angle in degrees.
   */
  static hueRotate(id: string, angle: number = 0): SVGFilterElement {
    const filter = this.createFilter(id);
    const m = createSVGElement(SVGSOURCE, "feColorMatrix");
    m.setAttribute("type", "hueRotate");
    m.setAttribute("values", String(angle));
    filter.appendChild(m);
    return filter;
  }

  /**
   * Creates a drop shadow filter.
   * @param id Unique filter id.
   * @param props Shadow configuration.
   */
  static shadow(id: string, props: IShadowFilter): SVGFilterElement {
    const {
      offsetX = 0,
      offsetY = 4,
      blur = 6,
      color = "#000000",
      opacity = 0.5,
    } = props;
    const filter = this.createFilter(id);
    const ds = createSVGElement(SVGSOURCE, "feDropShadow");
    ds.setAttribute("dx", String(offsetX));
    ds.setAttribute("dy", String(offsetY));
    ds.setAttribute("stdDeviation", String(blur));
    ds.setAttribute("flood-color", color);
    ds.setAttribute("flood-opacity", String(opacity));
    filter.appendChild(ds);
    return filter;
  }

  /**
   * Creates a glow filter.
   * @param id Unique filter id.
   * @param props Glow configuration.
   */
  static glow(id: string, props: IGlowFilter): SVGFilterElement {
    const { blur = 8, color = "#000000" } = props;

    const filter = this.createFilter(id);

    const gBlur = createSVGElement(SVGSOURCE, "feGaussianBlur");
    gBlur.setAttribute("stdDeviation", String(blur));
    gBlur.setAttribute("result", "blur");

    const flood = createSVGElement(SVGSOURCE, "feFlood");
    flood.setAttribute("flood-color", color);
    flood.setAttribute("result", "color");

    const comp = createSVGElement(SVGSOURCE, "feComposite");
    comp.setAttribute("in", "color");
    comp.setAttribute("in2", "blur");
    comp.setAttribute("operator", "in");
    comp.setAttribute("result", "glow");

    const merge = createSVGElement(SVGSOURCE, "feMerge");
    const n1 = createSVGElement(SVGSOURCE, "feMergeNode");
    n1.setAttribute("in", "glow");
    const n2 = createSVGElement(SVGSOURCE, "feMergeNode");
    n2.setAttribute("in", "SourceGraphic");
    merge.append(n1, n2);

    filter.append(gBlur, flood, comp, merge);
    return filter;
  }
}
