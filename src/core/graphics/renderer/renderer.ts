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

import type {
  ipDot,
  ipLine,
  ipCircle,
  ipEllipse,
  ipPolygon,
  ipPolyline,
  ipPath,
  ipRect,
  ipText,
  ipImage
} from '../../../properties/provider/shapeProperties';

//import { ty } from '../../../utils/animations/healper.js';

interface RenderOptions {
  el: GraphicalElementComposer<GShpesTages, GShpesTages>;
  //	el : shapeType
  T?: DOMMatrix;
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
  public render({ el, T, isEffect = true }: RenderOptions) {
    if (!(el instanceof GraphicalElementComposer))
      throw new Error(
        'Given Shape is not Randerable because neccesary all parameter are not provided '
      );

    if ((el as shapeType).isBatching())
      throw new Error(
        'Transformation batching is acvite by .beginT() , please call .endT() after n number of Transformation applyed.'
      );

    const geoRef = el.getIGeo(DEV_INTERNAL_ACCESS) as shapeType &
      shapeTypeParams;
    const figRef = el.getIFig(DEV_INTERNAL_ACCESS);
    const styleRef = el.getIStyle(DEV_INTERNAL_ACCESS);

    if (!geoRef || !geoRef?.matrix)
      throw new Error('Shape geometry or matrix missing');

    if (T && T instanceof DOMMatrix && geoRef?.TList?.[0]) {
      const CTM = (geoRef?.TList?.[0]?.TMatrix ??
        new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])) as Float32Array; // cumulative Transformation matrix [ a , b , 0 , c , d , 0 , e , f  ,1 ] Column major matrix

      //      console.log('ctm =', CTM);
      const CNTM = T.multiplySelf(
        new DOMMatrix([CTM[0], CTM[1], CTM[3], CTM[4], CTM[6], CTM[7]])
      );
      /*
      console.log(
        'Applying Transformation',
        CNTM,
        `matrix(${CNTM.a},${CNTM.b},${CNTM.c},${CNTM.d},${CNTM.e},${CNTM.f})`
      );
			*/
      isEffect &&
        el
          .getIFig(DEV_INTERNAL_ACCESS)
          .setAttribute(
            'transform',
            `matrix(${CNTM.a},${CNTM.b},${CNTM.c},${CNTM.d},${CNTM.e},${CNTM.f})`
          );

