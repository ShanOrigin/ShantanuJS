export let CONTEXT: string;

// dom.ts
export const SVGSOURCE = 'http://www.w3.org/2000/svg';

export const doc: Document = document;

// Safe wrapper for createElementNS
export function createSVGElement(
  tagName: string,
  namespace: string = SVGSOURCE
): SVGElement {
  return doc.createElementNS(namespace, tagName) as SVGElement;
}
