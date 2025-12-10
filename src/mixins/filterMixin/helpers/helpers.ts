// Cleaner attribute updater
export function propertyUpdate(
  el: SVGElement,
  props: Record<string, string | number>
) {
  for (const [name, value] of Object.entries(props)) {
    el.setAttribute(name, String(value));
  }
}

// 🔹 Reusable children appender
export function appendChildren(parent: SVGElement, ...children: SVGElement[]) {
  for (const child of children) {
    parent.appendChild(child);
  }
}
