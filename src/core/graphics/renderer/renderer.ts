/*
import { isValidMatrix } from '../../../utils/providers/utils.js';
import { cmath } from '../../../webAsm/interface/TS/CMATH_Interface.js';
import { GraphicalElementComposer } from '../graphics/graphicalElementComposer.js';

import { DEV_INTERNAL_ACCESS } from '../../../utils/providers/accesskeys.js';
import type { GShpesTages } from '../graphics/graphicalElement';

import type {
  iPoint,
  iLine,
  iCircle,
  iEllipse,
  iPolygon,
  iPolyline,
  iRect,
  iPath
} from '../../../shapes/provider/shapesTypes';

import {
  type ipDot,
  type ipLine,
  type ipCircle,
  type ipEllipse,
  type ipPolygon,
  type ipPolyline,
  type ipPath,
  type ipRect,
  type ipText,
  type ipImage,
  AllGShapeStyleProperties
} from '../../../properties/provider/shapeProperties';
import { transformStack } from '../../../types/index.js';

//import { ty } from '../../../utils/animations/healper.js';

interface RenderOptions {
  el: GraphicalElementComposer<GShpesTages, GShpesTages>;
  //	el : shapeType
  finalMatrix?: Float32Array;
  isEffect?: boolean;
  isProjections?: boolean;
}

type shapeType =
  | iPoint
  | iLine
  | iCircle
  | iEllipse
  | iPolyline
  | iPolygon
  | iRect
  | iPath;

type shapeTypeParams =
  | ipDot
  | ipLine
  | ipCircle
  | ipEllipse
  | ipPolyline
  | ipPolygon
  | ipPath
  | ipRect
  | ipText;

export class Renderer {
  public render({ el, finalMatrix, isEffect = true }: RenderOptions) {
    if (!(el instanceof GraphicalElementComposer))
      throw new Error(
        'Given Shape is not Randerable because neccesary all parameter are not provided '
      );
    const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
      canonicalMatrix: Float32Array[];
      transformStack: transformStack;
      shape: string;
    }>;

    const styleRef = el.getIStyle(DEV_INTERNAL_ACCESS);

    //    const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as shapeType & shapeTypeParams;
    const figRef = el.getIFig(DEV_INTERNAL_ACCESS);
    const shape = geoRef.shape;

    if (shape != 'svg' && (el as shapeType).isBatching())
      throw new Error(
        'Transformation batching is acvite by .beginT() , please call .endT() after n number of Transformation applyed.'
      );

    if (!geoRef || (shape != 'svg' && !geoRef?.canonicalMatrix))
      throw new Error('Shape geometry or canonicalMatrix is missing');

    if (finalMatrix && finalMatrix instanceof Float32Array) {
      isEffect &&
        el
          .getIFig(DEV_INTERNAL_ACCESS)
          .setAttribute(
            'transform',
            `matrix(${finalMatrix[0]},${finalMatrix[1]},${finalMatrix[3]},${finalMatrix[4]},${finalMatrix[6]},${finalMatrix[7]})`
          );

      return;
    }

    // case 2 : initial render and when properties changed by attr method of el

    const matrix = (geoRef?.canonicalMatrix ?? []) as Float32Array[];

    console.log('rendering');
    switch (shape) {
      case 'svg':
        {
          const { width, height } = geoRef as { width: number; height: number };

          if (
            Number(figRef.getAttribute('width')) != width ||
            Number(figRef.getAttribute('height')) != height
          ) {
            console.log('changed geometry');
            figRef.setAttribute('width', String(width));
            figRef.setAttribute('height', String(height));
          }
        }
        break;

      case 'dot':
        {
          const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };

          if (
            Number(figRef.getAttribute('cx')) != cx ||
            Number(figRef.getAttribute('cy')) != cy ||
            Number(figRef.getAttribute('r')) != r
          ) {
            let cr = 1;
            (r < 1 && (cr = 1)) || (r > 5 && (cr = 5));

            figRef.setAttribute('cx', String(cx));
            figRef.setAttribute('cy', String(cy));
            figRef.setAttribute('r', String(cr));
          }
        }
        break;

      case 'line':
        {
          const { x1, y1, x2, y2 } = geoRef as {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
          };
          figRef.setAttribute('x1', String(x1));
          figRef.setAttribute('y1', String(y1));
          figRef.setAttribute('x2', String(x2));
          figRef.setAttribute('y2', String(y2));
        }
        break;

      case 'circle':
        {
          const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };
          figRef.setAttribute('cx', String(cx));
          figRef.setAttribute('cy', String(cy));
          figRef.setAttribute('r', String(r));
        }

        break;

      case 'ellipse':
        {
          const { cx, cy, rx, ry } = geoRef as {
            cx: number;
            cy: number;
            rx: number;
            ry: number;
          };
          figRef.setAttribute('cx', String(cx));
          figRef.setAttribute('cy', String(cy));
          figRef.setAttribute('rx', String(rx));
          figRef.setAttribute('ry', String(ry));
        }
        break;

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

        figRef.setAttribute('x', String(x));
        figRef.setAttribute('y', String(y));
        figRef.setAttribute('width', String(width));
        figRef.setAttribute('height', String(height));
        figRef.setAttribute('rx', String(rx));
        figRef.setAttribute('ry', String(ry));

        break;
      }

      case 'polyline':
      case 'polygon':
        {
          const mlen = matrix.length;
          let points = '';
          for (let index = 0; index < mlen; index++) {
            const [x, y] = matrix[index];
            points += `${x},${y} `;
          }

          figRef.setAttribute('points', points);
        }
        break;

      case 'path': {
        
					 //   figRef.setAttribute('d' , d );
					

        break;
      }

      default:
        break;
    }

    const style = styleRef as Record<string, string | number>;

    console.log('rendering style ');
    for (const key in style) {
      if (Object.prototype.hasOwnProperty.call(style, key)) {
        const value = style[key];
        figRef.setAttribute(key, value.toString());
      }
    }
  }
}

export const renderer = new Renderer();
*/

