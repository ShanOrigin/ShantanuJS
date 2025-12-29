import {
  GraphicalElement,
  GShpesTages
} from '../graphics/graphicsElement/graphicsElement.js';
import { DEV_INTERNAL_ACCESS } from '../../utils/providers/accesskeys.js';

import { SVG_CONTEXT } from '../graphics/backends/svg/core/core.js';

//type SVGEventType = keyof SVGElementEventMap;

interface CustomEventOptions extends AddEventListenerOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

type SupportedEvents =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'mousemove'
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'mouseenter'
  | 'mouseleave';

export abstract class EventsSystem<
  T extends GShpesTages
> extends GraphicalElement<T> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #listener: {
    type: SupportedEvents;
    handler: EventListener;
    options?: CustomEventOptions;
    uid?: string;
  }[] = [];

  /**
   * Deep clone an array of objects so that changes to the copy
   * won't affect the original.
   *
   * ⚠️ Note: This won't preserve functions, Dates, Maps, Sets, or class instances.
   */
  public getAllEvents() {
    return JSON.parse(JSON.stringify(this.#listener));
  }

  public on<E extends Event>(
    eventType: SupportedEvents,
    callback: (e: E) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    if (eventType == ('drag' as SupportedEvents)) {
      console.warn(
        `drag event cannot beused by on() method is drag() seperate method provided on shape `
      );
    }
    if (typeof (this as any)[eventType] === 'function') {
      this.#addEvent(eventType as SupportedEvents, callback, props, uid);
    } else {
      console.warn(`Unsupported event type: ${eventType}`);
    }
  }

  public off(eventType: SupportedEvents, uid: string = 'default') {
    if (typeof (this as any)[`un${eventType}`] === 'function') {
      this.#removeEvent(eventType as SupportedEvents, uid);
    } else {
      console.warn(`Unsupported event type: ${eventType}`);
    }
  }

  #addEvent<E extends Event>(
    type: SupportedEvents,
    callback: (e: E) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ): void {
    const {
      preventDefault = false,
      stopPropagation = false,
      ...listenerOptions
    } = props;

    if (!this.#fig) return;

    const handler = (e: Event) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      callback(e as E);
    };

    const existing = this.#listener.find(
      (l) => l.type === type && l.uid === uid
    );

    if (this.getContext() == SVG_CONTEXT) {
      if (existing) {
        this.#fig.removeEventListener(
          existing.type,
          existing.handler,
          existing.options
        );
      }
      this.#listener = this.#listener.filter((l) => l.type !== type);

      this.#fig.addEventListener(type, handler, listenerOptions);
      this.#listener.push({ type, handler, options: props, uid });
    }
  }

  #removeEvent(type: SupportedEvents, uid: string = 'default'): void {
    if (this.#fig) {
      const existing = this.#listener.find(
        (l) => l.type === type && l.uid === uid
      );
      if (this.getContext() == SVG_CONTEXT) {
        if (existing) {
          this.#fig.removeEventListener(
            type,
            existing.handler,
            existing.options
          );
          this.#listener = this.#listener.filter(
            (l) => l.type !== type && l.uid === uid
          );
        }
      }
    }
  }

  public click(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('click', callback, props, uid);
  }

  public unclick(uid: string = 'default') {
    this.#removeEvent('click', uid);
  }

  public dblclick(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('dblclick', callback, props, uid);
  }

  public undblclick(uid: string = 'default') {
    this.#removeEvent('dblclick', uid);
  }

  public mouseDown(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('mousedown', callback, props, uid);
  }

  public unmouseDown(uid: string = 'default') {
    this.#removeEvent('mousedown', uid);
  }

  public mouseUp(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('mouseup', callback, props, uid);
  }

  public unmouseUp(uid: string = 'default') {
    this.#removeEvent('mouseup', uid);
  }

  public mouseMove(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('mousemove', callback, props, uid);
  }

  public unmouseMove(uid: string = 'default') {
    this.#removeEvent('mousemove', uid);
  }

  public touchStart(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('touchstart', callback, props, uid);
  }

  public untouchStart(uid: string = 'default') {
    this.#removeEvent('touchstart', uid);
  }

  public touchEnd(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('touchend', callback, props, uid);
  }

  public untouchEnd(uid: string = 'default') {
    this.#removeEvent('touchend', uid);
  }

  public touchMove(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('touchmove', callback, props, uid);
  }

  public untouchMove(uid: string = 'default') {
    this.#removeEvent('touchmove', uid);
  }

  public enterMouse(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('mouseenter', callback, props, uid);
  }

  public leaveMouse(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    uid: string = 'default'
  ) {
    this.#addEvent('mouseleave', callback, props, uid);
  }

  public unenterMouse(uid: string = 'default'): void {
    this.#removeEvent('mouseenter', uid);
  }

  public unleaveMouse(uid: string = 'default'): void {
    this.#removeEvent('mouseleave', uid);
  }

  public hover(enter: (e: Event) => void, leave: (e: Event) => void) {
    this.enterMouse(enter, {}, 'combined');
    this.leaveMouse(leave, {}, 'combined');
  }

  public unhover() {
    this.unenterMouse('combined');
    this.unleaveMouse('combined');
  }
  public drag(
    start?: (x: number, y: number, ...args: any[]) => void,
    move?: (x: number, y: number, ...args: any[]) => void,
    end?: (e: Event, ...args: any[]) => void,
    ...args: any[]
  ) {
    let isDragging = false;

    const updateCoords = (e: any) => {
      const { clientX, clientY } = e.touches ? e.touches[0] : e;
      return { x: clientX, y: clientY };
    };

    const startHandler = (e: Event) => {
      const { x, y } = updateCoords(e);
      isDragging = true;
      if (start) start(x, y, ...args);
    };

    const moveHandler = (e: Event) => {
      if (!isDragging) return;
      const { x, y } = updateCoords(e);
      if (move) move(x, y, ...args);
    };

    const endHandler = (e: Event) => {
      if (!isDragging) return;
      isDragging = false;
      if (end) end(e, ...args);
    };

    // Use built-in methods to add events
    this.mouseDown(startHandler, {}, 'combined');
    this.touchStart(startHandler, {}, 'combined');

    this.mouseMove(moveHandler, {}, 'combined');
    this.touchMove(moveHandler, {}, 'combined');

    this.mouseUp(endHandler, {}, 'combined');
    this.touchEnd(endHandler, {}, 'combined');
  }

  public undrag() {
    this.unmouseDown('combined');
    this.untouchStart('combined');
    this.unmouseMove('combined');
    this.untouchMove('combined');
    this.unmouseUp('combined');
    this.untouchEnd('combined');
  }

  public pointerdown(
    callback: (e: PointerEvent) => void,
    props: CustomEventOptions = {},
    uid = 'default'
  ) {
    this.#fig.style.touchAction = 'none';
    props['preventDefault'] = true;
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointerdown', callback, props, uid);
  }

  public pointermove(
    callback: (e: PointerEvent) => void,
    props: CustomEventOptions = {},
    uid = 'default'
  ) {
    props['preventDefault'] = true;
    this.#fig.style.touchAction = 'none';
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointermove', callback, props, uid);
  }

  public pointerup(
    callback: (e: PointerEvent) => void,
    props: CustomEventOptions = {},
    uid = 'default'
  ) {
    this.#fig.style.touchAction = 'none';
    props['preventDefault'] = true;
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointerup', callback, props, uid);
  }

  public unpointerdown(uid: string = 'default') {
    this.#removeEvent('pointerdown', uid);
  }

  public unpointermove(uid: string = 'default') {
    this.#removeEvent('pointermove', uid);
  }

  public unpointerup(uid: string = 'default') {
    this.#removeEvent('pointerup', uid);
  }
}
