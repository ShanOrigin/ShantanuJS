import { GraphicalElement, GShpesTages } from '../graphics/graphicalElement.js';
import { DEV_INTERNAL_ACCESS } from '../../../utils/providers/accesskeys.js';

type SVGEventType = keyof SVGElementEventMap;

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
  | 'enterMouse'
  | 'leaveMouse';

export abstract class Events<
  T extends GShpesTages,
  S extends GShpesTages
> extends GraphicalElement<T, S> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS);
  #listener: {
    type: SVGEventType;
    handler: EventListener;
    options?: CustomEventOptions;
    use?: string;
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
    useC: string = 'default'
  ) {
    if (eventType == ('drag' as SupportedEvents)) {
      console.warn(
        `drag event cannot beused by on() method is drag() seperate method provided on shape `
      );
    }
    if (typeof (this as any)[eventType] === 'function') {
      this.#addEvent(eventType as SVGEventType, callback, props, useC);
    } else {
      console.warn(`Unsupported event type: ${eventType}`);
    }
  }

  public off(eventType: SupportedEvents, useC: string = 'default') {
    if (typeof (this as any)[`un${eventType}`] === 'function') {
      this.#removeEvent(eventType as SVGEventType, useC);
    } else {
      console.warn(`Unsupported event type: ${eventType}`);
    }
  }

  #addEvent<E extends Event>(
    type: SVGEventType,
    callback: (e: E) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
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
      (l) => l.type === type && l.use === useC
    );

    if (existing) {
      this.#fig.removeEventListener(
        existing.type,
        existing.handler,
        existing.options
      );
      this.#listener = this.#listener.filter((l) => l.type !== type);
    }

    this.#fig.addEventListener(type, handler, listenerOptions);
    this.#listener.push({ type, handler, options: props, use: useC });
  }

  #aaddEvent(
    type: SVGEventType,
    callback: (e: Event | PointerEvent) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ): void {
    const {
      preventDefault = false,
      stopPropagation = false,
      ...listenerOptions
    } = props;

    if (this.#fig) {
      const handler: EventListener = (e) => {
        preventDefault && e.preventDefault();
        stopPropagation && e.stopPropagation();
        callback(e);
      };

      const existing = this.#listener.find(
        (l) => l.type === type && l.use === useC
      );

      console.log('exits : ', existing);
      if (existing) {
        this.#fig.removeEventListener(
          existing.type,
          existing.handler,
          existing.options
        );
        this.#listener = this.#listener.filter((l) => l.type !== type);
      }

      this.#fig.addEventListener(type, handler, listenerOptions);
      this.#listener.push({
        type,
        handler,
        options: props,
        use: useC
      });

      console.log(type, 'event added');
    }
  }

  #removeEvent(type: SVGEventType, useC: string = 'default'): void {
    if (this.#fig) {
      const existing = this.#listener.find(
        (l) => l.type === type && l.use === useC
      );
      if (existing) {
        this.#fig.removeEventListener(type, existing.handler, existing.options);
        this.#listener = this.#listener.filter(
          (l) => l.type !== type && l.use === useC
        );
      }
    }
  }

  public click(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('click', callback, props, useC);
  }

  public unclick(useC: string = 'default') {
    this.#removeEvent('click', useC);
  }

  public dblclick(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('dblclick', callback, props, useC);
  }

  public undblclick(useC: string = 'default') {
    this.#removeEvent('dblclick', useC);
  }

  public mouseDown(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('mousedown', callback, props, useC);
  }

  public unmouseDown(useC: string = 'default') {
    this.#removeEvent('mousedown', useC);
  }

  public mouseUp(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('mouseup', callback, props, useC);
  }

  public unmouseUp(useC: string = 'default') {
    this.#removeEvent('mouseup', useC);
  }

  public mouseMove(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('mousemove', callback, props, useC);
  }

  public unmouseMove(useC: string = 'default') {
    this.#removeEvent('mousemove', useC);
  }

  public touchStart(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('touchstart', callback, props, useC);
  }

  public untouchStart(useC: string = 'default') {
    this.#removeEvent('touchstart', useC);
  }

  public touchEnd(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('touchend', callback, props, useC);
  }

  public untouchEnd(useC: string = 'default') {
    this.#removeEvent('touchend', useC);
  }

  public touchMove(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('touchmove', callback, props, useC);
  }

  public untouchMove(useC: string = 'default') {
    this.#removeEvent('touchmove', useC);
  }

  public enterMouse(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('mouseenter', callback, props, useC);
  }

  public leaveMouse(
    callback: (e: Event) => void,
    props: CustomEventOptions = {},
    useC: string = 'default'
  ) {
    this.#addEvent('mouseleave', callback, props, useC);
  }

  public unenterMouse(useC: string = 'default'): void {
    this.#removeEvent('mouseenter', useC);
  }

  public unleaveMouse(useC: string = 'default'): void {
    this.#removeEvent('mouseleave', useC);
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
    useC = 'default'
  ) {
    this.#fig.style.touchAction = 'none';
    props['preventDefault'] = true;
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointerdown', callback, props, useC);
  }

  public pointermove(
    callback: (e: PointerEvent) => void,
    props: CustomEventOptions = {},
    useC = 'default'
  ) {
    props['preventDefault'] = true;
    this.#fig.style.touchAction = 'none';
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointermove', callback, props, useC);
  }

  public pointerup(
    callback: (e: PointerEvent) => void,
    props: CustomEventOptions = {},
    useC = 'default'
  ) {
    this.#fig.style.touchAction = 'none';
    props['preventDefault'] = true;
    this.#fig.setAttribute('pointer-events', 'all');
    this.#addEvent('pointerup', callback, props, useC);
  }

  public unpointerdown(useC: string = 'default') {
    this.#removeEvent('pointerdown', useC);
  }

  public unpointermove(useC: string = 'default') {
    this.#removeEvent('pointermove', useC);
  }

  public unpointerup(useC: string = 'default') {
    this.#removeEvent('pointerup', useC);
  }
}

