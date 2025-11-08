import {
  IGraphicalElementProperties as IG,
  INonGraphicalElementProperties as ING
} from '../../../properties/specific/specificProperties.js';
import { Colors, createSVGElement } from '../../../utils/providers/utils.js';

import { GraphicalElement as G } from '../graphics/graphicalElement.js';
import { NonGraphicalElement as NG } from '../graphics/nonGraphicalElement.js';
import { GraphicalElementComposer } from '../graphics/graphicalElementComposer.js';
import { Group as GR } from '../../../utils/collection/group.js';
import { DEV_INTERNAL_ACCESS } from '../../../utils/providers/accesskeys.js';
type shapeType = keyof IG;

type GType = G<shapeType, keyof IG>;
type NGType = NG<keyof ING>;
type allowedSVG = GType | NGType;

export default class Canvas extends GraphicalElementComposer<'svg', 'svg'> {
  #parent: HTMLElement | null; // Accept all valid SVG types generically
  #canvasElements: Array<allowedSVG> = [];
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);
  protected x: number = 0;
  protected y: number = 0;
  constructor(
    id: string,
    width: number,
    height: number,
    posX: number = 0,
    posY: number = 0
  ) {
    super('svg', `${id}-Canvas`, 'svg');
    try {
      super.attrs({ width: width, height: height });

      this.#parent = document.getElementById(id);

      if (!this.#parent) {
        throw new Error(
          `Canvas container with id "${id}" not found in the DOM`
        );
      }

      this.#parent &&
        (this.#parent?.appendChild(this.#fig),
        (this.#parent.style.position = 'relative'));

      this.#style &&
        this.#setCanvasParams(
          posX,
          posY,
          this.#style.stroke ?? 'rbg(0,0,0)',
          this.#style['stroke-width'] ?? 0
        );
      this.x = posX;
      this.y = posY;

      //Only SVG specific for filter effects

      const def = createSVGElement('defs');
      this.#fig.appendChild(def);
    } catch (e) {
      throw e;
    }
  }

  public contain(svg: allowedSVG): boolean {
    const isInSVGDOM =
      svg.getIFig(DEV_INTERNAL_ACCESS).parentNode === this.#fig;
    let isInSVGA = false;
    const CA = this.#canvasElements;

    const [eGT, eNGT] = [svg as GType, svg as NGType];
    const GEI = eGT?.style?.id; // element id if graphical element
    const NGEI = eNGT?.attributes?.id; // element id if non graphical element

    // finding the exact location of the element which we want to delete
    for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
      const [fe, le] = [CA[f], CA[l]];

      if (
        (fe instanceof G && fe?.style?.id === GEI) ||
        (fe instanceof NG && fe?.attributes?.id === NGEI)
      ) {
        isInSVGA = true;
        break;
      }

      if (
        (le instanceof G && le?.style?.id === GEI) ||
        (le instanceof NG && le?.attributes?.id === NGEI)
      ) {
        isInSVGA = true;
        break;
      }
    }

    return isInSVGDOM && isInSVGA;
  }

  /**
   * Adds this element to one or more SVG containers.
   *
   * **Overload 1:** Control tracking behavior explicitly.
   * @param track If `true`, the element will be tracked by the canvas. If `false`, it will not.
   * @param rest One or more SVG containers to add this element to.
   * @returns The current instance for chaining.
   */
  public addTo(track: boolean, ...rest: allowedSVG[]): this;

  /**
   * Adds this element to one or more SVG containers.
   *
   * **Overload 2:** Automatically tracks the element.
   * @param svg The first SVG Element .
   * @param rest Additional SVG Element.
   * @returns The current instance for chaining.
   */
  public addTo(svg: allowedSVG, ...rest: allowedSVG[]): this;

  public addTo(first: boolean | allowedSVG, ...rest: allowedSVG[]): this {
    if (!this.#fig)
      throw new Error(
        `Canvas is not initialized or may have been deleted: ${this.#fig}`
      );

    const addToTrackByCanvas = typeof first === 'boolean' ? first : true;
    const elements: allowedSVG[] = !addToTrackByCanvas
      ? rest
      : [first as allowedSVG, ...rest];

    for (let index = 0; index < elements.length; index++) {
      const el = elements[index];
      if (!(el instanceof G || el instanceof NG))
        throw new Error(`Invalid SVG element: ${el}. Must be G or NG.`);

      if (!el.getIFig(DEV_INTERNAL_ACCESS))
        throw new Error(`SVG element is deleted or uninitialized: ${el}`);

      this.#fig!.appendChild(el.getIFig(DEV_INTERNAL_ACCESS));

      addToTrackByCanvas && this.#canvasElements.push(el);
      el.attrs({
        inside: `svg,${this.#style?.id}`
      });
    }

    return this;
  }

  #removeSameElementFromContainingGR(element: allowedSVG) {
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
      /*
      for (let f = 0, l = ge.length - 1; f <= l; f++, l--) {
        const [e1, e2] = [ge[f], ge[l]];

      //  e1.attrs({ roleOfSVG: 'deleted' });
     //   e2.attrs({ roleOfSVG: 'deleted' });
      }*/
      // if element is group then on a group all its children which will delete all the childrens and children maybe group also from that particular group and reinsert into Canvas
      (element as GR)?.ungroup();

      //return to the original method so original method can remove group itself on which this method is called
      if (REGI !== -1) {
        const parentGR = CA[REGI] as GR;
        parentGR?.remove(element);
      }
      // now delete all elements for children's which were the part of group which we want to delete from the array we have got

      this.remove(...ge, element);

      return;
    }

    // if given element is instance of graphical class or non graphical class then just u group it from its respective group
    // it will  come out that element into Canvas then Canvas method will handle its deletion

    if (REGI !== -1 && (element instanceof G || element instanceof NG)) {
      // element.attrs({ roleOfSVG: 'deleted' });

      (CA[REGI] as GR)?.remove(element);
    }
  }

  public remove(...elements: allowedSVG[]): this {
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

        if (!CF.contains(RE.getIFig(DEV_INTERNAL_ACCESS)))
          throw new Error(
            `Possibly this SVG Element is deleted Already :${RE} `
          );

        let index = -1;
        const [eGT, eNGT] = [RE as GType, RE as NGType];
        const GEI = eGT?.style?.id; // element id if graphical element
        const NGEI = eNGT?.attributes?.id; // element id if non graphical element
        const inside =
          (RE instanceof G && eGT.style?.inside) ||
          (RE instanceof NG && eNGT.attributes.inside);

        // finding the exact location of the element which we want to delete
        for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
          const [fe, le] = [CA[f], CA[l]];

          if (
            (fe instanceof G && fe?.style?.id === GEI) ||
            (fe instanceof NG && fe?.attributes?.id === NGEI)
          ) {
            index = f;
            break;
          }

          if (
            (le instanceof G && le?.style?.id === GEI) ||
            (le instanceof NG && le?.attributes?.id === NGEI)
          ) {
            index = l;
            break;
          }
        }

        const parentId = (
          RE.getIFig(DEV_INTERNAL_ACCESS).parentNode as HTMLElement
        ).getAttribute('id');

        //        const pid = RE?.style?.inside ;
        // checking that is the element which is given to remove instance of a group or it is not directly child of Canvas itself then use method which remove element from respective group

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
      }

      return this;
    } catch (e) {
      throw e;
    }
  }

  #unGroupToDeleteGroup(g: GR) {
    if (g?.geometry?.shape !== 'g') return;

    const ge = g.getElements();
    /*
    for (let f = 0, l = ge.length - 1; f <= l; f++, l--) {
      const [e1, e2] = [ge[f], ge[l]];
      e1.attrs({ roleOfSVG: 'deleted' });
      e2.attrs({ roleOfSVG: 'deleted' });
    }
*/
    g.ungroup();
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

      for (let f = 0, l = CA.length - 1; f <= l; f++, l--) {
        const [fe, le] = [CA[f], CA[l]];

        if (
          fe.getIFig(DEV_INTERNAL_ACCESS) &&
          fe.getIFig(DEV_INTERNAL_ACCESS).parentNode === this.#fig
        )
          this.#fig.removeChild(fe.getIFig(DEV_INTERNAL_ACCESS));
        if (
          le.getIFig(DEV_INTERNAL_ACCESS) &&
          le.getIFig(DEV_INTERNAL_ACCESS).parentNode === this.#fig
        )
          this.#fig.removeChild(le.getIFig(DEV_INTERNAL_ACCESS));
      }
      this.#canvasElements = [];
      return this;
    } catch (e) {
      throw e;
    }
  }

  public getAllElements(): Array<allowedSVG> {
    try {
      return this.#canvasElements;
    } catch (e) {
      throw e;
    }
  }

  #setCanvasParams(
    posX: number,
    posY: number,
    stroke: string,
    strokeWidth: number = 0.5,
    fill: string = 'white'
  ): void {
    try {
      const c = new Colors(fill);

      this.x = posX;
      this.y = posY;
      Object.assign(this.#fig.style, {
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        borderColor: c.isColor(stroke),
        background: c.isColor(fill),
        borderWidth: strokeWidth,
        borderStyle: strokeWidth > 0 ? 'solid' : 'none'
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
        const safeProps = props as {
          width?: number;
          height?: number;
          x?: number;
          y?: number;
          stroke?: string;
          'stroke-width'?: number;
          selectable?: boolean;
          fill?: string;
        };
        const propsA = Object.entries(safeProps);

        for (let i = 0; i < propsA.length; i++) {
          const [k, v] = propsA[i];
          (k == 'width' ||
            k == 'height' ||
            k == 'stroke' ||
            k == 'stroke-width' ||
            k == 'selectable') &&
            super.attrs({ [k]: v });
        }

        // Set canvas parameters
        this.#setCanvasParams(
          safeProps.x ?? this.x,
          safeProps.y ?? this.y,
          safeProps.stroke ?? 'rgb(0,0,0)',
          safeProps['stroke-width'] ?? 1,
          safeProps.fill
        );
      }

      let attrValue:
        | void
        | (string | number | undefined)[]
        | (string | number | undefined) = [];
      // updated code

      if (typeof props === 'string' && props.length >= 1) {
        const arg = props.trim().split(' ');

        for (let i = 0; i < arg.length; i++) {
          const e = arg[i].trim();
          if (e !== '') {
            if (e === 'x' || e === 'y') {
              const index = arg.indexOf(e);
              attrValue[index] === undefined &&
                (attrValue[index] = this[e as 'x' | 'y'] as number);
              continue;
            }

            const r = super.attrs(e);
            attrValue[i] =
              typeof r === 'string' || typeof r === 'number' ? r : undefined;
          }
        }
      }

      if (Array.isArray(attrValue)) {
        return attrValue.length > 1 ? attrValue : attrValue[0];
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }
}

