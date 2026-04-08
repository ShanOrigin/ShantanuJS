import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions,
  CommonGeometricProperties
} from '../../properties/provider/shapeProperties.js';

import {
  parameterTypeValidator,
  autoFixGeometry,
  validProps,
  isValidMatrix
} from '../../utils/provider/utils.js';

import type { rectStyleTypes, rectPropsType } from '../../types/shapes';
import type { iShape } from '../provider/shapesTypes';

type G = Group;

type AllowedFig = iShape & G;

export class Group extends GraphicsEntity<'g'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);
  #groupElements: Array<AllowedFig> = [];

  constructor(id: string) {
    super('g', id);
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'g'
    );
  }

  #hasParent(svgCanvas: SVGSVGElement | null) {
    if (!(svgCanvas instanceof SVGSVGElement)) {
      throw new Error(
        'Possibly this Group is not added to the canvas. Please use canvas.addTo() to add this Group.'
      );
    }
  }

  #addChild(child: AllowedFig) {
    return Boolean(
      child instanceof Group &&
        this.#fig.appendChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #addTo(parent: SVGSVGElement | SVGGElement, node: AllowedFig) {
    const p = parent instanceof SVGSVGElement || parent instanceof SVGGElement;

    return Boolean(
      p &&
        node instanceof Group &&
        parent.appendChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #removeChild(child: AllowedFig) {
    return Boolean(
      child instanceof Group &&
        this.#fig.removeChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #removeTo(node: AllowedFig) {
    return Boolean(
      node instanceof Group &&
        node
          .getIFig(DEV_INTERNAL_ACCESS)
          .parentNode?.removeChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  public add(...shapes: AllowedFig[]): this | undefined {
    try {
      const svgCanvas = this.#fig.ownerSVGElement;
      this.#hasParent(svgCanvas);

      for (let index = 0; index < shapes.length; index++) {
        const element = shapes[index] as AllowedFig;

        if (!element.getIFig(DEV_INTERNAL_ACCESS)) {
          throw new Error(
            'Possibly this SVG Element deleted already from Canvas Check again'
          );
        }

        const isElmentDirectChildOfCanvas =
          (
            element.getIFig(DEV_INTERNAL_ACCESS).parentNode as HTMLElement
          ).getAttribute('id') === (svgCanvas && svgCanvas.getAttribute('id'));

        const eG = element instanceof Group && element?.geometry?.shape;

        const shape = eG;

        if (
          !svgCanvas?.contains(element.getIFig(DEV_INTERNAL_ACCESS)) ||
          !isElmentDirectChildOfCanvas
        ) {
          throw new Error(
            `This Element is not Present in Canvas or deleted or it may be part of otber Group , if it is in Group first ungroup that element to add into this Group : element -> ${shape}`
          );
        }

        this.#removeTo(element) && this.#addChild(element);

        this.#groupElements.push(element);
        element.attrs({
          inside: `Group,${this.style?.id}`
        });

        /*
        element instanceof G && (shape = element.geometry?.shape);
        element instanceof NG && (shape = element.attributes?.tag);
				*/

        //   delete this.#geometry?.canonicalMatrix;
        //   delete this.#geometry?.obbox;
        //   assignBBoxMatrix(this.#geometry, this.getBBox.bind(this), 'both');
      }

      return this;
    } catch (e) {
      throw e;
    }
  }

  public remove(...shapes: AllowedFig[]): this | undefined {
    try {
      const svgCanvas = this.#fig.ownerSVGElement;
      this.#hasParent(svgCanvas);

      for (let index = 0; index < shapes.length; index++) {
        const element = shapes[index] as AllowedFig;

        if (!element.getIFig(DEV_INTERNAL_ACCESS)) {
          throw new Error(
            'Possibly this SVG Element deleted already from Canvas Check again'
          );
        }
        if (!svgCanvas?.contains(element.getIFig(DEV_INTERNAL_ACCESS))) {
          throw new Error('This Element is not Present in Canvas');
        }

        // Remove from group
        this.#removeChild(element);

        let removedElementIndex = -1;
        const isInstanceOfG = element instanceof Group;

        for (let index = 0; index < this.#groupElements.length; index++) {
          const e = this.#groupElements[index];

          const isGraphicalMatch =
            isInstanceOfG &&
            e instanceof Group &&
            element.style &&
            e.style &&
            element.style.id === e.style.id;

          if (isGraphicalMatch) {
            removedElementIndex = index;
            break;
          }
        }

        // Re-append to main SVG canvas
        this.#addTo(svgCanvas as SVGSVGElement, element);
        element.attrs({
          inside: `svg-${(svgCanvas as SVGSVGElement).getAttribute('id')}`
        });
        //console.log('index to remove =', removedElementIndex);
        //console.log(this.#fig);

        //    delete this.#geometry?.canonicalMatrix;
        //    delete this.#geometry?.obbox;
        //    assignBBoxMatrix(this.#geometry, this.getBBox.bind(this), 'both');
        this.#groupElements.splice(removedElementIndex, 1);
      }
      return this;
    } catch (e) {
      throw e;
    }
  }

  public ungroup(): void {
    try {
      const svgCanvas = this.#fig.ownerSVGElement;

      this.#hasParent(svgCanvas);

      for (let index = 0; index < this.#groupElements.length; index++) {
        const element = this.#groupElements[index] as AllowedFig;
        this.#removeChild(element);
        this.#addTo(svgCanvas as SVGSVGElement, element);
        element.attrs({
          inside: `svg-${(svgCanvas as SVGSVGElement).getAttribute('id')}`
        });
      }

      //      delete this.#geometry?.canonicalMatrix;
      //     delete this.#geometry?.obbox;
      this.#groupElements = [];

      ////console.log('All elements ungrouped and added back to canvas');
    } catch (e) {
      throw e;
    }
  }

  public getElements(): Array<AllowedFig> {
    try {
      return [...this.#groupElements];
    } catch (e) {
      throw e;
    }
  }

  /*
  public restore(
    tmat: Float32Array,
    tr: string,
    ttype: string,
    isEffect: true
  ) {
    //    this.#geometry && trackTransformation(this.#geometry, tr, ttype, tmat);
    //isEffect && this.#createPathFromMatrix();
    //isEffect && this.#restoreDimension();
  }
	*/

  protected override generateMatrix(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }

  protected override validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[]
  ): boolean {
    assertAccess(accessKeys);
    return isValidMatrix(matrix, 4, 3);
  }

  protected override restoreDimension(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }
}