/*
 *
 *
  public ddrag(
    start?: (x: number, y: number, ...args: any[]) => void,
    move?: (x: number, y: number, ...args: any[]) => void,
    end?: (e: Event, ...args: any[]) => void,
    ...args: any[]
  ) {
    let isMouseDown = false;
    let mouseX: number, mouseY: number;

    const updateMouseCoordinates = (event: any) => {
      const { clientX, clientY } = event.touches ? event.touches[0] : event;
      mouseX = clientX;
      mouseY = clientY;
      return { x: mouseX, y: mouseY };
    };

    const eventsMap = [
      ['mousedown', 'touchstart'],
      ['mousemove', 'touchmove'],
      ['mouseup', 'touchend']
    ];

    eventsMap.forEach((types, i) => {
      types.forEach((type) => {
        const handler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          if (i === 0) {
            isMouseDown = true;
            const { x, y } = updateMouseCoordinates(e);
            if (start) start(x, y, ...args);
          } else if (i === 1 && isMouseDown) {
            const { x, y } = updateMouseCoordinates(e);
            if (move) move(x, y, ...args);
          } else if (i === 2) {
            isMouseDown = false;
            if (end) end(e, ...args);
          }
        };

        // Add listener
        this.#fig.#addEventListener(type, handler);
        this.listener.push({ type: type as SVGEventType, handler });
      });
    });
  }


 *
 *
 *
 */

/*
type SVGEventType = keyof SVGElementEventMap;

export default class Events {
  private fig: SVGElement;

  private listener: {
    type: SVGEventType;
    handler: EventListener;
    options?: CustomEventOptions;
  }[] = [];

  constructor(svgElement: SVGElement) {
    this.#fig = svgElement;
  }

  private #addEvent(
    type: SVGEventType,
    callback: (e: Event) => void,
    time: number = 0,
    props: CustomEventOptions = {}
  ): void {
    const existing = this.listener.find((l) => l.type === type);
    if (existing) {
      this.#fig.#removeEventListener(existing.type, existing.handler, existing.options);
      this.listener = this.listener.filter((l) => l.type !== type);
    }

    const handler: EventListener =
      time === 0
        ? (e) => callback(e)
        : (e) => setTimeout(() => callback(e), time);

    this.#fig.#addEventListener(type, handler, props);
    this.listener.push({ type, handler, options: props });
  }

  private #removeEvent(type: SVGEventType): void {
    const existing = this.listener.find((l) => l.type === type);
    if (existing) {
      this.#fig.#removeEventListener(type, existing.handler, existing.options);
      this.listener = this.listener.filter((l) => l.type !== type);
    }
  }

  public click(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('click', callback, time, props);
  }

  public unclick() {
    this.#removeEvent('click');
  }

  public dbclick(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('dblclick', callback, time, props);
  }

  public undbclick() {
    this.#removeEvent('dblclick');
  }

  public mouseDown(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('mousedown', callback, time, props);
  }

  public unmouseDown() {
    this.#removeEvent('mousedown');
  }

  public mouseUp(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('mouseup', callback, time, props);
  }

  public unmouseUp() {
    this.#removeEvent('mouseup');
  }

  public mouseMove(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('mousemove', callback, time, props);
  }

  public unmouseMove() {
    this.#removeEvent('mousemove');
  }

  public touchStart(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('touchstart', callback, time, props);
  }

  public untouchStart() {
    this.#removeEvent('touchstart');
  }

  public touchEnd(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('touchend', callback, time, props);
  }

  public untouchEnd() {
    this.#removeEvent('touchend');
  }

  public touchMove(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('touchmove', callback, time, props);
  }

  public untouchMove() {
    this.#removeEvent('touchmove');
  }

  public contextMenu(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('contextmenu', callback, time, props);
  }

  public uncontextMenu() {
    this.#removeEvent('contextmenu');
  }

  public wheel(callback: (e: Event) => void, time = 0, props: CustomEventOptions = {}) {
    this.#addEvent('wheel', callback, time, props);
  }

  public unwheel() {
    this.#removeEvent('wheel');
  }


// Add mouseenter and mouseleave individually
public enterMouse(
  callback: (e: Event) => void,
  time: number = 0,
  props: CustomEventOptions = {}
): void {
  this.#addEvent('mouseenter', callback, time, props);
}

public leaveMouse(
  callback: (e: Event) => void,
  time: number = 0,
  props: CustomEventOptions = {}
): void {
  this.#addEvent('mouseleave', callback, time, props);
}



public unenterMouse(): void { this.#removeEvent('mouseenter'); }
public unleaveMouse(): void { this.#removeEvent('mouseleave'); }


  public hover(enter: (e: Event) => void, leave: (e: Event) => void) {

		this.enterMouse( enter , 0 , {}  );
		this.leaveMouse(leave , 0 , {});
  }

  public unhover() {
		this.unenterMouse();
		this.unleaveMouse();

  }
}

*/