      const e = geoRef;
      /*
      console.log(
        e,
        'TList' in e,
        e.TList,
        e.TList[0],
        'TMatrix' in e.TList[0]
      );
			*/
      if (
        e &&
        'TList' in e &&
        e.TList &&
        e.TList[0] &&
        'TMatrix' in e.TList[0]
      ) {
        console.log('setting t matrix');
        e.TList[0].TMatrix = new Float32Array([
          CNTM.a,
          CNTM.b,
          0,
          CNTM.c,
          CNTM.d,
          0,
          CNTM.e,
          CNTM.f,
          1
        ]);
      }
      return;
    }

    // case 2 : initial render and when properties changed by attr method of el
    let d: string = '';
    const matrix = geoRef?.matrix as Float32Array[];
    const shape = geoRef?.shape;
    //  console.warn('shape matrix : ', JSON.stringify(geoRef.matrix));
    switch (shape) {
      case 'dot':
        {
          /*
          isValidMatrix(matrix, 1, 3);
          let [cx, cy] = matrix[0];

          let r = geoRef?.r ?? 1;
          (r < 1 && (r = 1)) || (r > 5 && (r = 5));
          // We'll use two arc commands to form a complete circle
          d = `M ${cx + r},${cy} A ${r} ${r} 0 1 1 ${cx - 0.001},${cy} Z`;
          */

          const { cx, cy, r } = geoRef;
          let cr = 1;
          (r < 1 && (cr = 1)) || (r > 5 && (cr = 5));

          figRef.setAttribute('cx', String(cx));
          figRef.setAttribute('cy', String(cy));
          figRef.setAttribute('r', String(cr));
        }
        break;

      case 'line':
        {
          /*
          isValidMatrix(matrix, 2, 3);

          const [x1, y1] = matrix[0];
          const [x2, y2] = matrix[1];

          d = `M${x1} ,${y1} L${x2},${y2}`; // for line
					*/

          const { x1, y1, x2, y2 } = geoRef;
          figRef.setAttribute('x1', String(x1));
          figRef.setAttribute('y1', String(y1));
          figRef.setAttribute('x2', String(x2));
          figRef.setAttribute('y2', String(y2));
        }
        break;

      case 'circle':
        {
          /*
          // console.log(matrix);
          isValidMatrix(matrix, 2, 3);
          const [rx, ry] = matrix[1];

          const r = geoRef?.r ?? 1;

          // We'll use two arc commands to form a complete circle
          d = `M ${rx},${ry} A ${r} ${r} 0 1 1 ${rx - 0.001},${ry} Z`;

          //  console.log(d);
					*/

          const { cx, cy, r } = geoRef;
          figRef.setAttribute('cx', String(cx));
          figRef.setAttribute('cy', String(cy));
          figRef.setAttribute('r', String(r));
        }

        break;

      case 'ellipse':
        {
          /*
          isValidMatrix(matrix, 3, 3);
          const [crx, cry] = matrix[1];
          const [rx, ry] = [geoRef?.rx ?? 1, geoRef?.ry ?? 1];
          const ang =
            Math.atan2(cry - matrix[0][1], crx - matrix[0][0]) * 57.295;
          d = `M ${crx},${cry} A ${rx} ${ry} ${ang} 1 1 ${
            crx - 0.001
          },${cry} Z`;
*/

          const { cx, cy, rx, ry } = geoRef;
          figRef.setAttribute('cx', String(cx));
          figRef.setAttribute('cy', String(cy));
          figRef.setAttribute('rx', String(rx));
          figRef.setAttribute('ry', String(ry));
        }
        break;

      case 'rect': {
        /*
        isValidMatrix(matrix, 4, 3);

        const [rx, ry] = [geoRef?.rx ?? 0, geoRef?.ry ?? 0];
        const existingD = styleRef?.d; // if you store last path string somewhere
        if (existingD && (rx > 0 || ry > 0)) {
          d = addCornerRadiusToExistingPath(existingD, rx, ry);
        } else {
          // DEFAULT: original behavior
          const [x1, y1] = matrix[0];
          const [x2, y2] = matrix[1];
          const [x3, y3] = matrix[2];
          const [x4, y4] = matrix[3];

          if (rx == 0 && ry == 0) {
            d = `M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} L ${x4},${y4} Z`;
          } else {
            d = `M${x1 + rx},${y1}
           L${x2 - rx},${y2}
           A${rx},${ry} 0 0 1 ${x2},${y1 + ry}
           L${x3},${y3 - ry}
           A${rx},${ry} 0 0 1 ${x3 - rx},${y3}
           L${x4 + rx},${y4}
           A${rx},${ry} 0 0 1 ${x4},${y4 - ry}
           L${x1},${y1 + ry}
           A${rx},${ry} 0 0 1 ${x1 + rx},${y1} Z`;
          }
					}
*/

        const { x, y, width, height, rx = 0, ry = 0 } = geoRef;

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
          /*
          isValidMatrix(matrix, mlen, 3);

          for (let index = 0; index < mlen; index++) {
            const [x, y] = matrix[index];
            d += index != 0 ? `L${x},${y} ` : `M${x},${y} `;
          }
          if (shape == 'polygon') {
            d += 'Z';
          }
          */

          let points = '';
          for (let index = 0; index < mlen; index++) {
            const [x, y] = matrix[index];
            points += `${x},${y} `;
          }

          figRef.setAttribute('points', points);
        }
        break;

      case 'path': {
        /*
					    figRef.setAttribute('d' , d );
					* */

        break;
      }

      default:
        break;
    }
    /*
    if (d !== '' && el.style && el.style?.d !== d && geoRef) {
      figRef.setAttribute('d', d);
      styleRef['d'] = d;
      // console.log('js str use ', geoRef?.shape);

      return;
    }
		*/

    // case 3 : fallback if case 2 wont work in any impossible rare case
    // svg path generation via data & matrix -> TS -> wasm -> C - > wasm -> TS -> string ouput
    /*
    const dataS = new Float32Array([-1, 0]);
    const csvgPath = cmath.getSVGPath(geoRef?.matrix as Float32Array[], dataS);
    if (figRef.getAttribute('d') !== csvgPath) {
      figRef.setAttribute('d', csvgPath);
    }*/
  }
}

function addCornerRadiusToExistingPath(
  d: string,
  rx: number,
  ry: number
): string {
  const hasArcs = /A\s*[\d.]+,[\d.]+/i.test(d);
  let points: [number, number][];

  if (hasArcs) {
    points = extractOriginalCorners(d);
    console.log('has arc ', points);
  } else {
    points = extractPolygonPoints(d);
    console.log('has not  arc ', points);
  }

  if (points.length !== 4) return d; // Safety

  const [p1, p2, p3, p4] = points;

  return `
    M${p1[0] + rx},${p1[1]}
    L${p2[0] - rx},${p2[1]}
    A${rx},${ry} 0 0 1 ${p2[0]},${p2[1] + ry}
    L${p3[0]},${p3[1] - ry}
    A${rx},${ry} 0 0 1 ${p3[0] - rx},${p3[1]}
    L${p4[0] + rx},${p4[1]}
    A${rx},${ry} 0 0 1 ${p4[0]},${p4[1] - ry}
    L${p1[0]},${p1[1] + ry}
    A${rx},${ry} 0 0 1 ${p1[0] + rx},${p1[1]} Z
  `;
}

function extractPolygonPoints(d: string): [number, number][] {
  const coords: [number, number][] = [];
  const matches = d.matchAll(/([ML])\s*([\d.]+)[,\s]+([\d.]+)/gi);
  for (const m of matches) {
    coords.push([parseFloat(m[2]), parseFloat(m[3])]);
  }
  return coords;
}

function extractOriginalCorners(d: string): [number, number][] {
  const points = extractPolygonPoints(d);
  const arcMatch = d.match(/A\s*([\d.]+)[,\s]+([\d.]+)/i);
  if (!arcMatch) return points; // fallback
  const rx = parseFloat(arcMatch[1]);
  const ry = parseFloat(arcMatch[2]);

  // Reverse-engineer unrounded rectangle coordinates
  points[0][0] -= rx; // p1.x
  // p1.y stays the same
  points[1][0] += rx; // p2.x
  // p2.y stays the same
  points[2][1] += ry; // p3.y
  // p3.x stays the same
  points[3][0] -= rx; // p4.x
  points.length = 4;
  return points;
}

export const renderer = new Renderer();
