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

  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    fill: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  console.log(Canvas);

  await vTest('create Shape with basic propeties', async () => {
    const Shape = new Shantanu.Shapes.Basic.Line(40, 10, 70, 10);

    Canvas.addTo(Shape);
    console.log(Shape);
    await visualTest(Canvas, Shape, 1);
  });

  /*
  await vTest('create Shape with basic propeties + stroke width ', async () => {
    const Shape = new Shantanu.Line(40, 20, 10, 30, {
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
      console.log(Shape);
      await visualTest(Canvas, Shape);
    }
  );

  
  await vTest('Changing Shapes geometric propeties by  .attrs() ', async () => {
    const Shape = new Shantanu.Line(50, 40, 30, 30, {
      fill: 'rgba(178 , 80 , 90 , 0.3)',
      'stroke-width': 2
    });

    Canvas.addTo(Shape);

    console.log(Shape);
    await visualTest(Canvas, Shape, 1);
    await delay(time);
  });

  await vTest('Changing Shapes geometric propeties by  .attrs() ', async () => {
    const Shape = new Shantanu.Line(80, 40, 30, 30, {
      fill: 'rgba(78 , 80 , 90 , 0.3)',
      'stroke-width': 1
    });

    Canvas.addTo(Shape);

    await delay(time);

    Shape.attrs({
      x1: 50,
      y1: 40,

      stroke: 'rgba(50,190,140,0.5)'
    }); // absolute by default

    console.log(Shape);
    await visualTest(Canvas, Shape);
    await delay(time);
  });

*/

  /*
  ///

  // ++++++++++++ set custom transformation matrix  ++++++++++++++++
  await vTest(' set custom transformation matrix ', async () => {
    const Shape0 = new Shantanu.Rect(90, 50, 40, 30, {
      fill: 'rgba(18 , 45 , 90 , 1)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape0);

    await delay(time * 4);

    console.error('-----hhhh');
    Shape0.setTMatrix([
      [1.4, 0, 0],
      [0, 0.5, 0],
      [0, 0, 1]
    ]);

    await delay(time * 4);
    console.error('-----hhhh');
    Shape0.beginT();
    Shape0.Translate({ x: 10, y: 10, type: 'r' });
    Shape0.Rotate({ angle: 50, type: 'a' });
    Shape0.endT();
    console.log(Shape0.getBBox());
    console.log(Shape0.geometry?.TList);
    await visualTest(Canvas, Shape0);

    const Shape = new Shantanu.Rect(90, 50, 40, 30, {
      fill: 'rgba(108 , 45 , 90 , 1)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape);

    await delay(time);

    Shape.setTMatrix([
      [1.4, 0, 0],
      [0, 0.5, 0],
      [0, 0, 1]
    ]);

    console.log(Shape);
    await visualTest(Canvas, Shape);
    await delay(time);

    const m = Shape.createTransformationMatrix(
      {
        translate: { x: 10, y: 10, type: 'r' },
        rotate: { angle: 50, type: 'a' }
      },
      'row'
    );

    console.log('composed mstrix = ', JSON.stringify(m));
    Shape.setTMatrix(m);

    console.log('BBOX ', Shape.getBBox());
    await delay(time);
  
    console.log(Shape);
    await visualTest(Canvas, Shape);
  });


///

  // ++++++++++++ set custom transformation matrix end  ++++++++++++++++

  // ++++++++++++ testing  .show() , .hide() , .toFront() , .toBack() methods start ++++++++++++++++
  await vTest(
    ' testing  .show() , .hide() , .toFront() , .toBack() methods ',
    async () => {
      const Shape = new Shantanu.Rect(130, 10, 50, 50, -10, {
        fill: 'rgba( 255 , 0 , 0 , 0.5 )',
        'stroke-width': 0
      });

      Canvas.addTo(Shape);

      const Shape1 = new Shantanu.Rect(130, 10, 45, 45, {
        fill: 'rgba( 0 , 255 , 0 , 0.5 )',
        'stroke-width': 0
      });

      Canvas.addTo(Shape1);

      const Shape2 = new Shantanu.Rect(130, 10, 40, 40, -10, {
        fill: 'rgba( 0 , 0 , 255 , 0.5 )',
        'stroke-width': 0
      });

      Canvas.addTo(Shape2);

      const Shape3 = new Shantanu.Rect(130, 10, 35, 35, {
        fill: 'rgba( 255 , 255 , 0 , 0.5 )',
        'stroke-width': 0
      });

      Canvas.addTo(Shape3);

      const Shape4 = new Shantanu.Rect(130, 10, 30, 30, -10, {
        fill: 'rgba(0 , 0 , 0 , 0.5 )',
        'stroke-width': 0
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
      const Shape = new Shantanu.Rect(5, 80, 30, 30, {
        fill: 'rgb(78 , 130 , 1)',
        'stroke-width': 0
      });

      Canvas.addTo(Shape);
      const cases = [
        { x: 70, y: 0, type: 'r' },
        { x: 0, y: 50, type: 'r' },
        { x: 20, y: 145, type: 'c' },
        { x: 20, y: 95, type: 'c' },
        { x: 20, y: 0, type: 'a' },
        { x: 5, y: 80, type: 'a' },
        { x: 70, y: 0, type: 'p', px: 100, py: 100 },
        { x: -70, y: 0, type: 'p', px: 50, py: 10 }
      ];

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];

        await delay(time);
        Shape.Translate(c);
        await visualTest(Canvas, Shape);
      }
    }
  );

  await toError('Translate Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Rect(5, 130, 30, 30, {
      fill: 'rgba(78 , 130 , 1 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { x: '70', y: 0, type: 'r' },
      { x: 0, y: '50', type: 'r' },
      { x: 20, y: '1' + '5', type: 'c' },
      { x: 20, y: 95, type: '' },
      { x: 20, y: '0', type: 'a' },
      { x: 5, y: 80, type: 't' },
      { x: 70, y: 0, type: 'p', px: 100, py: '100' },
      { x: '-70', y: 0, type: '8', px: 50, py: 10 }
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
    const Shape = new Shantanu.Rect(90, 90, 30, 30, {
      fill: 'rgba(78 , 30 , 121,0.7)',
      'stroke-width': 0
    });
    Canvas.addTo(Shape);
    const Shape1 = new Shantanu.Rect(90, 90, 30, 30, {
      fill: 'rgba(78 , 30 , 21,0.2)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape1);
    const cases = [
      { angle: 10, type: 'r' },
      { angle: -10, type: 'r' },
      { angle: -50, type: 'r' },
      { angle: 50, type: 'r' },
      { angle: 145, type: 'a' },
      { angle: -145, type: 'a' },
      { angle: -95, type: 'a' },
      { angle: 95, type: 'a' },
      { angle: 0, type: 'a' },
      { angle: -0, type: 'a' },
      { angle: -680, type: 'p', px: 90, py: 90 },
      { angle: 680, type: 'p', px: 90, py: 90 },
      { angle: 60, type: 'p', px: 120, py: 90 },
      { angle: -60, type: 'p', px: 120, py: 90 },
      { angle: 3670, type: 'p', px: 120, py: 120 },
      { angle: -3670, type: 'p', px: 120, py: 120 },
      { angle: -70, type: 'p', px: 90, py: 120 },
      { angle: 70, type: 'p', px: 90, py: 120 }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);
      Shape.Rotate(c);
      await visualTest(Canvas, Shape);
    }
  });

  await toError('Rotate with wtong parameter types ', async () => {
    const Shape = new Shantanu.Rect(140, 90, 30, 30, {
      fill: 'rgba(78 , 30 , 121 , 0.6 )',
      'stroke-width': 0
    });

    const cases = [
      { angle: '70', type: 'r' },
      { angle: true, type: 'r' },
      { angle: '1' + '5', type: 'c' },
      { angle: 95, type: '' },
      { angle: { a: 7 }, type: 'a' },
      { angle: 5, type: 't' },
      { angle: 0, type: 'p', px: 100, py: '100' },
      { angle: () => {}, type: 'p', px: 90, py: 100 },
      { angle: '-70', type: '8', px: 50, py: 10 }
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
    const Shape = new Shantanu.Rect(80, 150, 30, 30, {
      fill: 'rgb(238 , 90 , 81)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape);

    const Shape1 = new Shantanu.Rect(80, 150, 30, 30, {
      fill: 'rgba(78 , 130 , 1,0.2)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape1);

    const cases = [
      { sx: 1.2, sy: 0.8, type: 'r' },
      { sx: 0.8, sy: 1.2, type: 'r' },
      { sx: 2, sy: 1.5, type: 'a' },
      { sx: 1, sy: 0.5, type: 'a' },
      { sx: -1, sy: -0.5, type: 'a' },
      { sx: 1, sy: 0.5, type: 'a' },

      { sx: 1.5, sy: 0.8, type: 'p', px: 80, py: 150 },
      { sx: 2.3, sy: 1.33, type: 'p', px: 110, py: 150 },
      { sx: 0.67, sy: 0.85, type: 'p', px: 110, py: 180 },
      { sx: 0.7, sy: 0.4, type: 'p', px: 80, py: 180 }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);
      Shape.Scale(c);
      await visualTest(Canvas, Shape);
      await delay(time);
      Shape.setSMatrix([
        [80, 150],
        [110, 150],
        [110, 180],
        [80, 180]
      ]);
    }
  });

  await toError('Scale Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Rect(150, 150, 30, 30, {
      fill: 'rgba(238 , 90 , 81 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { sx: '70', sy: 0, type: 'r' },
      { sx: 0, sy: '50', type: 'r' },
      { sx: 20, sy: '1' + '5', type: 'a' },
      { sx: 20, sy: 95, type: '' },
      { sx: 20, sy: '0', type: 'a' },
      { sx: 5, sy: 80, type: 't' },
      { sx: 70, sy: 0, type: 'p', px: 100, py: '100' },
      { sx: '-70', sy: 0, type: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);

      await ThrowError(() => Shape.Scale(c as any));
    }
  });

  // ++++++++++++ Scale End ++++++++++++++++

  // ++++++++++++ Skew ++++++++++++++++

  await vTest('Skew Transfome in Different types r , a , p ', async () => {
    const Shape = new Shantanu.Rect(20, 190, 30, 30, {
      fill: 'rgb(200 , 160 , 10)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape);

    const Shape1 = new Shantanu.Rect(20, 190, 30, 30, {
      fill: 'rgba(208 , 130 , 81,0.2)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape1);

    const cases = [
      { sx: 1.2, sy: 0, type: 'r' },
      { sx: 0, sy: 145, type: 'r' },
      { sx: 45, sy: 60, type: 'r' },
      { sx: 2, sy: 97.5, type: 'a' },
      { sx: 16.8, sy: 0.5, type: 'a' },
      { sx: -45, sy: -50, type: 'a' },
      { sx: 1, sy: 0.5, type: 'a' },

      { sx: 45, sy: 0, type: 'p', px: 20, py: 190 }, // a
      { sx: 45, sy: 0, type: 'p', px: 50, py: 190 }, // a

      { sx: 45, sy: 0, type: 'p', px: 50, py: 220 }, // b
      { sx: 45, sy: 0, type: 'p', px: 20, py: 220 }, // b

      { sx: 0, sy: 60, type: 'p', px: 20, py: 190 }, //c
      { sx: 0, sy: 60, type: 'p', px: 50, py: 190 }, // d

      { sx: 0, sy: 60, type: 'p', px: 50, py: 220 }, //d
      { sx: 0, sy: 60, type: 'p', px: 20, py: 220 }, //c

      { sx: 45, sy: 30, type: 'p', px: 20, py: 190 },
      { sx: 45, sy: 30, type: 'p', px: 50, py: 190 },

      { sx: 45, sy: 30, type: 'p', px: 50, py: 220 },
      { sx: 45, sy: 30, type: 'p', px: 20, py: 220 }
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);
      Shape.Skew(c);
      await visualTest(Canvas, Shape);
      await delay(time);
      Shape.setSMatrix([
        [20, 190],
        [50, 190],
        [50, 220],
        [20, 220]
      ]);
    }
  });

  await toError('Skew Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Rect(150, 190, 30, 30, {
      fill: 'rgba(200 , 160 , 10 , 0.6)',
      'stroke-width': 0
    });

    const cases = [
      { sx: '70', sy: 0, type: 'r' },
      { sx: 0, sy: '50', type: 'r' },
      { sx: 20, sy: '1' + '5', type: 'a' },
      { sx: 20, sy: 95, type: '' },
      { sx: 20, sy: '0', type: 'a' },
      { sx: 5, sy: 80, type: 't' },
      { sx: 70, sy: 0, type: 'p', px: 100, py: '100' },
      { sx: '-70', sy: 0, type: '8', px: 50, py: 10 }
    ];

    Canvas.addTo(Shape);

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];

      await delay(time);

      await ThrowError(() => Shape.Skew(c as any));
    }
  });

  // ++++++++++++ Skew End ++++++++++++++++

  // ++++++++++++ Flip ++++++++++++++++

  await vTest('Flip Transfome in Different types r , a , p ', async () => {
    const Shape = new Shantanu.Rect(50, 230, 30, 30, {
      fill: 'rgb(238 , 190 , 81)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape);

    const Shape1 = new Shantanu.Rect(50, 230, 30, 30, {
      fill: 'rgba(238 , 190 , 1,0.2)',
      'stroke-width': 0
    });

    Canvas.addTo(Shape1);

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
      const c = cases[i];

      await delay(time);
      Shape.Flip(c as any);
      await visualTest(Canvas, Shape);
      await delay(time);
      Shape.setSMatrix([
        [50, 230],
        [80, 230],
        [80, 260],
        [50, 260]
      ]);
    }
  });

  await toError('Skew Transfome with wtong parameter types ', async () => {
    const Shape = new Shantanu.Rect(100, 230, 30, 30, {
      fill: 'rgba(238 , 190 , 81 , 0.6)',
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
      const c = cases[i];

      await delay(time);

      await ThrowError(() => Shape.Flip(c as any));
    }
  });

  // ++++++++++++ Flip End ++++++++++++++++
	*/
}
