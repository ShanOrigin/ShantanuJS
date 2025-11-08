import type { GShpesTages } from './graphicalElement';

import { Events } from '../events/event.js';

import {
  assignBBoxMatrix,
  checkParent,
  isValidMatrix
} from '../../../utils/providers/utils.js';

import { Colors } from '../../../utils/providers/utils.js';
import { DEV_INTERNAL_ACCESS } from '../../../utils/providers/accesskeys.js';

//svg class
//P should be path only
//export abstract class SVG<T ,P  extends CommonShapeTag > extends Events {
export abstract class GraphicalElementComposer<
  T extends GShpesTages,
  S extends GShpesTages = 'path'
> extends Events<T, S> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);

  constructor(shapeName: T, ID: string = '', tagName?: S) {
    super(shapeName, tagName ?? ('path' as S), ID);

    try {
      this.#geometry &&
        !this.#geometry.TList &&
        (this.#geometry['TList'] = [
          {
            MatrixType: 'cummulative',
            type: 'all',
            TMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
          }
        ]);

      // console.log('in GSVGElement');
      // console.log(this.#geometry?.TList);
    } catch (e) {
      throw e;
    }
  }

  /*
   * function return  bounding box of svg element
   */

  public getBBox(): Object | undefined {
    try {
      checkParent(this.#fig, 'SVG');

      if (!this.#geometry) return;
      const shape = this.#geometry?.shape ?? '';

      // console.log('fig =', this.#fig.innerHTML);

      const box = [
        'rect',
        'circle',
        'ellipse',
        'line',
        'path',
        'polygon',
        'polyline',
        'text',
        'g',
        'dot'
      ].includes(shape)
        ? (this.#fig as SVGGraphicsElement).getBBox()
        : (() => {
            throw new Error(
              `Bounding box properties not available on <${shape}>`
            );
          })();

      const matrix: Float32Array[] = [
        new Float32Array([box.x, box.y]),
        new Float32Array([box.x + box.width, box.y]),
        new Float32Array([box.x + box.width, box.y + box.height]),
        new Float32Array([box.x, box.y + box.height])
      ];

      if (isValidMatrix(matrix, 4, 2)) {
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          cx: box.x + box.width / 2,
          cy: box.y + box.height / 2,

          matrix: matrix
        };
      } else {
        throw new Error(
          'there is a some problem in bounding box please check all parameters which are numbers'
        );
      }
    } catch (e) {
      throw e;
    }
  }

  public getOBBox(): Object | undefined {
    try {
      checkParent(this.#fig, 'SVG');

      if (!this.#geometry) return;

      if (!('Obbox' in this.#geometry)) {
        assignBBoxMatrix(this.#geometry, this.getBBox.bind(this), 'Obbox');
      }

      const matrix = (this.#geometry.Obbox ?? []) as Float32Array[];

      if (!isValidMatrix(matrix, matrix.length, 3)) {
        console.warn('Invalid OBB matrix');
        return;
      }

      let sumX = 0,
        sumY = 0;
      let maxLen = 0;
      let localXAxis: [number, number] = [1, 0]; // fallback

      for (let i = 0; i < matrix.length; i++) {
        const [x1, y1] = matrix[i];
        sumX += x1;
        sumY += y1;

        const [x2, y2] = matrix[(i + 1) % matrix.length];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);

        if (len > maxLen && len !== 0) {
          maxLen = len;
          localXAxis = [dx / len, dy / len];
        }
      }

      if (maxLen === 0) {
        console.warn('Degenerate OBB — all points identical or too small');
        return;
      }

      const localYAxis: [number, number] = [-localXAxis[1], localXAxis[0]];
      const angleOriantation =
        Math.atan2(localXAxis[1], localXAxis[0]) * (180 / Math.PI);

      const cx = sumX / matrix.length;
      const cy = sumY / matrix.length;

      const [LT, RT, RB] = matrix;
      const width = Math.hypot(RT[0] - LT[0], RT[1] - LT[1]);
      const height = Math.hypot(RB[0] - RT[0], RB[1] - RT[1]);

      return {
        x: LT[0],
        y: LT[1],
        cx,
        cy,
        width,
        height,
        matrix,
        localXAxis,
        localYAxis,
        angleOriantation
      };
    } catch (e) {
      throw e;
    }
  }

  public hide(): void {
    try {
      checkParent(this.#fig, 'SVG');
      this.setAttrs({ visibility: 'hidden' });
    } catch (e) {
      throw e;
    }
  }

  public show(): void {
    try {
      checkParent(this.#fig, 'SVG');
      this.setAttrs({ visibility: 'visible' });
    } catch (e) {
      throw e;
    }
  }

  public toFront(near: number = 0): void {
    try {
      checkParent(this.#fig, 'SVG');
      if (!this.#fig || !this.#fig.parentNode) return;

      const val = Math.abs(near);

      // If near is 0, just move to the front (last child)
      if (val === 0) {
        // const lastChild = this.#fig.parentNode.lastChild;
        //	lastChild && this.#fig.parentNode.insertAfter(this.#fig, lastChild);
        this.#fig.parentNode.appendChild(this.#fig);
        return;
      }

      const tree = Array.from(this.#fig.parentNode.childNodes ?? []);
      const currentIndex = tree.indexOf(this.#fig);
      const newIndex = currentIndex + val;

      //      console.log('tree is ', tree);
      //console.log('current index is ', currentIndex);
      // console.log('new index is ', newIndex);

      // Remove from current position (optional but safe)
      //this.#fig.parentNode.removeChild(this.#fig);

      if (newIndex >= tree.length - 1) {
        // If newIndex exceeds or is last, move to end
        this.#fig.parentNode.appendChild(this.#fig);
      } else {
        // Insert after newIndex → insert before (newIndex + 1)
        const refNode = tree[newIndex + 1]; // +1 to insert *after* newIndex
        this.#fig.parentNode.insertBefore(this.#fig, refNode);
        // console.log('inserting to fromt at ', near);
      }
    } catch (e) {
      throw e;
    }
  }

  public toBack(far: number = 0): void {
    try {
      checkParent(this.#fig, 'SVG');
      if (!this.#fig || !this.#fig.parentNode) return;

      const val = Math.abs(far);

      // If far is 0, just move to the back (first child)
      if (val === 0) {
        const firstChild = this.#fig.parentNode.firstChild;
        firstChild && this.#fig.parentNode.insertBefore(this.#fig, firstChild);

        return;
      }

      const tree = Array.from(this.#fig.parentNode.childNodes ?? []);
      const currentIndex = tree.indexOf(this.#fig);
      const newIndex = currentIndex - val;

      //   console.log('tree is ', tree);
      //console.log('current index is ', currentIndex);
      //console.log('new index is ', newIndex);

      // Remove from current position
      //  this.#fig.parentNode.removeChild(this.#fig);

      if (newIndex <= 0) {
        // Move to very beginning
        const firstChild = this.#fig.parentNode.firstChild;
        this.#fig.parentNode.insertBefore(this.#fig, firstChild);
      } else {
        const refNode = tree[newIndex]; // Insert before this node (to move back)
        // console.log('refNode', refNode);

        this.#fig?.parentNode?.insertBefore(this.#fig, refNode);
        //  console.log('inserting to back at ', far);
      }
    } catch (e) {
      throw e;
    }
  }
  public blur(
    rx: number = 0,
    ry: number = 0,
    blur?: number,
    color: string = 'rgba(0,0,0,0.5)'
  ): void {
    try {
      blur = blur ?? Math.max(rx, ry); // safely compute default if not provided

      if (this.#fig) {
        this.#fig.style.boxShadow = `${rx}px ${ry}px ${blur}px ${new Colors(
          color
        ).isColor()}`;
      }
    } catch (e) {
      throw e;
    }
  }

  /*
   * method to add css class or css properties on svg element
   */
  /*
  public addCss(cclass: string | Record<string, string>): void {
    try {
      if (!cclass || !this.#fig) return;

      if (typeof cclass === 'string') {
        this.#fig.classList.add(cclass);
      } else if (typeof cclass === 'object') {
        Object.assign(this.#fig.style, cclass);
      }
    } catch (e) {
      throw e;
    }
  }
*/
  /*
   * method to remove css class or css properties on svg element
   *
   */
  /*
  public removeCss(target: string | string[]): void {
    try {
      if (!target || !this.#fig) return;

      if (typeof target === 'string') {
        this.#fig.classList.remove(target);
      } else if (Array.isArray(target)) {
        for (const prop of target) {
          (this.#fig.style as any)[prop] = '';
        }
      }
    } catch (e) {
      throw e;
    }
  }
*/
}
