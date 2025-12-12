// export let CONTEXT: string;

import { Renderer } from '../../../renderer/renderer.js';
// dom.ts
export const SVGSOURCE = 'http://www.w3.org/2000/svg';

export const SVG_CONTEXT = 'svg';

export const doc: Document = document;

// Safe wrapper for createElementNS
export function createSVGElement(
  tagName: string,
  namespace: string = SVGSOURCE
): SVGElement {
  return doc.createElementNS(namespace, tagName) as SVGElement;
}

export function createSVGContext(
  context: string,
  shapeName: string,
  renderer?: Renderer
): [string, SVGElement, Renderer] {
  const svgElement = createSVGElement(shapeName);
  renderer = renderer ? renderer : new Renderer();
  return [context, svgElement, renderer];
}

export function setSVGAttrs(
  shape: SVGElement,
  key: string,
  value: string | number
): void {
  try {
    (shape.tagName == 'text' &&
      key == 'text' &&
      (shape.textContent = value.toString())) ||
      shape.setAttribute(key, String(value));
  } catch (e) {
    throw e;
  }
}

export function getAttr(shape: SVGElement, key: string) {
  return shape.getAttribute(key);
}