/*
  #addControls() {
    // ---------- RECTANGULAR CONTROLS ----------
    const controlPathRect = new Rect(0, 0, 0, 0, {
      id: `${this.#style && this.#style.id}pathrect`
    });
    this.addTo(controlPathRect, false);

    const controlGRRect = new Group(
      `${this.#style && this.#style.id}controls`
    );
    this.addTo(controlGRRect, false);

    const controlThreadGRRect = new Group(
      `${this.#style && this.#style.id}thread`
    );
    this.addTo(controlThreadGRRect, false);

    controlThreadGRRect.add(controlPathRect);

    const lineRect = new Line(0, 0, 0, 0, {
      id: `${this.#style && this.#style.id}connector`
    });
    this.addTo(lineRect, false);

    controlGRRect.add(controlThreadGroupRect, lineRect);

    for (let index = 0; index < 9; index++) {
      const rect = new Rect(0, 0, 0, 0, {
        id: `${this.#style && this.#style.id}control${index}`
      });
      this.addTo(rect, false);
      controlGRRect.add(rect);
    }

    // ---------- CIRCULAR CONTROLS ----------
    const controlPathCircle = new Rect(0, 0, 0, 0, {
      id: `${this.#style && this.#style.id}pathcircle`
    });
    this.addTo(controlPathCircle, false);

    const controlGRCircle = new Group(
      `${this.#style && this.#style.id}controlscircle`
    );
    this.addTo(controlGRCircle, false);

    const controlThreadGRCircle = new Group(
      `${this.#style && this.#style.id}threadcircle`
    );
    this.addTo(controlThreadGRCircle, false);

    controlThreadGRCircle.add(controlPathCircle);

    const lineCircle = new Line(0, 0, 0, 0, {
      id: `${this.#style && this.#style.id}connectorcircle`
    });
    this.addTo(lineCircle, false);

    controlGRCircle.add(controlThreadGroupCircle, lineCircle);

    for (let index = 0; index < 9; index++) {
      const circle = new Circle(0, 0, 0, {
        id: `${this.#style && this.#style.id}controlcircle${index}`
      });
      this.addTo(circle, false);
      controlGRCircle.add(circle);
    }
  }

}
*/
