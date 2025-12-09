import {
  AllGShapeStyleProperties,
  CommonGeometricProperties,
  GraphicalElementProperties
} from '../../../properties/provider/shapeProperties.js';

import { assertAccess } from '../../../utils/providers/accesskeys.js';

import { Colors, generateId } from '../../../utils/providers/utils.js';

import type {
  ICommonGeometricProperties,
  IGraphicalElementProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag
} from '../../../properties/provider/shapeProperties';

import type {
  getAttrsMethodsReturnTypes,
  attrsMethodReturnTypes
} from '../../../types/index';

import { createSVGContext, setSVGAttrs } from '../backends/svg/core/core.js';
import { Renderer } from '../renderer/renderer';

export type GShpesTages = keyof IGraphicalElementProperties;

type ValidKeys = Extract<
  keyof IGraphicalElementProperties,
  keyof TagToGShapeStyleKeyMap
>;

type DeepReadonly<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R // functions stay as functions
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

type CONTEXT = 'svg' | null;
// In future CONTEXT would be 'svg' , 'htmlcanvas' , 'webgl'

export abstract class GraphicalElement<
  T extends ValidKeys,
  S extends CONTEXT = null
> {
  // in future #fig may hold HTMLCanvasElement , WebGl Elements
  #fig!: SVGElement;
  // int future #context may hold 'svg' , 'htmlcanvas' , 'webgl' contexts
  #context!: string;
  // in future #renderer may hold different Renderer according to contexts.
  #renderer!: Renderer;
  // #geometry is holding all Shape specific geometric properties and + some common properties

  #geometry: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T] = {};

  // #style is holding all html+css  style properties for a node
  #style: StyleForGShapeTag<T> = {} as StyleForGShapeTag<T>;

  public geometry!: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T]; //  = {};

  public style!: StyleForGShapeTag<T>; // as StyleForGShapeTag<T>;

  constructor(shapeName: T, context: CONTEXT = null, ID: string = '') {
    // context would be 'svg' right now but in future it may be 'htmlcanvas' or very long future 'webgl'
    try {
      const id = generateId(ID);
      // Handling SVG Context , only canvas of that context will be allowed to created no any other elements of any contexts
      if (context && context == 'svg' && shapeName == 'svg') {
        [this.#context, this.#fig, this.#renderer] = createSVGContext(
          context as string,
          shapeName as string
        );

        setSVGAttrs(this.#fig, 'id', id);
      }

      // private
      this.#geometry && (this.#geometry['shape'] = '');

      Object.defineProperty(this.#geometry, 'shape', {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true
      });

      GraphicalElement.prototype.attrs.call(this, {
        'stroke-width': 0.5,
        stroke: new Colors('rgb(0,0,0)').isColor(),
        fill: new Colors('none').isColor(),
        'vector-effect': 'non-scaling-stroke'
      });

      //setting id property of style or HTML constant

      Object.defineProperty(this.#style, 'id', {
        value: id,
        writable: false,
        configurable: false,
        enumerable: true
      });
      Object.defineProperty(this.#style, 'role-of-el', {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true
      });

      // +++++ Proxy Creation +++++

      this.geometry = this.#createReadonlyProxy(this.#geometry as object);
      this.style = this.#createReadonlyProxy(
        this.#style as object
      ) as StyleForGShapeTag<T>;
    } catch (e) {
      throw e;
    }
  }

  public setIContext(accessKey: symbol, context: string) {
    assertAccess(accessKey);
    return (this.#context = context);
  }
  public setIRenderer(accessKey: symbol, renderer: Renderer) {
    assertAccess(accessKey);
    this.#renderer = renderer;
  }

  public getIContext(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#context;
  }
  public getIRenderer(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#renderer;
  }

  public getIFig(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#fig;
  }

  public getIGeo(
    accessKey: symbol
  ): ICommonGeometricProperties['geometry'] & IGraphicalElementProperties[T] {
    assertAccess(accessKey);
    return this.#geometry;
  }

  public getIStyle(accessKey: symbol): StyleForGShapeTag<T> {
    assertAccess(accessKey);
    return this.#style;
  }

  #createReadonlyProxy<T extends object>(obj: T): DeepReadonly<T> {
    const wrap = (value: object): object => {
      return new Proxy(value, handler);
    };

    const handler: ProxyHandler<object> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (value !== null && typeof value === 'object') {
          return wrap(value);
        }

        return value;
      },

      set(_, prop) {
        throw new Error(
          `Cannot assign to read-only property "${String(prop)}"`
        );
      },

      deleteProperty(_, prop) {
        throw new Error(`Cannot delete read-only property "${String(prop)}"`);
      },

      defineProperty(_, prop) {
        throw new Error(`Cannot define read-only property "${String(prop)}"`);
      },

      setPrototypeOf() {
        throw new Error(`Cannot modify prototype of read-only object`);
      }
    };

    return new Proxy(obj, handler) as DeepReadonly<T>;
  }

  /*
   *private function for checking property is geometric type or not
   */
  #isGeometricProp(prop: string | undefined): boolean {
    try {
      if (!prop) return false;

      const shape = this.#geometry?.shape as
        | keyof typeof GraphicalElementProperties
        | undefined;

      //         prop in CommonGeometricProperties.geometry ||
      if (
        shape &&
        shape in GraphicalElementProperties &&
        prop in
          GraphicalElementProperties[shape as keyof IGraphicalElementProperties]
      ) {
        return true;
      } else if (prop in CommonGeometricProperties.geometry) {
        throw new Error(
          `${prop} property is ReadOnly System Cannot allow to reset it`
        );
      }
      return false;
    } catch (e) {
      throw e;
    }
  }

  /*
   *private function for checking properties style type or not
   */

  #isStyleProp(prop: string | undefined): boolean {
    //	 return prop ? Boolean(prop in CommonStyleProperties.style) : false;

    const shape = this.#geometry?.shape ?? 'path';

    if (!prop) return false;

    if (prop == 'id')
      throw new Error(
        'id should be constant , you can set id only when you are instanceting this shape or SVGElement'
      );

    if (prop == 'roleOfSVG' || (prop == 'd' && shape != 'path'))
      throw new Error(
        `${prop} should be constant  , System Cannot allow to reset it `
      );

    if (shape in AllGShapeStyleProperties) {
      return (
        prop in
        AllGShapeStyleProperties[shape as keyof typeof AllGShapeStyleProperties]
      );
    }

    return false;
  }

  /*
   *function for setting attributes for properties of element also geometry and also style
   */

  protected setAttrs(prop: { [key: string]: string | number }): void {
    try {
      if (!this.#geometry) return;

      if (typeof prop !== 'object' || Object.keys(prop).length == 0) return;
      let [key, value] = Object.entries(prop)[0];

      if (this.#isGeometricProp(key)) {
        (this.#geometry as Record<string, string | number>)[key] = value;

        // ----- This code might change in future according to contexts -----

        if (this.#context == 'svg') {
          setSVGAttrs(this.#fig, key, value);
        }
      }

      //+++++++++++++++++++++++++++++++++++++++++++++++++++
      if (typeof this.#style == 'object' && this.#isStyleProp(key)) {
        (this.#style as Record<string, string | number>)[key] = value;

        // ----- This code might change in future according to contexts -----

        if (this.#context == 'svg') {
          setSVGAttrs(this.#fig, key, value);
        }
      }
    } catch (e) {
      throw e;
    }
  }

  protected getAttr(key: string): getAttrsMethodsReturnTypes {
    try {
      if (!key) return undefined;

      // Style properties
      if (this.#style && key in this.#style) {
        return (this.#style as Record<string, string | number>)[key];
      }

      // Geometry properties
      if (this.#geometry && key in this.#geometry) {
        const value = (
          this.#geometry as Record<
            string,
            string | number | Float32Array | object
          >
        )[key];

        if (key === 'sharedBuffer') {
          // Copy Float32Array
          return (value as Float32Array).slice();
        } else if (key == 'transformStack') {
          // entire new copy no reference to original
          return Object.create(value as object);
        } else {
          return value;
        }
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }

  /*
   *public method for getting attribute and setting attribute
   */
  public attrs(props: Object | string): attrsMethodReturnTypes {
    try {
      // +++ Setter Part Starts +++
      if (
        (typeof props === 'object' && Object.keys(props).length === 0) ||
        (typeof props === 'string' && props.trim() === '')
      )
        // Guard clause for empty object or empty string
        return;

      if (typeof props === 'object') {
        const entries = Object.entries(props);
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          this.setAttrs({ [key]: value });
        }

        // +++ Setter Part End +++

        // +++ Getter Part Starts +++
      } else if (typeof props === 'string') {
        const result: getAttrsMethodsReturnTypes[] = props.trim().split(' ');

        if (result.length > 1) {
          for (let f = 0, l = result.length - 1; f <= l; f++, l--) {
            if (f == l) {
              result[f] = this.getAttr((result[f] as string).trim());
              break;
            }
            result[f] = this.getAttr((result[f] as string).trim());
            result[l] = this.getAttr((result[l] as string).trim());
          }

          return result.length > 1 ? result : result[0];
        }
        return this.getAttr((result[0] as string).trim());
        // +++ Getter Part End +++
      }
    } catch (e) {
      throw e;
    }
  }
}

/*
 OLD Implementation

 import {
  AllGShapeStyleProperties,
  CommonGeometricProperties,
  GraphicalElementProperties
} from '../../../properties/provider/shapeProperties.js';

import { assertAccess } from '../../../utils/providers/accesskeys.js';

import { Colors, generateId } from '../../../utils/providers/utils.js';
import { createSVGElement } from '../../../utils/providers/utils.js';
import type {
  ICommonGeometricProperties,
  IGraphicalElementProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag
} from '../../../properties/provider/shapeProperties';

import type {
  getAttrsMethodsReturnTypes,
  attrsMethodReturnTypes
} from '../../../types/index';
import type { Renderer } from '../renderer/renderer';

export type GShpesTages = keyof IGraphicalElementProperties;

type ValidKeys = Extract<
  keyof IGraphicalElementProperties,
  keyof TagToGShapeStyleKeyMap
>;

//P should be path only
export abstract class GraphicalElement<
  T extends ValidKeys,
  S extends GShpesTages = 'path'
> {
  #fig!: SVGElement; // | HTMLCanvasElement;
  #context!: string;
  #renderer!: Renderer;
  #geometry: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T] = {};

  //  public style: ICommonStyleProperties['style'] = {};
  #style: StyleForGShapeTag<T> = {} as StyleForGShapeTag<T>;

  public geometry: ICommonGeometricProperties['geometry'] &
    IGraphicalElementProperties[T] = {};

  public style: StyleForGShapeTag<T> = {} as StyleForGShapeTag<T>;
  // #SVGSRC = 'http://www.w3.org/2000/svg';

  constructor(shapeName: T, tagName?: S, ID: string = '') {
    try {
      // Now it's safe
      const actualTag = tagName ?? ('path' as S);

      this.#fig = createSVGElement(actualTag);

      // private
      this.#geometry && (this.#geometry['shape'] = '');

      Object.defineProperty(this.#geometry, 'shape', {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true
      });

      GraphicalElement.prototype.attrs.call(this, {
        'stroke-width': 0.5,
        stroke: new Colors('rgb(0,0,0)').isColor(),
        fill: new Colors('none').isColor(),
        'vector-effect': 'non-scaling-stroke'
      });

      //setting id property of style or HTML constant

      const id = generateId(ID);

      Object.defineProperty(this.#style, 'id', {
        value: id,
        writable: false,
        configurable: false,
        enumerable: true
      });
      Object.defineProperty(this.#style, 'role-of-el', {
        value: shapeName,
        writable: false,
        configurable: false,
        enumerable: true
      });
      //      this.fig.setAttribute('id', String(this.style?.id));
      this.#fig.setAttribute('id', String(id));
      this.#fig.setAttribute('role-of-el', String(shapeName));
      this.geometry = this.#createReadonlyProxy(this.#geometry as object);

      this.style = this.#createReadonlyProxy(
        this.#style as object
      ) as StyleForGShapeTag<T>;
    } catch (e) {
      throw e;
    }
  }

  public setIContext(accessKey: symbol, context: string) {
    assertAccess(accessKey);
    return (this.#context = context);
  }
  public setIRenderer(accessKey: symbol, renderer: Renderer) {
    assertAccess(accessKey);
    this.#renderer = renderer;
  }

  public getIContext(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#context;
  }
  public getIRenderer(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#renderer;
  }

  public getIFig(accessKey: symbol) {
    assertAccess(accessKey);
    return this.#fig;
  }

  public getIGeo(
    accessKey: symbol
  ): ICommonGeometricProperties['geometry'] & IGraphicalElementProperties[T] {
    assertAccess(accessKey);
    return this.#geometry;
  }

  public getIStyle(accessKey: symbol): StyleForGShapeTag<T> {
    assertAccess(accessKey);
    return this.#style;
  }

  #createReadonlyProxy<T extends object>(obj: T): T {
    const cache = new WeakMap<object, any>();
    const seen = new WeakSet<object>(); // prevent re-wrapping during deep get()

    const isTypedArray = (value: any): boolean => {
      return ArrayBuffer.isView(value) && !(value instanceof DataView);
    };

    const wrap = (target: any): any => {
      if (
        target === null ||
        typeof target !== 'object' ||
        isTypedArray(target)
      ) {
        return target;
      }

      if (cache.has(target)) return cache.get(target);
      if (seen.has(target)) return target;
      seen.add(target);

      const proxy = new Proxy(target, {
        get(t, prop, receiver) {
          try {
            const value = Reflect.get(t, prop, receiver);
            if (typeof value === 'object' && value !== null) {
              if (cache.has(value)) return cache.get(value);
              return wrap(value);
            }
            return value;
          } catch (err) {
            console.warn(`Readonly proxy get failed for ${String(prop)}:`, err);
            return undefined;
          }
        },

        set(_, prop) {
          throw new Error(
            `Cannot assign to read-only property "${String(prop)}"`
          );
        },

        deleteProperty(_, prop) {
          throw new Error(`Cannot delete read-only property "${String(prop)}"`);
        },

        defineProperty(_, prop) {
          throw new Error(`Cannot define read-only property "${String(prop)}"`);
        },

        setPrototypeOf() {
          throw new Error(`Cannot modify prototype of read-only object`);
        }
      });
      cache.set(target, proxy);
      return proxy;
    };

    return wrap(obj);
  }


  #isGeometricProp(prop: string | undefined): boolean {
    try {
      if (!prop) return false;

      const shape = this.#geometry?.shape as
        | keyof typeof GraphicalElementProperties
        | undefined;

      //         prop in CommonGeometricProperties.geometry ||
      if (
        shape &&
        shape in GraphicalElementProperties &&
        prop in
          GraphicalElementProperties[shape as keyof IGraphicalElementProperties]
      ) {
        return true;
      } else if (prop in CommonGeometricProperties.geometry) {
        throw new Error(
          `${prop} property is ReadOnly System Cannot allow to reset it`
        );
      }
      return false;
    } catch (e) {
      throw e;
    }
  }

  #isStyleProp(prop: string | undefined): boolean {
    //	 return prop ? Boolean(prop in CommonStyleProperties.style) : false;

    const shape = this.#geometry?.shape ?? 'path';

    if (!prop) return false;

    if (prop == 'id')
      throw new Error(
        'id should be constant , you can set id only when you are instanceting this shape or SVGElement'
      );

    if (prop == 'roleOfSVG' || (prop == 'd' && shape != 'path'))
      throw new Error(
        `${prop} should be constant  , System Cannot allow to reset it `
      );

    if (shape in AllGShapeStyleProperties) {
      return (
        prop in
        AllGShapeStyleProperties[shape as keyof typeof AllGShapeStyleProperties]
      );
    }

    return false;
  }

  protected setAttrs(prop: { [key: string]: string | number }): void {
    try {
      if (!this.#geometry) return;

      if (typeof prop !== 'object' || Object.keys(prop).length == 0) return;
      let [key, value] = Object.entries(prop)[0];

      if (this.#isGeometricProp(key)) {
        (this.#geometry as Record<string, string | number>)[key] = value;

      
      //  !(this.#fig.tagName == 'text' && key == 'text') &&
       //   this.#fig.setAttribute(key, String(value));
				
      //  this.#fig.tagName == 'svg' &&
      //    this.#fig.setAttribute(key, String(value));
				
      }

      //+++++++++ only text element specific code +++++++++
      this.#fig.tagName == 'text' &&
        key == 'text' &&
        (this.#fig.textContent = value.toString());
      //+++++++++++++++++++++++++++++++++++++++++++++++++++
      if (typeof this.#style == 'object' && this.#isStyleProp(key)) {
        (this.#style as Record<string, string | number>)[key] = value;

        // this.#fig.setAttribute(key, String(value));
      }
    } catch (e) {
      throw e;
    }
  }



  protected getAttr(key: string): getAttrsMethodsReturnTypes {
    try {
      if (!key) return undefined;

      // Style properties
      if (this.#style && key in this.#style) {
        return (this.#style as Record<string, string | number>)[key];
      }

      // Geometry properties
      if (this.#geometry && key in this.#geometry) {
        const value = (
          this.#geometry as Record<
            string,
            string | number | Float32Array[] | Float32Array
          >
        )[key];

        if (key === 'matrix' || key === 'Obbox') {
          // Deep copy array of Float32Arrays
          const src = value as Float32Array[];
          const copy = new Array<Float32Array>(src.length);
          for (let i = 0; i < src.length; i++) {
            copy[i] = new Float32Array(src[i]);
          }
          return copy;
        } else if (key === 'SharedBuffer') {
          // Copy Float32Array
          return (value as Float32Array).slice();
        } else {
          return value;
        }
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }


  public attrs(props: Object | string): attrsMethodReturnTypes {
    // Guard clause for empty object or empty string
    try {
      if (
        (typeof props === 'object' && Object.keys(props).length === 0) ||
        (typeof props === 'string' && props.trim() === '')
      )
        return;

      if (typeof props === 'object') {
        const entries = Object.entries(props);
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          this.setAttrs({ [key]: value });
        }
      } else if (typeof props === 'string') {
        //    const result: (string | number | undefined)[] = props.trim().split(' ');
        const result: getAttrsMethodsReturnTypes[] = props.trim().split(' ');

        if (result.length > 1) {
          for (let f = 0, l = result.length - 1; f <= l; f++, l--) {
            if (f == l) {
              result[f] = this.getAttr((result[f] as string).trim());
              break;
            }
            result[f] = this.getAttr((result[f] as string).trim());
            result[l] = this.getAttr((result[l] as string).trim());
          }

          return result.length > 1 ? result : result[0];
        }
        return this.getAttr((result[0] as string).trim());
      }
    } catch (e) {
      throw e;
    }
  }
}




	 */
