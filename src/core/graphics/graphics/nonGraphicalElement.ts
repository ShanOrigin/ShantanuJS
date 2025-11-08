import { NonGraphicalElementProperties } from '../../../properties/provider/shapeProperties.js';

import { GraphicalElementComposer } from './graphicalElementComposer.js';

import {
  assertAccess,
  DEV_INTERNAL_ACCESS
} from '../../../utils/providers/accesskeys.js';
import { createSVGElement } from '../../../utils/providers/utils.js';

import type {
  INonGraphicalElementProperties,
  IGraphicalElementProperties
} from '../../../properties/provider/shapeProperties';

type elementType =
  | GraphicalElementComposer<
      keyof IGraphicalElementProperties,
      keyof IGraphicalElementProperties
    >
  | NonGraphicalElement<keyof INonGraphicalElementProperties>;

export abstract class NonGraphicalElement<
  T extends keyof INonGraphicalElementProperties
> {
  public attributes!: INonGraphicalElementProperties[T] & {
    tag: string;
    id: string;
    roleOfSVG: string;
    inside: string;
  };

  #fig!: SVGElement;

  #attributes!: INonGraphicalElementProperties[T] & {
    tag: string;
    id: string;
    roleOfSVG: string;
    inside: string;
  };

  // #SVGSRC = 'http://www.w3.org/2000/svg';

  constructor(tagName: T, ID: string = '') {
    try {
      // Now it's safe

      const name = this.#generateId(ID);

      Object.defineProperty(this.#attributes, 'tag', {
        value: tagName,
        writable: false,
        configurable: false,
        enumerable: true
      });

      Object.defineProperty(this.#attributes, 'id', {
        value: name,
        writable: false,
        configurable: false,
        enumerable: true
      });

      //	 this.#fig = document.createElementNS(this.#SVGSRC, tagName) as SVGElement;

      this.#fig = createSVGElement(tagName);

      this.attributes = this.#createReadonlyProxy(
        this.#attributes as object
      ) as INonGraphicalElementProperties[T] & {
        tag: string;
        id: string;
        roleOfSVG: string;
        inside: string;
      };
    } catch (e) {
      throw e;
    }
  }

  public getIFig(accesskey: symbol) {
    assertAccess(accesskey);
    return this.#fig;
  }

  public getIAttr(accesskey: symbol) {
    assertAccess(accesskey);
    return this.#attributes;
  }

  #createReadonlyProxy<T extends object>(obj: T): T {
    const cache = new WeakMap<object, any>();

    const isTypedArray = (value: any): boolean => {
      return (
        ArrayBuffer.isView(value) && !(value instanceof DataView) // we still allow DataView if needed
      );
    };

    const wrap = (target: any): any => {
      // Primitive or typed array — skip wrapping
      if (
        target === null ||
        typeof target !== 'object' ||
        isTypedArray(target)
      ) {
        return target;
      }

      if (cache.has(target)) return cache.get(target);

      const proxy = new Proxy(target, {
        get(t, prop, receiver) {
          const value = Reflect.get(t, prop, receiver);
          return typeof value === 'object' && value !== null
            ? wrap(value) // lazily wrap on access
            : value;
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
        },

        ownKeys(target) {
          return Reflect.ownKeys(target);
        },

        getOwnPropertyDescriptor(target, prop) {
          const desc = Reflect.getOwnPropertyDescriptor(target, prop);
          if (desc) {
            desc.writable = false;
            desc.configurable = false;
          }
          return desc;
        }
      });

      cache.set(target, proxy);
      return proxy;
    };

    return wrap(obj);
  }

  #generateId(userId?: string): string {
    try {
      if (userId && userId.trim() !== '') return userId;

      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      }
      // Fallback
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const fallback = Array.from(
        { length: 16 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');

      return fallback;
    } catch (e) {
      throw e;
    }
  }

  /*
   *private function for checking property is geometric type or not
   */
  #isGeometricProp(prop: string | undefined): boolean {
    try {
      const attributes = this.#attributes;

      if (
        typeof attributes === 'object' &&
        attributes !== null &&
        'tag' in attributes &&
        prop &&
        (attributes as { tag: keyof INonGraphicalElementProperties }).tag in
          NonGraphicalElementProperties &&
        prop in
          NonGraphicalElementProperties[
            (attributes as { tag: keyof INonGraphicalElementProperties }).tag
          ]
      ) {
        return true;
      }

      return false;
    } catch (e) {
      throw e;
    }
  }

  /*
   *function for setting attributes for properties of element also attributes and also style
   */

  protected setAttrs(prop: { [key: string]: string | number }): void {
    try {
      if (typeof prop !== 'object' || Object.keys(prop).length == 0) return;
      let [key, value] = Object.entries(prop)[0];

      this.#attributes &&
        this.#isGeometricProp(key) &&
        (((this.#attributes as Record<string, string | number>)[key] = value),
        this.#fig.tagName == 'svg' &&
          this.#fig.setAttribute(key, String(value)));
    } catch (e) {
      throw e;
    }
  }

  /*
   *private function for getting attribute for property of svg element
   */

  protected getAttr(key: string): string | number | undefined {
    try {
      return (
        (key == '' && undefined) ||
        (this.#attributes &&
          key in this.#attributes &&
          (this.#attributes as Record<string, string | number>)[key]) ||
        (this.#fig.getAttribute(key) !== null
          ? this.#fig.getAttribute(key) ?? undefined
          : undefined)
      );
    } catch (e) {
      throw e;
    }
  }

  /*
   *public method for getting attribute and setting attribute
   */
  public attrs(
    props: Object | string
  ): void | (string | number | undefined)[] | (string | number | undefined) {
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
        const result: (string | number | undefined)[] = props.trim().split(' ');
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

  #checkNode(node: elementType): boolean {
    return (
      node instanceof GraphicalElementComposer ||
      node instanceof NonGraphicalElement
    );
  }
  public addChild(child: elementType) {
    return Boolean(
      this.#checkNode(child) &&
        this.#fig.appendChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  public addToParent(parent: elementType) {
    return Boolean(
      this.#checkNode(parent) &&
        parent.getIFig(DEV_INTERNAL_ACCESS).appendChild(this.#fig)
    );
  }

  public addTo(parent: SVGSVGElement | SVGGElement, node: elementType) {
    const p = parent instanceof SVGSVGElement || parent instanceof SVGGElement;

    return Boolean(
      p &&
        this.#checkNode(node) &&
        parent.appendChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  public removeChild(child: elementType) {
    return Boolean(
      this.#checkNode(child) &&
        this.#fig.removeChild(child.getIFig(DEV_INTERNAL_ACCESS))
    );
  }

  public removeChildFrom(parent: elementType) {
    return Boolean(
      this.#checkNode(parent) &&
        parent.getIFig(DEV_INTERNAL_ACCESS).removeChild(this.#fig)
    );
  }

  public removeTo(node: elementType) {
    return Boolean(
      this.#checkNode(node) &&
        node
          .getIFig(DEV_INTERNAL_ACCESS)
          .parentNode?.removeChild(node.getIFig(DEV_INTERNAL_ACCESS))
    );
  }
}