/* Keep your original imports */
import { isValidMatrix } from '../../../utils/providers/utils.js';
import { cmath } from '../../../webAsm/interface/TS/CMATH_Interface.js';
import { GraphicalElementComposer } from '../graphics/graphicalElementComposer.js';

import { DEV_INTERNAL_ACCESS } from '../../../utils/providers/accesskeys.js';
import type { GShpesTages } from '../graphics/graphicalElement';

import type {
  iPoint,
  iLine,
  iCircle,
  iEllipse,
  iPolygon,
  iPolyline,
  iRect,
  iPath
} from '../../../shapes/provider/shapesTypes';

import {
  type ipDot,
  type ipLine,
  type ipCircle,
  type ipEllipse,
  type ipPolygon,
  type ipPolyline,
  type ipPath,
  type ipRect,
  type ipText,
  type ipImage,
  AllGShapeStyleProperties
} from '../../../properties/provider/shapeProperties';
import { transformStack } from '../../../types/index.js';

type shapeType =
  | iPoint
  | iLine
  | iCircle
  | iEllipse
  | iPolyline
  | iPolygon
  | iRect
  | iPath;

type shapeTypeParams =
  | ipDot
  | ipLine
  | ipCircle
  | ipEllipse
  | ipPolyline
  | ipPolygon
  | ipPath
  | ipRect
  | ipText;

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
export class Renderer {
  // runtime-private caches (true JS private fields)
  #geoCache = new WeakMap<Element, Record<string, unknown>>();
  #styleCache = new WeakMap<Element, Record<string, string>>();
  #transformCache = new WeakMap<Element, string>();

  /* -------------------------
   * Runtime-private helpers
   * ------------------------- */

  #getOrInitGeoCache(el: Element): Record<string, unknown> {
    let c = this.#geoCache.get(el);
    if (c === undefined) {
      c = Object.create(null) as Record<string, unknown>;
      this.#geoCache.set(el, c);
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
  #setTransformIfChanged(fig: Element, matrixStr: string): void {
    const prev = this.#transformCache.get(fig);
    if (prev !== matrixStr) {
      if (matrixStr === '') fig.removeAttribute('transform');
      else fig.setAttribute('transform', matrixStr);
      this.#transformCache.set(fig, matrixStr);
    }
  }

