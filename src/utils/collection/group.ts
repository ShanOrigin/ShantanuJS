/*
 import { GSVGElements, randerer } from '../../core/svg/svgManager/svg.js';
 import { multipleClass } from '../../utils/transformations/Transformations.js';


 import {
   GraphicalElementProperties,
   CommonGeometricProperties,
   AllGShapeStyleProperties
 } from '../../properties/provider/shapeProperties.js';                                                    



 import {
   IGraphicalElementProperties,
   StyleForGShapeTag
 } from '../../properties/provider/shapeProperties';                                                      

 import {
    checkParent,
   isValidMatrix,
   validProps,
   parameterTypeValidator,
   autoFixGeometry,                                                                                       
   animationChecks,                                                                                       
   computeBBox,
   restore,
   getTransformationMatrix                                                                               
 } from '../../utils/healpers/healpers.js';

 import { SAnimation } from '../../utils/animations/Animation.js';

 type propsType = Partial<IGraphicalElementProperties['text']> &
   Partial<StyleForGShapeTag<'text'>>;

 type transformCommonProps = {
   type?: string;
   px?: number;
   py?: number;
   isEffect?: boolean;                                                                                  
 };
*/

import { NonGraphicalElement as NG } from '../../core/graphics/graphics/nonGraphicalElement.js';
import { GraphicalElement as G } from '../../core/graphics/graphics/graphicalElement.js';
//import { GraphicalElementComposer as GEC } from '../../core/graphics/graphics/graphicalElementComposer.js';

