import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 900;

// Unit visual testes

export async function LineUnitTests() {
  // create actual canvas and Shape you want to test

  console.log('creating canvas');
  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    fill: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  console.log(Canvas);

  await vTest('create Shape with basic propeties', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(40, 10, 70, 10);

    console.log('Hi am Line ');
    Canvas.addTo(Shape);

    console.log(Shape);
    await visualTest(Canvas, Shape, 1);

    setTimeout(() => {
      Shape.attrs({ y1: 100 });
      console.log(Shape);
    }, 8000);
  });

  await vTest('Changing Shapes geometric propeties by  .attrs() ', async () => {
    const Shape = new Shantanu.Line(80, 40, 30, 40, {
      stroke: 'rgba(78 , 180 , 190 , 0.3)',
      'stroke-width': 1
    });

    Canvas.addTo(Shape);

    await delay(time);

    Shape.attrs({
      x1: 40,
      y1: 10,
      y2: 50,
      x2: 70,

      stroke: 'rgba(50,190,140,0.5)'
    }); // absolute by default

    await delay(time);

    Shape.attrs({
      x1: 20,
      y1: 100,

      stroke: 'rgba(150,10,140,0.5)'
    }); // absolute by default

    await delay(time);

    Shape.attrs({
      x2: 150,
      y2: 70,

      stroke: 'rgba(150,10,10,0.5)'
    }); // absolute by default

    //console.log('-----testing-----');
    await visualTest(Canvas, Shape);
    await delay(time);
  });

  await vTest('create Shape with basic propeties + stroke width ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(40, 20, 10, 30, {
      stroke: 'rgb(196 , 130 , 1)',

      'stroke-width': 2
    });

    Canvas.addTo(Shape);
    await visualTest(Canvas, Shape, 1);
  });

  await vTest(
    'create Shape with basic propeties + basic in props ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(10, 50, 100, 0, {
        stroke: 'rgb(98 , 180 , 107)',
        'stroke-width': 0.5,
        x2: -60,
        y2: 40
      });

      Canvas.addTo(Shape);
      //console.log(Shape);
      await visualTest(Canvas, Shape);
    }
  );

  await vTest('Changing Shapes geometric propeties by  .attrs() ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(50, 40, 30, 30, {
      stroke: 'rgba(178 , 80 , 90 , 0.3)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape);

    //console.log(Shape);
    await visualTest(Canvas, Shape, 1);
    await delay(time);
  });

  await vTest('Changing Shapes geometric propeties by  .attrs() ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(80, 40, 30, 30, {
      stroke: 'rgba(78 , 80 , 90 , 0.3)',
      'stroke-width': 1
    });

    Canvas.addTo(Shape);

    await delay(time);

    Shape.attrs({
      x1: 50,
      y1: 40,

      stroke: 'rgba(50,190,140,0.5)'
    }); // absolute by default

    //console.log(Shape);
    await visualTest(Canvas, Shape);
    await delay(time);
  });

  // ++++++++++++ set custom transformation matrix end  ++++++++++++++++

  // ++++++++++++ testing  .show() , .hide() , .toFront() , .toBack() methods start ++++++++++++++++
  await vTest(
    ' testing  .show() , .hide() , .toFront() , .toBack() methods ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(130, 10, 30, 30, {
        stroke: 'rgba( 255 , 0 , 0 , 0.5 )',
        'stroke-width': 2
      });

      Canvas.addTo(Shape);
      await delay(time);
      const Shape1 = new Shantanu.Shapes.Basic.Line(130, 10, 30, 30, {
        stroke: 'rgba( 0 , 255 , 0 , 0.5 )',
        'stroke-width': 2
      });

      Canvas.addTo(Shape1);
      await delay(time);
      const Shape2 = new Shantanu.Shapes.Basic.Line(130, 10, 30, 30, {
        stroke: 'rgba( 0 , 0 , 255 , 0.5 )',
        'stroke-width': 2
      });

      Canvas.addTo(Shape2);
      await delay(time);
      const Shape3 = new Shantanu.Shapes.Basic.Line(130, 10, 30, 30, {
        stroke: 'rgba( 255 , 255 , 0 , 0.5 )',
        'stroke-width': 2
      });

      Canvas.addTo(Shape3);
      await delay(time);
      const Shape4 = new Shantanu.Shapes.Basic.Line(130, 10, 30, 30, {
        stroke: 'rgba(0 , 0 , 0 , 0.5 )',
        'stroke-width': 2
      });

      Canvas.addTo(Shape4);

      await delay(time);

      Shape4.hide();
      await delay(time);
      Shape4.show();

      await delay(time);

      Shape.toFront();

      await delay(time);

      Shape.toBack();
      await delay(time);
      Shape.toFront(6);

      await delay(time);
      //  Shape.toBack(5);

      await delay(time);
      Shape1.toFront(2);

      await delay(time);
      Shape1.toBack(1);

      await visualTest(Canvas, Shape);
    }
  );

  // ++++++++++++ .show() , .hide() , .toFront() , .toBack()  end ++++++++++++++++

  // ++++++++++++ Translate ++++++++++++++++

  await vTest(
    'Translate Transfome in Different types r , c , a , p ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(30, 30, 50, 30, {
        stroke: 'rgb(78 , 130 , 1)',
        'stroke-width': 3
      });

      Canvas.addTo(Shape);
      const cases = [
        { x: 70, y: 0, tType: 'r' },
        { x: 0, y: 50, tType: 'r' },
        { x: 20, y: 145, tType: 'c' },
        { x: 20, y: 95, tType: 'c' },
        { x: 20, y: 0, tType: 'a' },
        { x: 5, y: 80, tType: 'a' },
        { x: 70, y: 0, tType: 'p', px: 100, py: 100 },
        { x: -70, y: 0, tType: 'p', px: 50, py: 10 }
      ];

      function getAllMethods(obj: any): string[] {
        const methods = new Set<string>();
        let currentObj = obj;

        // Traverse the prototype chain until a certain base is reached (e.g., Object.prototype)
        while (currentObj && currentObj !== Object.prototype) {
          // Get all property names defined directly on the current prototype
          const props = Object.getOwnPropertyNames(currentObj);

          props.forEach((name) => {
            // Check if the property is a function and not the 'constructor'
            if (typeof obj[name] === 'function' && name !== 'constructor') {
              methods.add(name);
            }
          });

          // Move up the prototype chain
          currentObj = Object.getPrototypeOf(currentObj);
        }

        return Array.from(methods);
      }

      console.log(getAllMethods(Shape));

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i]!;

        await delay(time);
        Shape.Translate(c);

        await delay(time);
        await visualTest(Canvas, Shape);
      }
    }
  );

  await toError('Translate Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(5, 130, 30, 30, {
      stroke: 'rgba(78 , 130 , 1 , 0.6)',
      'stroke-width': 2
    });

    const cases = [
      { x: '70', y: 0, tType: 'r' },
      { x: 0, y: '50', tType: 'r' },
      { x: 20, y: '1' + '5', tType: 'c' },
      { x: 20, y: 95, tType: '' },
      { x: 20, y: '0', tType: 'a' },
      { x: 5, y: 80, tType: 't' },
      { x: 70, y: 0, tType: 'p', px: 100, py: '100' },
      { x: '-70', y: 0, tType: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);

      await ThrowError(() => Shape.Translate(c as any));
    }
  });

  // ++++++++++++ Translate End ++++++++++++++++

  // ++++++++++++ Rotate ++++++++++++++++

  await vTest('Rotate Transfome in Different types r , a , p ', async () => {
    const Shape1 = new Shantanu.Shapes.Basic.Line(90, 90, 30, 30, {
      stroke: 'rgba(78 , 130 , 21,0.2)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape1);

    const Shape = new Shantanu.Shapes.Basic.Line(90, 90, 30, 30, {
      stroke: 'rgba(178 , 30 , 121,0.7)',
      'stroke-width': 2
    });
    Canvas.addTo(Shape);

    const cases = [
      { angle: 10, tType: 'r' },

      { angle: -10, tType: 'r' },
      { angle: -40, tType: 'r' },
      { angle: 40, tType: 'r' },

      { angle: 145, tType: 'a' },
      { angle: -145, tType: 'a' },
      { angle: -95, tType: 'a' },
      { angle: 95, tType: 'a' },
      { angle: 0, tType: 'a' },
      { angle: -0, tType: 'a' },
      { angle: -680, tType: 'p', px: 90, py: 90 },
      { angle: 680, tType: 'p', px: 90, py: 90 },
      { angle: 60, tType: 'p', px: 120, py: 90 },
      { angle: -60, tType: 'p', px: 120, py: 90 },
      { angle: 3670, tType: 'p', px: 120, py: 120 },
      { angle: -3670, tType: 'p', px: 120, py: 120 },
      { angle: -70, tType: 'p', px: 90, py: 120 },
      { angle: 70, tType: 'p', px: 90, py: 120 }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time * 1.25);
      Shape.Rotate(c);
      await visualTest(Canvas, Shape);
    }
  });

  await toError('Rotate with wtong parameter types ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(140, 90, 30, 30, {
      stroke: 'rgba(78 , 30 , 121 , 0.6 )',
      'stroke-width': 0
    });

    const cases = [
      { angle: '70', tType: 'r' },
      { angle: true, tType: 'r' },
      { angle: '1' + '5', tType: 'c' },
      { angle: 95, tType: '' },
      { angle: { a: 7 }, tType: 'a' },
      { angle: 5, tType: 't' },
      { angle: 0, tType: 'p', px: 100, py: '100' },
      { angle: () => {}, tType: 'p', px: 90, py: 100 },
      { angle: '-70', tType: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);

      await ThrowError(() => Shape.Rotate(c as any));
    }
  });

  // ++++++++++++ Rotate End ++++++++++++++++

  // ++++++++++++ Scale ++++++++++++++++

  await vTest('Scale Transfome in Different types r , a , p ', async () => {
    const Shape1 = new Shantanu.Shapes.Basic.Line(80, 150, 30, 30, {
      stroke: 'rgba(78 , 130 , 1 , 1)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape1);

    const Shape = new Shantanu.Shapes.Basic.Line(80, 150, 30, 30, {
      stroke: 'rgb(238 , 90 , 81)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape);

    const cases = [
      { sx: 1, sy: 0.5, tType: 'r' },
      { sx: 1, sy: 2, tType: 'r' },
      { sx: 0.5, sy: 0.5, tType: 'r' },
      { sx: 2, sy: 2, tType: 'r' },
      { sx: 1, sy: 0.5, tType: 'a' },
      { sx: 1, sy: 2, tType: 'a' },
      { sx: -1, sy: -0.5, tType: 'a' },
      { sx: 1, sy: 0.5, tType: 'a' },

      { sx: 1.5, sy: 0.8, tType: 'p', px: 80, py: 150 },

      { sx: 0.3, sy: 0.33, tType: 'p', px: 110, py: 150 },
      { sx: 1, sy: 0.85, tType: 'p', px: 110, py: 180 },
      { sx: 1.7, sy: 1.4, tType: 'p', px: 80, py: 180 }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);
      Shape.Scale(c);
      await visualTest(Canvas, Shape, 1);
      await delay(time * 1.5);
    }
  });

  await toError('Scale Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(150, 150, 30, 30, {
      stroke: 'rgba(238 , 90 , 81 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { sx: '70', sy: 0, tType: 'r' },
      { sx: 0, sy: '50', tType: 'r' },
      { sx: 20, sy: '1' + '5', tType: 'a' },
      { sx: 20, sy: 95, tType: '' },
      { sx: 20, sy: '0', tType: 'a' },
      { sx: 5, sy: 80, tType: 't' },
      { sx: 70, sy: 0, tType: 'p', px: 100, py: '100' },
      { sx: '-70', sy: 0, tType: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);

      await ThrowError(() => Shape.Scale(c as any));
    }
  });

  // ++++++++++++ Scale End ++++++++++++++++

  // ++++++++++++ Skew ++++++++++++++++

  await vTest('Skew Transfome in Different types r , a , p ', async () => {
    const Shape1 = new Shantanu.Shapes.Basic.Line(20, 190, 30, 30, {
      stroke: 'rgba(208 , 130 , 81 , 1 )',
      'stroke-width': 2
    });

    Canvas.addTo(Shape1);

    const Shape = new Shantanu.Shapes.Basic.Line(20, 190, 30, 30, {
      stroke: 'rgb(200 , 60 , 10)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape);

    const cases = [
      { sx: 1.2, sy: 0, tType: 'r' },
      { sx: -1.2, sy: 0, tType: 'r' },
      { sx: 5, sy: 6, tType: 'r' },
      { sx: -5, sy: -6, tType: 'r' },

      { sx: 2, sy: 9, tType: 'a' },
      { sx: 16.8, sy: 0.5, tType: 'a' },
      { sx: -5, sy: -10, tType: 'a' },
      { sx: 1, sy: 0.5, tType: 'a' },

      { sx: -5, sy: 5, tType: 'p', px: 20, py: 190 }, // a
      { sx: 5, sy: -5, tType: 'p', px: 50, py: 190 }, // a

      { sx: 15, sy: 0, tType: 'p', px: 50, py: 220 }, // b
      { sx: -15, sy: 0, tType: 'p', px: 20, py: 220 } // b
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);
      Shape.Skew(c);
      await visualTest(Canvas, Shape, 1);
      await delay(time);
    }
  });

  await toError('Skew Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(150, 190, 30, 30, {
      stroke: 'rgba(200 , 160 , 10 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { sx: '70', sy: 0, tType: 'r' },
      { sx: 0, sy: '50', tType: 'r' },
      { sx: 20, sy: '1' + '5', tType: 'a' },
      { sx: 20, sy: 95, tType: '' },
      { sx: 20, sy: '0', tType: 'a' },
      { sx: 5, sy: 80, tType: 't' },
      { sx: 70, sy: 0, tType: 'p', px: 100, py: '100' },
      { sx: '-70', sy: 0, tType: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);

      await ThrowError(() => Shape.Skew(c as any));
    }
  });

  // ++++++++++++ Skew End ++++++++++++++++

  // ++++++++++++ Flip ++++++++++++++++

  await vTest('Flip Transfome in Different types r , a , p ', async () => {
    const Shape1 = new Shantanu.Shapes.Basic.Line(50, 230, 30, 30, {
      stroke: 'rgba(38 , 190 , 1,1)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape1);

    const Shape = new Shantanu.Shapes.Basic.Line(50, 230, 30, 30, {
      stroke: 'rgb(23 , 10 , 81)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape);

    const cases = [
      { flipX: true, flipY: true, dirX: 'x+', dirY: 'y+' },
      { flipX: true, flipY: true, dirX: 'x+', dirY: 'y-' },
      { flipX: true, flipY: true, dirX: 'x-', dirY: 'y+' },
      { flipX: true, flipY: true, dirX: 'x-', dirY: 'y-' },

      { flipX: true, flipY: false, dirX: 'x+', dirY: 'y+' },
      { flipX: true, flipY: false, dirX: 'x+', dirY: 'y-' },
      { flipX: true, flipY: false, dirX: 'x-', dirY: 'y+' },
      { flipX: true, flipY: false, dirX: 'x-', dirY: 'y-' },

      { flipX: false, flipY: true, dirX: 'x+', dirY: 'y+' },
      { flipX: false, flipY: true, dirX: 'x+', dirY: 'y-' },
      { flipX: false, flipY: true, dirX: 'x-', dirY: 'y+' },
      { flipX: false, flipY: true, dirX: 'x-', dirY: 'y-' }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);
      Shape.Flip(c as any);
      await visualTest(Canvas, Shape);
      await delay(time);
      Shape.setSMatrix([
        [50, 230],
        [30, 30]
      ]);
    }
  });

  await toError('Skew Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(100, 230, 30, 30, {
      stroke: 'rgba(238 , 190 , 81 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { flipX: true, flipY: 1, dirX: 'x+', dirY: 'y+' },
      { flipX: 'QM', flipY: true, dirX: 'x+', dirY: 'y-' },
      { flipX: true, flipY: true, dirX: 'Y', dirY: 'X' },
      { flipX: true, flipY: true, dirX: false, dirY: 'X' },
      { flipX: true, flipY: true, dirX: 'x-', dirY: true },
      { flipX: false, flipY: false, dirX: 'x+', dirY: 'y+' },
      { flipX: false, flipY: false, dirX: 'x+', dirY: 'y-' },
      { flipX: false, flipY: false, dirX: 'x-', dirY: 'y+' },
      { flipX: false, flipY: false, dirX: 'x-', dirY: 'y-' }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]!;

      await delay(time);

      await ThrowError(() => Shape.Flip(c as any));
    }
  });

  // ++++++++++++ Flip End ++++++++++++++++
}
