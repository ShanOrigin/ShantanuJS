/**
 * ============================================================================
 * SVG DOM Utilities
 * ============================================================================
 *
 * PURPOSE
 * ----------------------------------------------------------------------------
 * Provides a minimal abstraction layer over native SVG DOM operations.
 *
 * These utilities ensure:
 * - consistent SVG element creation
 * - safe attribute assignment
 * - controlled DOM insertion and removal
 *
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

/**
 * SVG namespace URI used for creating SVG elements.
 */
export const SVGSOURCE = 'http://www.w3.org/2000/svg';

/**
 * Identifier representing SVG rendering context.
 */
export const SVG_CONTEXT = 'svg';

/**
 * Cached document reference for DOM operations.
 */
const doc: Document = document;

/**
 * ============================================================================
 * createSVGElement
 * ============================================================================
 *
 * Creates an SVG element using the correct namespace.
 *
 * @param tagName - SVG tag name (e.g., 'circle', 'rect', 'path')
 * @param namespace - Namespace URI (defaults to SVG namespace)
 *
 * @returns SVGElement instance
 */
export function createSVGElement(
  tagName: string,
  namespace: string = SVGSOURCE
): SVGElement {
  return doc.createElementNS(namespace, tagName) as SVGElement;
}

/**
 * ============================================================================
 * setSVGAttrs
 * ============================================================================
 *
 * Sets an attribute on an SVG element.
 *
 * Special Handling:
 * - For <text> elements with key 'text', sets `textContent` instead of attribute.
 *
 * @param shape - Target SVG element
 * @param key - Attribute name
 * @param value - Attribute value
 */
export function setSVGAttrs(
  shape: SVGElement,
  key: string,
  value: string | number
): void {
  try {
    // Special case: text node content
    (shape.tagName === 'text' &&
      key === 'text' &&
      (shape.textContent = value.toString())) ||
      shape.setAttribute(key, String(value));
  } catch (e) {
    throw e;
  }
}

/**
 * ============================================================================
 * addTo
 * ============================================================================
 *
 * Appends or inserts an SVG node into a parent element.
 *
 * Behavior:
 * - If index is valid → inserts at specific position
 * - Otherwise → appends at the end
 *
 * @param parent - Parent SVG container
 * @param node - SVG node to insert
 * @param index - Optional insertion index
 *
 * @returns boolean indicating success
 */
export function addTo(
  parent: SVGSVGElement | SVGGElement | SVGElement,
  node: SVGElement,
  index?: number
) {
  if (!parent) return false;

  // Insert at specific index if valid
  if (
    typeof index === 'number' &&
    index >= 0 &&
    index < parent.children.length
  ) {
    return Boolean(parent.insertBefore(node, parent.children[index]));
  }

  // Default: append at end
  return Boolean(parent.appendChild(node));
}

/**
 * ============================================================================
 * removeFrom
 * ============================================================================
 *
 * Removes a child SVG node from its parent.
 *
 * @param parent - Parent SVG container
 * @param node - SVG node to remove
 *
 * @returns boolean indicating success
 */
export function removeFrom(
  parent: SVGSVGElement | SVGGElement | SVGElement,
  node: SVGElement
) {
  return Boolean(parent?.removeChild(node));
}