import {
  Shape,
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../shapes/baseShape/Shape.js';

import type {
  IGraphicalElementProperties,
  StyleForGShapeTag,
  INonGraphicalElementProperties
} from '../../properties/provider/shapeProperties';

import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

import {
  //  assignBBoxMatrix,
  //  trackTransformation,
  checkParent,
  isValidMatrix,
  validProps
} from '../providers/utils.js';
import { cmath } from '../../webAsm/interface/TS/CMATH_Interface.js';

type propsType = Partial<IGraphicalElementProperties['g']> &
  Partial<StyleForGShapeTag<'g'>>;

import type {
  iPoint,
  iLine,
  iPolyline,
  iRect,
  iPolygon,
  iEllipse,
  iCircle,
  iPath
} from '../../shapes/provider/shapesTypes';
type shapeT =
  | iPoint
  | iLine
  | iPolyline
  | iRect
  | iPolygon
  | iEllipse
  | iCircle
  | iPath;

type IG = keyof IGraphicalElementProperties;
type ING = keyof INonGraphicalElementProperties;

type GE = G<IG, IG>;
export type AllowedFig = NG<ING> | GE;

type dimMObj = {
  [key: string]: {
    matrix: {
      len: number;
      start: number;
      end: number;
      totalmat: number;
    };
  };
};

type dimOObj = {
  [key: string]: {
    Obbox: {
      len: number;
      start: number;
      end: number;
      totalmat: number;
    };
  };
};

export class Group extends Shape<'g', 'g'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS);
  #style = this.getIStyle(DEV_INTERNAL_ACCESS);
  #groupElements: Array<AllowedFig> = [];

  #batches: Record<string, Array<AllowedFig>> = {};

  constructor(id: string) {
    super('g', id, 'g');
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'g'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Group {
    checkParent(this.#fig, 'text');

    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0 } = this.#geometry;

      const nextCopies = copies + 1;
      let id = '';
      const style = { ...this.#style } as StyleForGShapeTag<'g'>;
      if ('id' in style && style.id !== '') {
        id = `${style.id}-c${nextCopies}`;
      }

      this.#geometry['copies'] = nextCopies;

      const cg = new Group(id);
      this.#groupElements.forEach((e) => {
        cg.add((e as shapeT).clone(offsetX, offsetY));
      });

      return cg;
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  public getBatches() {
    return this.#batches;
  }
  #checkParent(svgCanvas: SVGSVGElement | null) {
    if (!(svgCanvas instanceof SVGSVGElement)) {
      throw new Error(
        'Possibly this Group is not added to the canvas. Please use canvas.addTo() to add this Group.'
      );
    }
  }

  #addChild(child: AllowedFig) {
    return Boolean(
      (child instanceof G || child instanceof NG) &&
        this.#fig.appendChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #addTo(parent: SVGSVGElement | SVGGElement, node: AllowedFig) {
    const p = parent instanceof SVGSVGElement || parent instanceof SVGGElement;

    return Boolean(
      p &&
        (node instanceof G || node instanceof NG) &&
        parent.appendChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #removeChild(child: AllowedFig) {
    return Boolean(
      (child instanceof G || child instanceof NG) &&
        this.#fig.removeChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  #removeTo(node: AllowedFig) {
    return Boolean(
      (node instanceof G || node instanceof NG) &&
        node
          .getIFig(DEV_INTERNAL_ACCESS)
          .parentNode?.removeChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  public allBatch() {
    return this.#flattenBatchAndGroups(this);
  }

  #flattenBatchAndGroups(batch: Group): Record<string, Array<AllowedFig>> {
    const result: Record<string, Array<AllowedFig>> = {};

    function collectShapes(source: Group) {
      for (const key in source.#batches) {
        if (key === 'g') {
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(...source.#batches[key]);
          for (const group of source.#batches.g) {
            collectShapes(group as Group);
          }
        } else {
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(...source.#batches[key]);
        }
      }
    }

    collectShapes(batch);

    return result;
  }

  /*
	 *
  public applyBatchTransformation(tran: string) {
    console.time('flattenBatches');
    const batches = this.#flattenBatchAndGroups(this);
    //   console.log('batches ->', batches);
    console.timeEnd('flattenBatches');
    const dimM: dimMObj = {};
    const dimO: dimOObj = {};

    const rowSize = 3;
    const matrixs = Object.entries(batches);
    const mBatch = [];
    const oBatch = [];
    let [mi, oi] = [0, 0];

   let totalLenS = 0 , totalLenO = 0 ;

   for (let i = 0; i < matrixs.length; i++) {
   	const shape = matrixs[i];
		switch(shape[0]){

    case "dot" :{
      totalLenS += shape[1].length * 1 ;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}
    case "line" :{
      totalLenS += shape[1].length * 2	 ;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}
    case "rect" :{
      totalLenS += shape[1].length * 4 ;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}
    case "circle" :{
      totalLenS += shape[1].length * 2;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}

    case "ellipse" :{
      totalLenS += shape[1].length * 3 ;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}

    case "polygon" :{
let s = 0 ;

			if(shape[1].length == 1 ){
       s = (shape[1][0] as GE).geometry?.matrix?.length ?? 0  ; 

			}

      totalLenS += shape[1].length * s  ;
			totalLenO += shape[1].length * 4 ;
		 break ;
		}




		}
   	
   }



    console.time('creatingBig2Nx3matrix');
    for (let i = 0; i < matrixs.length; i++) {
      const [k, el] = matrixs[i];

      if (!(k in dimM) && !(k in dimO)) {
        dimM[k] = {
          matrix: { len: 0, start: mi, end: 0, totalmat: el.length }
        };
        dimO[k] = {
          Obbox: { len: 4, start: oi, end: 0, totalmat: el.length }
        };
        dimM[k].matrix.start = mi;
        dimO[k].Obbox.start = oi;
      }

      for (let l = 0; l < el.length; l++) {
        const e = el[l];
        if (e instanceof GSVGElements) {
          let mat, omat;
          if (e.geometry.matrix) mat = e.geometry.matrix;
          else {
            assignBBoxMatrix(e.geometry, e.getBBox.bind(e), 'matrix');
            mat = e.geometry.matrix;
          }
          if (e.geometry.Obbox) omat = e.geometry.Obbox;
          else {
            assignBBoxMatrix(e.geometry, e.getBBox.bind(e));
            omat = e.geometry.Obbox;
          }

          const [mlen, olen] = [mat.length, omat.length];

          if (isValidMatrix(mat, mlen, rowSize)) {
            for (let j = 0; j < mlen; j++) {
              const row = mat[j];

              mBatch.push(row);
              mi += rowSize;
            }
          }
          if (isValidMatrix(omat, olen, rowSize)) {
            for (let j = 0; j < olen; j++) {
              const row = omat[j];

              oBatch.push(row);
              oi += rowSize;
            }
          }

          if (k in dimM && k in dimO) {
            dimM[k].matrix.len = mlen;
            dimM[k].matrix.end = mi;
            dimO[k].Obbox.end = oi;
          }
        }
      }
    }

    console.timeEnd('creatingBig2Nx3matrix');
    //   console.log('going to batching -> ', mBatch, oBatch, dimM, dimO);
    //    console.log('-> ', this.#geometry && this.#geometry.TList);

    console.time('getTmatAndConvertInToDommatrix');
    const g = this.#geometry,
      tl = this.#geometry?.TList;

    if (g && tl) {
      console.warn('mBatch size : ', mBatch.length, ' x 3');
      console.warn('oBatch size : ', oBatch.length, ' x 3');

      const lT = tl?.[tl.length - 1]?.TMatrix as Float32Array;

      //   console.log('lT -> ', lT);
      const tmat = cmath.createDomMatrix(lT);
      console.timeEnd('getTmatAndConvertInToDommatrix');
      //    console.log('T mat ->', tmat);
      const data =  new Float32Array([-1,0,0 ]);

      console.time('multipyShapeMatrixByWenASM');
      const nmBatch = cmath.batchProcess(tmat, mBatch ,data );
      console.timeEnd('multipyShapeMatrixByWenASM');
      console.time('multipyOrintationMatrixByWenASM');
      const noBatch = cmath.batchProcess(tmat, oBatch , data );
      //   console.log(' coming from batching ->  ', nmBatch, noBatch);
      console.timeEnd('multipyOrintationMatrixByWenASM');
      if (!nmBatch || !noBatch) throw new Error('nmBatch or noBatch not valid');

      const rowSize = 3;
      //    console.warn('Total matrixes ', matrixs);
      console.time('sliceansassinging');
      for (let ife = 0, ile = matrixs.length - 1; ife <= ile; ife++, ile--) {
        {
          //         console.error('by forward  ');
          const [k, v] = matrixs[ife];
          let { start: sm, end: em, len: lm } = dimM[k].matrix;
          let { start: so, end: eo, len: lo } = dimO[k].Obbox;

          let mLast = lm * rowSize;
          let oLast = lo * rowSize;

          for (let j = 0; j < v.length; j++) {


            if (
              matrixs[ife] &&
              v[j] instanceof GSVGElements &&
              'geometry' in (v[j] as GE) &&
              sm >= 0 &&
              so >= 0 &&
              mLast <= em &&
              oLast <= eo
            ) {
              const e = (v[j] as GE).geometry;

              if (
                e?.matrix &&
                (e?.shape == 'polyline' || e?.shape == 'polygon')
              ) {
                lm = e?.matrix?.length;
                mLast = lm * rowSize;
              }

              const geom = (v[j] as GE).geometry;
              if (geom) {
                geom.matrix = matrix.createMatrix(
                  nmBatch.subarray(sm, sm + mLast),
                  lm
                );

                geom.Obbox = matrix.createMatrix(
                  noBatch.subarray(so, so + oLast),
                  lo
                );

                sm += mLast;
                so += oLast;
                //       mLast += mLast;
                //       oLast += oLast;
              }
            }
          }
        }

        if (ife == ile) {
          break;
        }

        {
          //         console.error('by backward ');

          const [k, v] = matrixs[ile];
          let { start: sm, end: em, len: lm } = dimM[k].matrix;
          let { start: so, end: eo, len: lo } = dimO[k].Obbox;

          let mLast = lm * rowSize;
          let oLast = lo * rowSize;


          for (let j = 0; j < v.length; j++) {
            if (
              matrixs[ile] &&
              v[j] instanceof GSVGElements &&
              'geometry' in (v[j] as GE) &&
              sm >= 0 &&
              so >= 0 &&
              mLast <= em &&
              oLast <= eo
            ) {


              const e = (v[j] as GE).geometry;

              if (
                e?.matrix &&
                (e?.shape == 'polyline' || e?.shape == 'polygon')
              ) {
                lm = e?.matrix?.length;

                mLast = lm * rowSize;

              }

              const geom = (v[j] as GE).geometry;
              if (geom) {
                geom.matrix = matrix.createMatrix(
                  nmBatch.subarray(sm, sm + mLast),
                  lm
                );

                geom.Obbox = matrix.createMatrix(
                  noBatch.subarray(so, so + oLast),
                  lo
                );

                sm += mLast;
                so += oLast;
                //        mLast += mLast;
                //       oLast += oLast;
              }
            }
          }
        }
      }

      console.timeEnd('sliceansassinging');

      console.time('pathRebuiltRestoredim');
      for (let i = 0; i < matrixs.length; i++) {
        const elements = matrixs[i];
        const len = elements[1].length;
        //    console.log(elements[0], 'for restore ', elements);
        if (len == 1) {
          (elements[1][0] as shapeT).restore(lT, tran, 'pivot', true);
          continue;
        } else if (len == 2) {
          //        console.log(elements);
          (elements[1][0] as shapeT).restore(lT, tran, 'pivot', true);
          (elements[1][1] as shapeT).restore(lT, tran, 'pivot', true);
          //        console.log('finishe');
          continue;
        } else if (len >= 3) {
          for (let j = 0; j < len; j++) {
            const element = elements[1][j];

            (element as shapeT).restore(lT, tran, 'pivot', true);
          }
        }
      }
      console.timeEnd('pathRebuiltRestoredim');
    }
  }
*/

  public add(...shapes: AllowedFig[]): this | undefined {
    try {
      const svgCanvas = this.#fig.ownerSVGElement;
      this.#checkParent(svgCanvas);

      for (let index = 0; index < shapes.length; index++) {
        const element: AllowedFig = shapes[index];

        if (!element.getIFig(DEV_INTERNAL_ACCESS)) {
          throw new Error(
            'Possibly this SVG Element deleted already from Canvas Check again'
          );
        }

        const isElmentDirectChildOfCanvas =
          (
            element.getIFig(DEV_INTERNAL_ACCESS).parentNode as HTMLElement
          ).getAttribute('id') === (svgCanvas && svgCanvas.getAttribute('id'));

        const eG = element instanceof G && element?.geometry?.shape;
        const eNG = element instanceof NG && element?.attributes?.tag;
        const shape = eG || eNG;

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
        shape && (this.#batches[shape] ??= []).push(element);
      }

      return this;
    } catch (e) {
      throw e;
    }
  }

  public remove(...shapes: AllowedFig[]): this | undefined {
    try {
      const svgCanvas = this.#fig.ownerSVGElement;
      this.#checkParent(svgCanvas);

      for (let index = 0; index < shapes.length; index++) {
        const element: AllowedFig = shapes[index];

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
        const isInstanceOfG = element instanceof G;
        const isInstanceOfNG = element instanceof NG;

        //console.log('this.#groupElements length ', this.#groupElements.length);
        for (let index = 0; index < this.#groupElements.length; index++) {
          const e = this.#groupElements[index];

          //console.log('element = ', e, '\n');
          const isGraphicalMatch =
            isInstanceOfG &&
            e instanceof G &&
            element.style &&
            e.style &&
            element.style.id === e.style.id;

          const isNonGraphicalMatch =
            isInstanceOfNG &&
            e instanceof NG &&
            element.attributes &&
            e.attributes &&
            element.attributes.id === e.attributes.id;

          if (isGraphicalMatch || isNonGraphicalMatch) {
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

      this.#checkParent(svgCanvas);

      for (let index = 0; index < this.#groupElements.length; index++) {
        const element = this.#groupElements[index];
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

  #preChecks() {
    checkParent(this.#fig, 'Group');
    return true;
  }

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

  protected override restoreDimension(
    accessKeys: symbol,
    temporaryState: Float32Array,
    basic?: boolean
  ): void {
    assertAccess(accessKeys);
  }
}
