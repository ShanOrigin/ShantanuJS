import {
  AllGShapeStyleProperties,
  CommonGeometricProperties,
  GraphicalElementProperties
} from '../../../properties/provider/shapeProperties.js';

import { assertAccess } from '../../../utils/providers/accesskeys.js';

import {
  checkParent,
  Colors,
  generateId
} from '../../../utils/providers/utils.js';

import type {
  ICommonGeometricProperties,
  IGraphicalElementProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag
} from '../../../properties/provider/shapeProperties';

import type {
  getAttrsMethodsReturnTypes,
  attrsMethodReturnTypes,
  transformStack
} from '../../../types/index';

import {
  SVG_CONTEXT,
  createSVGContext,
  setSVGAttrs
} from '../backends/svg/core/core.js';
import { Renderer } from '../renderer/renderer.js';

import type { CONTEXT, DeepReadonly } from '../../../types/graphicsElements';

// unused by this file
export type GShpesTages = keyof IGraphicalElementProperties;

export type ValidKeys = Extract<
  keyof IGraphicalElementProperties,
  keyof TagToGShapeStyleKeyMap
>;

export abstract class GraphicalElement<T extends ValidKeys> {
  // in future #fig may hold HTMLCanvasElement , WebGl Elements
  #fig!: SVGElement;
  // int future #context may hold SVG_CONTEXT , 'htmlcanvas' , 'webgl' contexts
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
    // context would be SVG_CONTEXT right now but in future it may be 'htmlcanvas' or in very long future 'webgl'
    try {
      this.#geometry as {
        transformStack: transformStack;
        shape: string;
      };
      if (!this.#geometry) {
        throw new Error('Geometry not initialized ');
      }

      const id = generateId(ID);

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      //  This code may change According to context
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // Only canvas of that perticular context will be created no any other elements of any contexts

      if (context && context == SVG_CONTEXT && shapeName == 'canvas') {
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

      this.#geometry.transformStack = {
        stack: [
          {
            transformName: 'composed',
            transformType: 'all',
            transformMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
          }
        ],
        skip: 0
      };

      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++ Proxy Creation +++++++++++++++++++

      this.geometry = this.#createReadonlyProxy(this.#geometry as object);
      this.style = this.#createReadonlyProxy(
        this.#style as object
      ) as StyleForGShapeTag<T>;
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
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

  public getIContext() {
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
        'id should be constant , you can set id only when you are instanceting a shape'
      );

    if (prop == 'd' && shape != 'path')
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

  #setAttrs(prop: { [key: string]: string | number }): void {
    try {
      if (!this.#geometry) return;

      if (typeof prop !== 'object' || Object.keys(prop).length == 0) return;
      let [key, value] = Object.entries(prop)[0];

      if (this.#isGeometricProp(key)) {
        (this.#geometry as Record<string, string | number>)[key] = value;

        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
        //  This code may change According to context
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++

        if (this.#context == SVG_CONTEXT) {
          setSVGAttrs(this.#fig, key, value);
        }
      }

      if (typeof this.#style == 'object' && this.#isStyleProp(key)) {
        (this.#style as Record<string, string | number>)[key] = value;

        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
        //  This code may change According to context
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++

        if (this.#context == SVG_CONTEXT) {
          setSVGAttrs(this.#fig, key, value);
        }
      }
    } catch (e) {
      throw e;
    }
  }

  #getAttr(key: string): getAttrsMethodsReturnTypes {
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
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
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
          this.#setAttrs({ [key]: value });
        }

        // +++ Setter Part End +++
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++

        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
        // +++ Getter Part Starts +++
      } else if (typeof props === 'string') {
        const result: getAttrsMethodsReturnTypes[] = props.trim().split(' ');

        if (result.length > 1) {
          for (let f = 0, l = result.length - 1; f <= l; f++, l--) {
            if (f == l) {
              result[f] = this.#getAttr((result[f] as string).trim());
              break;
            }
            result[f] = this.#getAttr((result[f] as string).trim());
            result[l] = this.#getAttr((result[l] as string).trim());
          }

          return result.length > 1 ? result : result[0];
        }
        return this.#getAttr((result[0] as string).trim());
        // +++ Getter Part End +++
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      }
    } catch (e) {
      throw e;
    }
  }

  public hide(): void {
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    // This code may change According to context
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    try {
      const context = this.getIContext();
      if (context == SVG_CONTEXT) {
        checkParent(this.#fig, context);
        this.setAttrs({ visibility: 'hidden' });
      }
    } catch (e) {
      throw e;
    }
  }

  public show(): void {
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    // This code may change According to context
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    try {
      const context = this.getIContext();
      if (context == SVG_CONTEXT) {
        checkParent(this.#fig, context);
        this.setAttrs({ visibility: 'visible' });
      }
    } catch (e) {
      throw e;
    }
  }

  public toFront(near: number = 0): void {
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    // This code may change According to context
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    try {
      const context = this.getIContext();
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // This is applicable for both 'svg' 'html' Context
      // implement proper re-ordering canvas Array of element according to Front operation
      // create proper callback or notification system to request re ordering or like function or mathod passing .
      // so toFront() method can modify canvas array .
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++
      if (context == SVG_CONTEXT) {
        checkParent(this.#fig, context);
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
      }
    } catch (e) {
      throw e;
    }
  }

  public toBack(far: number = 0): void {
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    // This code may change According to context
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++
    try {
      const context = this.getIContext();
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++
      // This is applicable for both 'svg' 'html' Context
      // implement proper re-ordering canvas Array of element according to Back operation
      // create proper callback or notification system to request re ordering or like function or mathod passing .
      // so toFront() method can modify canvas array .
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++
      if (context == SVG_CONTEXT) {
        checkParent(this.#fig, context);
        if (!this.#fig || !this.#fig.parentNode) return;

        const val = Math.abs(far);

        // If far is 0, just move to the back (first child)
        if (val === 0) {
          const firstChild = this.#fig.parentNode.firstChild;
          firstChild &&
            this.#fig.parentNode.insertBefore(this.#fig, firstChild);

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
      }
    } catch (e) {
      throw e;
    }
  }
}
