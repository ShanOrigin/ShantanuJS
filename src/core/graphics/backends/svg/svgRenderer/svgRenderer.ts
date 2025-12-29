import {
  GraphicalElement,
  type GShpesTages
} from '../../../graphicsElement/graphicsElement.js';

import { DEV_INTERNAL_ACCESS } from '../../../../../utils/providers/accesskeys.js';

import type {
  iPoint,
  iLine,
  iCircle,
  iEllipse,
  iPolygon,
  iPolyline,
  iRect,
  iPath
} from '../../../../../shapes/provider/shapesTypes';

import { transformStack } from '../../../../../types/index.js';

type shapeType =
  | iPoint
  | iLine
  | iCircle
  | iEllipse
  | iPolyline
  | iPolygon
  | iRect
  | iPath;

import { Renderer } from '../../renderers';
/**
 * Renderer — Engine-level optimized SVG attribute writer.
 *
 * Key behavior:
 * - All heavy computation happens in JS; renderer writes only minimal diffs to DOM.
 * - Geometry caching per-element prevents rebuilding strings/allocations when geometry unchanged.
 * - For polyline/polygon we rely on reference replacement for canonicalMatrix (case B).
 *
 * Only public method: render()
 * Everything else uses runtime-private fields/methods (#).
 */
export class SVGRenderer implements Renderer {
  // runtime-private caches (true JS private fields)
  #geoCache? = new WeakMap<Element, Record<string, unknown>>();
  #styleCache = new WeakMap<Element, Record<string, string>>();
  // #transformCache = new WeakMap<Element, string>();
  /* -------------------------
   * Runtime-private helpers
   * ------------------------- */

