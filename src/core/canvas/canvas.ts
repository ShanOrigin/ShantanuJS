import { IGraphicalElementProperties as IG } from '../../properties/specific/specificProperties.js';

import { Colors } from '../../utils/providers/utils.js';
import { createSVGElement } from '../graphics/backends/svg/core/core.js';

import { GraphicalElement as G } from '../graphics/graphicsElement/graphicsElement.js';

import { EventsSystem } from '../events/event.js';
import { Group as GR } from '../../utils/collection/group.js';
import { DEV_INTERNAL_ACCESS } from '../../utils/providers/accesskeys.js';

import { initRenderer } from '../graphics/backends/renderer.js';
import { Renderer } from '../graphics/backends/renderers';

import { Engine } from '../engine/engine.js';
import {
  setSVGAttrs,
  SVG_CONTEXT
} from '../graphics/backends/svg/core/core.js';

import type { CONTEXT } from '../../types/graphicsElements';

type shapeType = keyof IG;

type GType = G<shapeType>;

type allowedShapes = GType;

declare const __SHANTANU_DEV__: boolean;

export default class Canvas extends EventsSystem<'canvas'> {
  #parent: HTMLElement | null; // Accept all valid SVG types generically
  #canvasElements: Array<allowedShapes> = [];
  #renderer!: Renderer;
  #engine!: Engine;
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);
  protected x: number = 0;
  protected y: number = 0;
  constructor(
    id: string,
    width: number,
    height: number,
    context: CONTEXT = SVG_CONTEXT,
    x: number = 0,
    y: number = 0
  ) {
    super('canvas', `${id}-Canvas`);
    try {
      if (typeof __SHANTANU_DEV__ !== 'undefined' && __SHANTANU_DEV__) {
        console.warn(
          'ShantanuJS is a pre-release build. Not recommended for production use.'
        );
      }

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      //  This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      if (context != SVG_CONTEXT) {
        throw new Error(
          'This version only Supports SVG Context...! . HTMLCanvas Supports will come in future...!'
        );
      }

      Object.defineProperty(this.#geometry, 'context', {
        value: context,
        writable: false,
        configurable: false,
        enumerable: true
      });

      this.#parent = document.getElementById(id);

      if (!this.#parent) {
        throw new Error(
          `Canvas container with id "${id}" not found in the DOM`
        );
      }

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++

      if (this.#geometry?.context == SVG_CONTEXT) {
        console.log('context is ', context);
        if (!this.#fig) {
          const canvas = createSVGElement(SVG_CONTEXT) as SVGSVGElement;
          console.log(canvas);
          const def = createSVGElement('defs');
          canvas.appendChild(def);
          this.setIFig(DEV_INTERNAL_ACCESS, context, canvas);
          this.#fig = this.getIFig(DEV_INTERNAL_ACCESS);
        }
      }

      this.#parent &&
        (this.#parent?.appendChild(this.#fig),
        (this.#parent.style.position = 'relative'));
      console.log('applying dim to canvas ');
      this.attrs({
        width,
        height,
        x,
        y,
        stroke: this.#style.stroke ?? 'rbg(0,0,0)',
        'stroke-width': this.#style['stroke-width'] ?? 0
      });

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++

      // initialized generalized render
      this.#renderer = initRenderer(context);
      // initialized generalized rendering engine
      this.#engine = new Engine(this.#canvasElements, this.#renderer);
      // started rendering engine
      this.#engine.start();
    } catch (e) {
      throw e;
    }
  }

  #setCanvasParams(): void {
    try {
      const { x, y } = this.#geometry as { x: number; y: number };
      const {
        stroke = 'black',
        fill = 'white',
        'stroke-width': sw = 0
      } = this.#style as {
        stroke: string;
        fill: string;
        'stroke-width': number;
      };

      const c = new Colors(fill);

      Object.assign(this.#fig.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        borderColor: c.isColor(stroke),
        background: c.isColor(fill),
        borderWidth: sw,
        borderStyle: sw > 0 ? 'solid' : 'none'
      });
    } catch (e) {
      throw e;
    }
  }

  public attrs(
    props:
      | {
          width?: number;
          height?: number;
          x?: number;
          y?: number;
          stroke?: string;
          'stroke-width'?: number;
          selectable?: boolean;
          fill?: string;
        }
      | string
  ): void | (string | number | undefined)[] | (string | number | undefined) {
    // Guard clause for empty object or empty string
    try {
      if (
        (typeof props === 'object' && Object.keys(props).length === 0) ||
        (typeof props === 'string' && props.trim() === '')
      )
        return;

      // Handle object props
      if (typeof props === 'object') {
        super.attrs(props);

        this.#setCanvasParams();

        if (this.#geometry?.context == SVG_CONTEXT) {
          const { width, height } = this.#geometry as {
            width: number;
            height: number;
          };
          'width' in props && setSVGAttrs(this.#fig, 'width', width);

          'height' in props && setSVGAttrs(this.#fig, 'height', height);
        }
        return;
      }

      let attrValue:
        | void
        | (string | number | undefined)[]
        | (string | number | undefined) = [];

      if (typeof props === 'string' && props.length >= 1) {
        const arg = props.trim().split(' ');

        for (let i = 0; i < arg.length; i++) {
          const e = arg[i].trim();
          if (e !== '') {
            const r = super.attrs(e);
            attrValue[i] =
              typeof r === 'string' || typeof r === 'number' ? r : undefined;
          }
        }
      }

      if (Array.isArray(attrValue) && attrValue.length > 0) {
        return attrValue.length > 1 ? attrValue : attrValue[0];
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }

  public contain(shape: allowedShapes): boolean {
    let isInDOM = false;

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  This code may change According to context
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    this.#geometry?.context == SVG_CONTEXT &&
      (isInDOM = shape.getIFig(DEV_INTERNAL_ACCESS).parentNode === this.#fig);

    let isInCanvas = false;
    const CA = this.#canvasElements;

    const GEI = shape?.style?.id; // element id if graphical element

    // finding the exact location of the element which we want to delete
    for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
      const [fe, le] = [CA[f], CA[l]];

      if (fe instanceof G && fe?.style?.id === GEI) {
        isInCanvas = true;
        break;
      }

      if (le instanceof G && le?.style?.id === GEI) {
        isInCanvas = true;
        break;
      }
    }

    return isInDOM && isInCanvas;
  }

  public addTo(...rest: allowedShapes[]): this {
    if (!this.#fig)
      throw new Error(
        `Canvas is not initialized or may have been deleted: ${this.#fig}`
      );

    const canvasContext = this.#geometry?.context;

    for (let index = 0; index < rest.length; index++) {
      const shapeEl = rest[index];
      if (!(shapeEl instanceof G)) throw new Error(`Invalid Shape : `, shapeEl);

      const { shape, context = null } = shapeEl.geometry as {
        shape: string;
        context: string | undefined;
      };

      if (context) {
        console.warn(
          'This shape is Already added in other , Canvas check properly'
        );
        return this;
      }
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      //  This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      if (canvasContext == SVG_CONTEXT) {
        const gEl = createSVGElement(shape);
        shapeEl.setIFig(DEV_INTERNAL_ACCESS, canvasContext, gEl);
        this.#fig!.appendChild(gEl);

        this.#fig = this.getIFig(DEV_INTERNAL_ACCESS);
      }

      this.#canvasElements.push(shapeEl);
      this.#style['inside'] = `canvas,${this.#style.id}`;
    }

    return this;
  }

  /* Very important method work on it later
	 *
	 *
	 *
  #removeSameElementFromContainingGR(element: allowedShapes) {
    const parentId = (
      element.getIFig(DEV_INTERNAL_ACCESS).parentNode as HTMLElement
    ).getAttribute('id');

    let REGI: number = -1; // index of a group which consist given element
    const CA = this.#canvasElements;

    // finding the GR which consists "element" based on it parent id
    // using double pointer technique to find which take less iterations then linear search

    for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
      const [fe, le] = [CA[f], CA[l]];

      // checking if element is of class G which has style from froward
      if (
        fe instanceof G &&
        (fe as GType)?.geometry?.shape === 'g' &&
        (fe as GType)?.style?.id == parentId
      ) {
        REGI = f;
        break;
      }

      // checking if element is of class G which has style from backward
      if (
        le instanceof G &&
        (le as GType)?.geometry?.shape === 'g' &&
        (le as GType)?.style?.id == parentId
      ) {
        REGI = l;
        break;
      }
    }

    // once group found which consist particular above element which may be single element or group itself
    // checking if given element is group
    if (element instanceof G && (element as GType)?.geometry?.shape == 'g') {
      //if given element is group then gets all its children which may include single element or group itself also

      const ge = (element as GR).getElements();
      
     // for (let f = 0, l = ge.length - 1; f <= l; f++, l--) {
       // const [e1, e2] = [ge[f], ge[l]];

      //  e1.attrs({ roleOfSVG: 'deleted' });
     //   e2.attrs({ roleOfSVG: 'deleted' });
     // }
      // if element is group then on a group all its children which will delete all the childrens and children maybe group also from that particular group and reinsert into Canvas
      (element as GR)?.ungroup();

      //return to the original method so original method can remove group itself on which this method is called
      if (REGI !== -1) {
        const parentGR = CA[REGI] as GR;
        parentGR?.remove(element);
      }
      // now delete all elements for children's which were the part of group which we want to delete from the array we have got

      // +++++ important read carefully ++++

      //   this.remove(...ge, element);

      return;
    }

    // if given element is instance of graphical class or non graphical class then just u group it from its respective group
    // it will  come out that element into Canvas then Canvas method will handle its deletion

    if (REGI !== -1 && element instanceof G) {
      // element.attrs({ roleOfSVG: 'deleted' });

      (CA[REGI] as GR)?.remove(element);
    }
  }

	*/

  public remove(...elements: allowedShapes[]): this {
    try {
      /*
			 remove(element):

       Case 1: element is group
         → ungroup
         → remove all children
         → parent call will remove group

       Case 2: element is inside group
         → find parent group
         → remove from group
         → remove from canvas

       Case 3: element is direct child of canvas
         → remove directly
			 
			 */

      const CF = this.#fig; //  svg node

      if (!CF)
        throw new Error(
          `Canvas is not initialized or may have been deleted: ${this.#fig}`
        );

      const CA = this.#canvasElements;

      for (let i = 0; i < elements.length; i++) {
        const RE = elements[i]; // element to be removed

        let index = -1;

        const { id, inside = null } = (RE as GType)?.style as {
          id: string;
          inside: string;
        }; // element id if graphical element

        // finding the exact location of the element which we want to delete
        for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
          const [fe, le] = [CA[f], CA[l]];

          if (fe instanceof G && fe?.style?.id === id) {
            index = f;
            break;
          }

          if (le instanceof G && le?.style?.id === id) {
            index = l;
            break;
          }
        }

        if (index == -1 || !inside)
          console.warn(`Possibly this SVG Element is deleted Already :`, RE);

        /* Ver Very important
				 * Mostly SVG CONTEXT based logic
				 *
				 *
        //        const pid = RE?.style?.inside ;
        // checking that is the element which is given to remove instance of a group or it is not directly child of Canvas itself then use method which remove element from respective group

				const [ elementInside , parentId ] = (inside as string)?.split(',');
        if (
          this?.style?.id !== parentId ||
          (RE instanceof GR && (RE as GR)?.getElements().length > 0)
        ) {
          index !== -1 && this.#removeSameElementFromContainingGR(RE);
          if (!(RE instanceof GR)) {
            CF?.removeChild(RE.getIFig(DEV_INTERNAL_ACCESS)) &&
              CA.splice(index, 1);
          }
        } else {
          // if the given element to delete is a direct child of Canvas Den directly delete that do not need to check groups
          index !== -1 &&
            CF?.removeChild(RE.getIFig(DEV_INTERNAL_ACCESS)) &&
            CA.splice(index, 1);
        }
				*/
      }

      return this;
    } catch (e) {
      throw e;
    }
  }

  #unGroupToDeleteGroup(g: GR) {
    /* Very important
		 *
		 *
		if (g?.geometry?.shape !== 'g') return;
     const ge = g.getElements();
    // for (let f = 0, l = ge.length - 1; f <= l; f++, l--) {
    // const [e1, e2] = [ge[f], ge[l]];
    //  e1.attrs({ roleOfSVG: 'deleted' });
    // e2.attrs({ roleOfSVG: 'deleted' });
    //}
   g.ungroup();
	 */
  }
  public clear(): this {
    try {
      // finding the GR which consists "element" based on it parent id
      // using double pointer technique to find which take less iterations then linear search

      const CA = this.#canvasElements;
      for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
        const [fe, le] = [CA[f], CA[l]];

        if (fe === le) {
          if (fe instanceof GR) this.#unGroupToDeleteGroup(fe);
        } else {
          if (fe instanceof GR) this.#unGroupToDeleteGroup(fe);
          if (le instanceof GR) this.#unGroupToDeleteGroup(le);
        }
      }

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++

      if (this.#geometry?.context == SVG_CONTEXT) {
        for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
          const fe = CA[f].getIFig(DEV_INTERNAL_ACCESS);
          const le = CA[l].getIFig(DEV_INTERNAL_ACCESS);

          if (fe && fe.parentNode === this.#fig) this.#fig.removeChild(fe);
          if (le && le.parentNode === this.#fig) this.#fig.removeChild(le);
        }
      }
      this.#canvasElements.length = 0;
      return this;
    } catch (e) {
      throw e;
    }
  }

  public getAllElements(): Array<allowedShapes> {
    try {
      return this.#canvasElements;
    } catch (e) {
      throw e;
    }
  }
}
