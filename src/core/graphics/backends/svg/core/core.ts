// export let CONTEXT: string;

// dom.ts
const SVGSOURCE = 'http://www.w3.org/2000/svg';

export const SVG_CONTEXT = 'svg';

const doc: Document = document;

// Safe wrapper for createElementNS
export function createSVGElement(
  tagName: string,
  namespace: string = SVGSOURCE
): SVGElement {
  return doc.createElementNS(namespace, tagName) as SVGElement;
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