  #getOrInitGeoCache(el: Element): Record<string, unknown> {
    let c = this.#geoCache?.get(el);
    if (c === undefined) {
      c = Object.create(null) as Record<string, unknown>;
      this.#geoCache?.set(el, c);
    }
    return c;
  }

  #getOrInitStyleCache(el: Element): Record<string, string> {
    let c = this.#styleCache.get(el);
    if (c === undefined) {
      c = Object.create(null) as Record<string, string>;
      this.#styleCache.set(el, c);
    }
    return c;
  }

  /**
   * Set transform only if changed (uses transformCache).
   */
  /*
  #setTransformIfChanged(fig: Element, matrixStr: string): void {
    const prev = this.#transformCache.get(fig);
    if (prev !== matrixStr) {
      if (matrixStr === '') fig.removeAttribute('transform');
      else fig.setAttribute('transform', matrixStr);
      this.#transformCache.set(fig, matrixStr);
    }
  }


  #matrixToSVG(matrix: Float32Array): string {
    return `matrix(${matrix[0]},${matrix[1]},${matrix[3]},${matrix[4]},${matrix[6]},${matrix[7]})`;
  }
*/

  #numToStr(n: number): string {
    return String(n);
  }

  /* -------------------------
   * Public API
   * ------------------------- */

  /**
   * Render the given GraphicalElementComposer to its SVG element.
   *
   * - el: element wrapper providing geo/style/fig via internal access.
   * - finalMatrix: optional explicit transform to apply (short-circuit).
   * - isEffect: whether to apply transform attribute.
   */
  public render(shapesStack: Array<GraphicalElement<GShpesTages>>): void {
    // Validate the wrapper

    for (let index = 0; index < shapesStack.length; index++) {
      const el = shapesStack[index];

      if (!(el instanceof GraphicalElement))
        throw new Error(
          'Given Shape is not Renderable: necessary parameters are not provided'
        );

      // get geometry/style/DOM handle
      const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
        dirty: boolean;
        buffer: Float32Array;
        transformStack: transformStack;
        shape: string;
      }>;

      if (!geoRef)
        throw new Error('Shape geometry or canonicalMatrix is missing');

      // Render Only that shapes which actually needs to be rendered avoid unchanged shapes
      if (!geoRef.dirty) continue;

      const styleRef = el.getIStyle(DEV_INTERNAL_ACCESS);
      const figRef = el.getIFig(DEV_INTERNAL_ACCESS);
      const shape = geoRef?.shape;

      if ((el as shapeType).isBatching())
        throw new Error(
          'Transformation batching is active by .beginT(); call .endT() after transformations are applied.'
        );

      // get per-element caches (available for every shape)
      const geoCache = this.#getOrInitGeoCache(figRef); // Record<string, unknown>
      const styleCache = this.#getOrInitStyleCache(figRef); // Record<string, string>

      // Build desired attributes but avoid heavy work if cache indicates unchanged
      const desiredAttrs: Record<string, string> = Object.create(null);

      switch (shape) {
        case 'dot': {
          const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };
          const cr = r < 1 ? 1 : r > 5 ? 5 : r;

          const cxStr = this.#numToStr(cx);
          const cyStr = this.#numToStr(cy);
          const rStr = this.#numToStr(cr);

          geoCache['__cx'] !== cxStr && (desiredAttrs['cx'] = cxStr);

          geoCache['__cy'] !== cyStr && (desiredAttrs['cy'] = cyStr);

          geoCache['__r'] !== rStr && (desiredAttrs['r'] = rStr);

          break;
        }

        case 'line': {
          const { x1, y1, x2, y2 } = geoRef as {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
          };
          const x1s = this.#numToStr(x1);
          const y1s = this.#numToStr(y1);
          const x2s = this.#numToStr(x2);
          const y2s = this.#numToStr(y2);

          geoCache['__x1'] !== x1s && (desiredAttrs['x1'] = x1s);

          geoCache['__y1'] !== y1s && (desiredAttrs['y1'] = y1s);

          geoCache['__x2'] !== x2s && (desiredAttrs['x2'] = x2s);

          geoCache['__y2'] !== y2s && (desiredAttrs['y2'] = y2s);

          break;
        }

        case 'circle': {
          const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };
          const cxs = this.#numToStr(cx);
          const cys = this.#numToStr(cy);
          const rs = this.#numToStr(r);

          geoCache['__cx'] !== cxs && (desiredAttrs['cx'] = cxs);

          geoCache['__cy'] !== cys && (desiredAttrs['cy'] = cys);

          geoCache['__r'] !== rs && (desiredAttrs['r'] = rs);

          break;
        }

        case 'ellipse': {
          const { cx, cy, rx, ry } = geoRef as {
            cx: number;
            cy: number;
            rx: number;
            ry: number;
          };
          const cxs = this.#numToStr(cx);
          const cys = this.#numToStr(cy);
          const rxs = this.#numToStr(rx);
          const rys = this.#numToStr(ry);

          geoCache['__cx'] !== cxs && (desiredAttrs['cx'] = cxs);

          geoCache['__cy'] !== cys && (desiredAttrs['cy'] = cys);

          geoCache['__rx'] !== rxs && (desiredAttrs['rx'] = rxs);

          geoCache['__ry'] !== rys && (desiredAttrs['ry'] = rys);

          break;
        }

        case 'rect': {
          const {
            x,
            y,
            width,
            height,
            rx = 0,
            ry = 0
          } = geoRef as {
            x: number;
            y: number;
            width: number;
            height: number;
            rx: number;
            ry: number;
          };
          const xs = this.#numToStr(x);
          const ys = this.#numToStr(y);
          const ws = this.#numToStr(width);
          const hs = this.#numToStr(height);
          const rxs = this.#numToStr(rx);
          const rys = this.#numToStr(ry);

          geoCache['__x'] !== xs && (desiredAttrs['x'] = xs);

          geoCache['__y'] !== ys && (desiredAttrs['y'] = ys);

          geoCache['__width'] !== ws && (desiredAttrs['width'] = ws);

          geoCache['__height'] !== hs && (desiredAttrs['height'] = hs);

          geoCache['__rx'] !== rxs && (desiredAttrs['rx'] = rxs);

          geoCache['__ry'] !== rys && (desiredAttrs['ry'] = rys);

          break;
        }

        case 'polyline':
        case 'polygon': {
          // canonicalMatrix is an array-of-points. You said you replace arrays when geometry changes.
          const matrix = (geoRef?.buffer ?? []) as Float32Array;

          // Fast reference check (case B): if reference didn't change, skip rebuild.
          const prevMatrixRef = geoCache['__buffer'] as Float32Array;
          if (prevMatrixRef !== matrix) {
            // rebuild points string only when reference changed
            const len = matrix.length;
            // pre-allocate parts array of exact size
            const parts: string[] = new Array(len);
            for (let i = 0; i < len; i = i + 3) {
              parts[i] = `${matrix[i]},${matrix[i + 1]}`;
            }
            const pointsStr = parts.join(' ');
            desiredAttrs['points'] = pointsStr;
          } else {
            // reference same => no geometry change => do nothing
          }
          break;
        }

        case 'path': {
          // use geoRef.d or geoRef.pathD if provided
          const d = (geoRef as any).d ?? (geoRef as any).pathD;
          if (typeof d === 'string') {
            if (geoCache['__d'] !== d) {
              desiredAttrs['d'] = d;
            }
          }
          break;
        }

        default:
          // no-op for unknown shapes
          break;
      }

      //    console.log('desired = ', desiredAttrs);

      // Apply geometry attributes (written only if desiredAttrs contains them)
      for (const key in desiredAttrs) {
        if (!Object.prototype.hasOwnProperty.call(desiredAttrs, key)) continue;

        const vStr = desiredAttrs[key]!;
        figRef.setAttribute(key, vStr);
        geoCache[key] = vStr;
      }

      // Style handling: update attributes for style props and remove stale ones
      if (styleRef && typeof styleRef === 'object') {
        const styleObj = styleRef as Record<string, string | number>;
        // write or update
        for (const k in styleObj) {
          if (!Object.prototype.hasOwnProperty.call(styleObj, k)) continue;
          const vStr = String(styleObj[k]);
          if (styleCache[k] !== vStr) {
            figRef.setAttribute(k, vStr);
            styleCache[k] = vStr;
          }
        }
      }

      geoRef.dirty = false;
    }
  }
}

/* Export singleton instance to preserve the prior exported symbol. */
// nvim export const renderer = new SVGRenderer();
