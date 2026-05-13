import { describe, test, expect } from 'vitest';

import { Shantanu } from '../../../../../index/index.js';

describe('Shantanu.Rect class testing ', () => {
  let canvas: Shantanu.Canvas;

  beforeEach(() => {
    const div = document.createElement('div');
    div.id = 'testCanvas';
    document.body.appendChild(div); // 👈 Add to DOM

    canvas = new Shantanu.Canvas('testCanvas', 200, 200);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // Test - 1
  test('Create a rectangle with basic properties : ', () => {
    const rect = new Shantanu.Rect(10, 20, 100, 50, { id: 'QueenMedusa' });

    canvas.addTo(rect);
    expect(rect?.style?.id).toBe('QueenMedusa');
    expect(rect?.geometry?.x).toBe(10);
    expect(rect?.geometry?.y).toBe(20);
    expect(rect?.geometry?.width).toBe(100);
    expect(rect?.geometry?.height).toBe(50);
  });

  // Test - 2

  test('Create a rectangle with basic properties and border radius rx  : ', () => {
    const rect = new Shantanu.Rect(10, 20, 100, 50, 5);

    canvas.addTo(rect);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(5);
  });

  // Test - 3

  test('Create a rectangle with basic properties and border radius rx ,  ry  : ', () => {
    const rect = new Shantanu.Rect(10, 20, 100, 50, 5, 8);

    canvas.addTo(rect);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(8);
  });

  // Test - 4

  test('Create a rectangle with basic properties + props( geometry + style ) by constructor :  ', () => {
    const props = {
      x: 10,
      y: 20,
      width: 50,
      height: 100,
      rx: 5,
      ry: 4
    };
    const rect = new Shantanu.Rect(10, 10, 10, 10, props);

    canvas.addTo(rect);
    expect(rect?.geometry?.x).toBe(10 + 10);
    expect(rect?.geometry?.y).toBe(20 + 10);
    expect(rect?.geometry?.width).toBe(50 + 10);
    expect(rect?.geometry?.height).toBe(100 + 10);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(4);
  });

  // Test - 5

  test('Create a rectangle with basic properties + rx + props( geometry + style ) by constructor :  ', () => {
    const props = {
      rx: 7
    };
    const rect = new Shantanu.Rect(10, 10, 10, 10, 8, props);

    canvas.addTo(rect);
    expect(rect?.geometry?.rx).toBe(8 + 7);
    expect(rect?.geometry?.ry).toBe(8);
  });

  // Test - 6

  test('Create a rectangle with basic properties + rx , ry  + props( geometry + style ) by constructor :  ', () => {
    const props = {
      rx: 7,
      ry: 2
    };
    const rect = new Shantanu.Rect(10, 10, 10, 10, 8, 2, props);

    canvas.addTo(rect);
    expect(rect?.geometry?.rx).toBe(15);
    expect(rect?.geometry?.ry).toBe(4);
  });

  const cases = [
    // Lowercase
    'red',
    'rgb(90, 45, 20)',
    'rgba(70, 65, 80, 0.4)',
    '#3456',
    '#7823aa',
    'hsl(150, 50%, 90%)',
    'hsla(80, 96%, 70%, 0.7)',

    // Uppercase
    'RED',
    'RGB(90, 45, 20)',
    'RGBA(70, 65, 80, 0.4)',
    '#3456', // Hex is case-insensitive, but uppercase versions follow
    '#7823AA',
    'HSL(150, 50%, 90%)',
    'HSLA(80, 96%, 70%, 0.7)',

    // Mixed case
    'ReD',
    'RgB(90,45,20)',
    'RgBa(70,65,80,0.4)',
    '#7823aA',
    'HsL(150, 50%, 90%)',
    'HsLa(80, 96%, 70%, 0.7)'
  ];

  cases.forEach((c) => {
    test(`Appying color ${c} by constructor prop `, () => {
      const rect = new Shantanu.Rect(10, 20, 100, 50, { fill: c, stroke: c });

      canvas.addTo(rect);

      expect(rect?.style?.fill).toBe(c);
      expect(rect?.style?.stroke).toBe(c);
    });
  });

  // +++±±+++++++++++++++++++++±+++++++++±+++++
  // Invalid Values testing : ->
  // +++±±+±±++++±±++++±++++++++++±++++++++++++

  const invalidVStr = {
    x: '100',
    y: '50',
    width: '',
    height: '-111',
    rx: '5',
    ry: '9'
  };

  const invalidVUn = {
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
    rx: undefined,
    ry: undefined
  };

  const invalidVNu = {
    x: null,
    y: null,
    width: null,
    height: null,
    rx: null,
    ry: null
  };

  // invalid Strings  apply to all rectangle basic properties x , y , width , height , rx , ry
  test(` Trying Apply invalid Values x by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(invalidVStr.x as any, 20, 100, 50)
    ).toThrow();
  });

  test(` Trying Apply invalid Values y by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, invalidVStr.y as any, 100, 50)
    ).toThrow();
  });

  test(` Trying Apply invalid Values width by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 20, invalidVStr.width as any, 50)
    ).toThrow();
  });

  test(` Trying Apply invalid Values height by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 29, 20, invalidVStr.height as any)
    ).toThrow();
  });

  //  invalid undefined  apply to all rectangle basic properties x , y , width , height , rx , ry
  test(` Trying Apply invalid Values x by constructor prop `, () => {
    expect(() => new Shantanu.Rect(invalidVUn.x as any, 20, 100, 50)).toThrow();
  });

  test(` Trying Apply invalid Values y by constructor prop `, () => {
    expect(() => new Shantanu.Rect(20, invalidVUn.y as any, 100, 50)).toThrow();
  });

  test(` Trying Apply invalid Values width by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 20, invalidVUn.width as any, 50)
    ).toThrow();
  });

  test(` Trying Apply invalid Values height by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 29, 20, invalidVUn.height as any)
    ).toThrow();
  });

  //  nvalid nulls apply to all rectangle basic properties x , y , width , height , rx , ry
  test(` Trying Apply invalid Values x by constructor prop `, () => {
    expect(() => new Shantanu.Rect(invalidVNu.x as any, 20, 100, 50)).toThrow();
  });

  test(` Trying Apply invalid Values y by constructor prop `, () => {
    expect(() => new Shantanu.Rect(20, invalidVNu.y as any, 100, 50)).toThrow();
  });

  test(` Trying Apply invalid Values width by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 20, invalidVNu.width as any, 50)
    ).toThrow();
  });

  test(` Trying Apply invalid Values height by constructor prop `, () => {
    expect(
      () => new Shantanu.Rect(20, 29, 20, invalidVNu.height as any)
    ).toThrow();
  });

  //+±++++++++++++++±++++++++++++±+++++++++++++++
  // nagavite Values -> auto correct for width , height , rx , ry
  //++±+++++++++++++++++++++++++++++++++++++±±±++

  test('Trying to apply nagative values basic properties + props( geometry + style ) by constructor :  ', () => {
    const rect = new Shantanu.Rect(-10, -10, -10, -10, -5, -4);

    canvas.addTo(rect);
    expect(rect?.geometry?.x).toBe(-10);
    expect(rect?.geometry?.y).toBe(-10);
    expect(rect?.geometry?.width).toBe(10);
    expect(rect?.geometry?.height).toBe(10);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(4);
  });

  const props = {
    x: -10,
    y: -20,
    width: -50,
    height: -100,
    rx: -5,
    ry: -4
  };

  test('Trying to apply nagative values basic properties + props( geometry + style ) by constructor :  ', () => {
    const rect = new Shantanu.Rect(-10, -10, -10, -10, -5, -4, { ...props });

    canvas.addTo(rect);
    expect(rect?.geometry?.x).toBe(-20);
    expect(rect?.geometry?.y).toBe(-30);
    expect(rect?.geometry?.width).toBe(10 + 50);
    expect(rect?.geometry?.height).toBe(10 + 100);

    expect(rect?.geometry?.rx).toBe(5 + 5);
    expect(rect?.geometry?.ry).toBe(4 + 4);
  });

  test('Trying to apply nagative values basic properties + props( geometry + style ) by constructor :  ', () => {
    const rect = new Shantanu.Rect(-10, -10, -10, -10, { ...props });

    canvas.addTo(rect);
    expect(rect?.geometry?.x).toBe(-20);
    expect(rect?.geometry?.y).toBe(-30);
    expect(rect?.geometry?.width).toBe(10 + 50);
    expect(rect?.geometry?.height).toBe(10 + 100);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(4);
  });

  test('Trying to apply nagative values basic properties + props( geometry + style ) by constructor :  ', () => {
    const rect = new Shantanu.Rect(-10, -10, -10, -10, -6, { ...props });

    canvas.addTo(rect);
    expect(rect?.geometry?.x).toBe(-20);
    expect(rect?.geometry?.y).toBe(-30);
    expect(rect?.geometry?.width).toBe(10 + 50);
    expect(rect?.geometry?.height).toBe(10 + 100);

    expect(rect?.geometry?.rx).toBe(5 + 6);
    expect(rect?.geometry?.ry).toBe(4 + 6);
  });

  // Test - 7
  // +++±±+++++++++++++++++++++±+++++++++±+++++
  //  testing .attrs() : ->
  // +++±±+±±++++±±++++±++++++++++±++++++++++++

  test('apply attributes via .attrs() on Rectangle : ', () => {
    const rect = new Shantanu.Rect(0, 0, 0, 0);
    canvas.addTo(rect);
    rect.attrs(props);
    expect(rect?.geometry?.x).toBe(-10);
    expect(rect?.geometry?.y).toBe(-20);
    expect(rect?.geometry?.width).toBe(50);
    expect(rect?.geometry?.height).toBe(100);

    expect(rect?.geometry?.rx).toBe(5);
    expect(rect?.geometry?.ry).toBe(4);
  });

  cases.forEach((c) => {
    test(`Appying color ${c} by .attrs() prop `, () => {
      const o = { fill: c, stroke: c };

      const rect = new Shantanu.Rect(10, 20, 100, 50);

      canvas.addTo(rect);
      rect.attrs(o);
      expect(rect?.style?.fill).toBe(c);
      expect(rect?.style?.stroke).toBe(c);
    });
  });

  test('apply attributes id  via .attrs() on Rectangle -> throw error  : ', () => {
    const rect = new Shantanu.Rect(0, 0, 0, 0, props);
    canvas.addTo(rect);
    expect(() => rect.attrs({ id: 'medusa' })).toThrow();
  });

  test('apply attributes roleOfSVG  via .attrs() on Rectangle -> throw error  : ', () => {
    const rect = new Shantanu.Rect(0, 0, 0, 0, props);
    canvas.addTo(rect);
    expect(() => rect.attrs({ roleOfSVG: 'medusa' })).toThrow();
  });

  test('checking attributes via .setSMatrix()  on Rectangle by setting matrix : ', () => {
    const rect = new Shantanu.Rect(0, 0, 0, 0);
    canvas.addTo(rect);
    rect.setSMatrix([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100]
    ]);
    console.log(rect);
    console.log(rect.geometry?.matrix);
    console.log(rect.geometry?.Obbox);
    expect(rect?.geometry?.x).toBe(0);
    expect(rect?.geometry?.y).toBe(0);
    expect(rect?.geometry?.width).toBe(100);
    expect(rect?.geometry?.height).toBe(100);
  });
});