  /**
   * Convert Float32Array canonical 3x3 -> SVG matrix(a,b,c,d,e,f)
   */
  #matrixToSVG(matrix: Float32Array): string {
    return `matrix(${matrix[0]},${matrix[1]},${matrix[3]},${matrix[4]},${matrix[6]},${matrix[7]})`;
  }

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
  public render({
    el,
    finalMatrix,
    isEffect = true
  }: {
    el: GraphicalElementComposer<GShpesTages, GShpesTages>;
    finalMatrix?: Float32Array;
    isEffect?: boolean;
  }): void {
    // Validate the wrapper
    if (!(el instanceof GraphicalElementComposer))
      throw new Error(
        'Given Shape is not Renderable: necessary parameters are not provided'
      );

    // get geometry/style/DOM handle
    const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as Partial<{
      canonicalMatrix: Float32Array[];
      transformStack: transformStack;
      shape: string;
      currentMatrix?: Float32Array;
      d?: string;
      pathD?: string;
    }>;
    const styleRef = el.getIStyle(DEV_INTERNAL_ACCESS);
    const figRef = el.getIFig(DEV_INTERNAL_ACCESS);
    const shape = geoRef?.shape;

    if (!geoRef || (shape !== 'svg' && !geoRef?.canonicalMatrix))
      throw new Error('Shape geometry or canonicalMatrix is missing');

    if (shape !== 'svg' && (el as shapeType).isBatching())
      throw new Error(
        'Transformation batching is active by .beginT(); call .endT() after transformations are applied.'
      );

    // Short-circuit: explicit finalMatrix provided — apply transform and return.
    if (finalMatrix && finalMatrix instanceof Float32Array) {
      isEffect &&
        this.#setTransformIfChanged(figRef, this.#matrixToSVG(finalMatrix));
      return;
    }

    // get per-element caches (available for every shape)
    const geoCache = this.#getOrInitGeoCache(figRef); // Record<string, unknown>
    const styleCache = this.#getOrInitStyleCache(figRef); // Record<string, string>

    // Build desired attributes but avoid heavy work if cache indicates unchanged
    const desiredAttrs: Record<string, string> = Object.create(null);

    switch (shape) {
      case 'svg': {
        const { width, height } = geoRef as { width: number; height: number };
        const wStr = this.#numToStr(width);
        const hStr = this.#numToStr(height);

        // Only set if changed (use geoCache for cheap comparison)
        if ((geoCache as any).__width !== wStr) {
          desiredAttrs.width = wStr;
          // (geoCache as any).__width = wStr;
        }
        if ((geoCache as any).__height !== hStr) {
          desiredAttrs.height = hStr;
          // (geoCache as any).__height = hStr;
        }
        break;
      }

      case 'dot': {
        const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };
        const cr = r < 1 ? 1 : r > 5 ? 5 : r;

        const cxStr = this.#numToStr(cx);
        const cyStr = this.#numToStr(cy);
        const rStr = this.#numToStr(cr);

        if ((geoCache as any).__cx !== cxStr) {
          desiredAttrs.cx = cxStr;
          //  (geoCache as any).__cx = cxStr;
        }
        if ((geoCache as any).__cy !== cyStr) {
          desiredAttrs.cy = cyStr;
          // (geoCache as any).__cy = cyStr;
        }
        if ((geoCache as any).__r !== rStr) {
          desiredAttrs.r = rStr;
          // (geoCache as any).__r = rStr;
        }
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

        if ((geoCache as any).__x1 !== x1s) {
          desiredAttrs.x1 = x1s;
          //  (geoCache as any).__x1 = x1s;
        }
        if ((geoCache as any).__y1 !== y1s) {
          desiredAttrs.y1 = y1s;
          //   (geoCache as any).__y1 = y1s;
        }
        if ((geoCache as any).__x2 !== x2s) {
          desiredAttrs.x2 = x2s;
          // (geoCache as any).__x2 = x2s;
        }
        if ((geoCache as any).__y2 !== y2s) {
          desiredAttrs.y2 = y2s;
          // (geoCache as any).__y2 = y2s;
        }
        break;
      }

      case 'circle': {
        const { cx, cy, r } = geoRef as { cx: number; cy: number; r: number };
        const cxs = this.#numToStr(cx);
        const cys = this.#numToStr(cy);
        const rs = this.#numToStr(r);

        if ((geoCache as any).__cx !== cxs) {
          desiredAttrs.cx = cxs;
          // (geoCache as any).__cx = cxs;
        }
        if ((geoCache as any).__cy !== cys) {
          desiredAttrs.cy = cys;
          // (geoCache as any).__cy = cys;
        }
        if ((geoCache as any).__r !== rs) {
          desiredAttrs.r = rs;
          // (geoCache as any).__r = rs;
        }
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

        if ((geoCache as any).__cx !== cxs) {
          desiredAttrs.cx = cxs;
          // (geoCache as any).__cx = cxs;
        }
        if ((geoCache as any).__cy !== cys) {
          desiredAttrs.cy = cys;
          // (geoCache as any).__cy = cys;
        }
        if ((geoCache as any).__rx !== rxs) {
          desiredAttrs.rx = rxs;
          //  (geoCache as any).__rx = rxs;
        }
        if ((geoCache as any).__ry !== rys) {
          desiredAttrs.ry = rys;
          //  (geoCache as any).__ry = rys;
        }
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

        if ((geoCache as any).__x !== xs) {
          desiredAttrs.x = xs;
          //  (geoCache as any).__x = xs;
        }
        if ((geoCache as any).__y !== ys) {
          desiredAttrs.y = ys;
          ///   (geoCache as any).__y = ys;
        }
        if ((geoCache as any).__width !== ws) {
          desiredAttrs.width = ws;
          //  (geoCache as any).__width = ws;
        }
        if ((geoCache as any).__height !== hs) {
          desiredAttrs.height = hs;
          //  (geoCache as any).__height = hs;
        }
        if ((geoCache as any).__rx !== rxs) {
          desiredAttrs.rx = rxs;
          //  (geoCache as any).__rx = rxs;
        }
        if ((geoCache as any).__ry !== rys) {
          desiredAttrs.ry = rys;
          //  (geoCache as any).__ry = rys;
        }
        break;
      }

      case 'polyline':
      case 'polygon': {
        // canonicalMatrix is an array-of-points. You said you replace arrays when geometry changes.
        const matrix = (geoRef?.canonicalMatrix ?? []) as Float32Array[];

        // Fast reference check (case B): if reference didn't change, skip rebuild.
        const prevMatrixRef = (geoCache as any).__matrixRef as
          | Float32Array[]
          | undefined;
        if (prevMatrixRef !== matrix) {
          // rebuild points string only when reference changed
          const len = matrix.length;
          // pre-allocate parts array of exact size
          const parts: string[] = new Array(len);
          for (let i = 0; i < len; i++) {
            const pt = matrix[i];
            parts[i] = `${pt[0]},${pt[1]}`;
          }
          const pointsStr = parts.join(' ');
          desiredAttrs.points = pointsStr;
          //  (geoCache as any).__points = pointsStr;
          // (geoCache as any).__matrixRef = matrix;
        } else {
          // reference same => no geometry change => do nothing
        }
        break;
      }

      case 'path': {
        // use geoRef.d or geoRef.pathD if provided
        const d = (geoRef as any).d ?? (geoRef as any).pathD;
        if (typeof d === 'string') {
          if ((geoCache as any).__d !== d) {
            desiredAttrs.d = d;
            //  (geoCache as any).__d = d;
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

      const vStr = desiredAttrs[key];
      figRef.setAttribute(key, vStr);
      styleCache[key] = vStr;
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

      /*
      // remove stale style attributes that were previously set by renderer
      for (const prevKey in styleCache) {
        if (!Object.prototype.hasOwnProperty.call(styleCache, prevKey))
          continue;
        if (!(prevKey in styleObj)) {
          figRef.removeAttribute(prevKey);
          delete styleCache[prevKey];
        }
      }
    */
    }
  }
}

/* Export singleton instance to preserve the prior exported symbol. */
export const renderer = new Renderer();
