import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 1500;

// Unit visual testes

export async function LineCombineTests() {
  // create actual canvas and Shape you want to test

  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    fill: 'rgba( 255 , 255 , 255 , 0.9)',
    'stroke-width': 0
  });

  await vTest(
    ' testing manual chained ,  batched transformations and .attrs() method on Different shapes   ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(20, 40, 10, 10, {
        stroke: 'rgba(78 , 130 , 190,1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape);
      await delay(time);
      const Shape1 = new Shantanu.Shapes.Basic.Line(35, 50, 30, 35, {
        stroke: 'rgba(178 , 10 , 190 , 1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape1);
      await delay(time);
      const Shape2 = new Shantanu.Shapes.Basic.Line(35, 50, 30, 35, {
        stroke: 'rgba(178 , 130 , 90 , 1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape2);
      await delay(time);
      Shape1.beginT();

      await delay(time);
      Shape.Skew({ sx: 3, sy: 4 });
      Shape1.Skew({ sx: 3, sy: 4 });
      Shape2.Skew({ sx: 3, sy: 4 });

      await delay(time);
      Shape.Rotate({ angle: 45, tType: 'p', px: 35, py: 50 });
      Shape1.Rotate({ angle: 45, tType: 'p', px: 35, py: 50 });
      Shape2.Rotate({ angle: 45, tType: 'p', px: 35, py: 50 });

      await delay(time);
      Shape.Rotate({ angle: -45 });
      Shape1.Rotate({ angle: -45 });

      await delay(time);
      Shape.Skew({ sx: -3, sy: 0 });
      Shape.Skew({ sx: 0, sy: -4 });
      Shape1.Skew({ sx: -3, sy: 0 });
      Shape1.Skew({ sx: 0, sy: -4 });

      await delay(time);
      Shape.Scale({ sx: 0.5, sy: 0.425 });
      Shape1.Scale({ sx: 0.6, sy: 0.725 });

      await delay(time);
      Shape.Skew({ sx: 3, sy: 4 });
      Shape1.Skew({ sx: 3, sy: 4 });

      await delay(time);
      Shape.Rotate({ angle: 45 });
      Shape1.Rotate({ angle: 45 });

      await delay(time);
      Shape.Translate({ x: 35, y: 50, tType: 'a' });
      Shape1.Translate({ x: 35, y: 50, tType: 'a' });
      Shape1.endT();

      await visualTest(Canvas, Shape);
      await visualTest(Canvas, Shape1);
      await visualTest(Canvas, Shape2);
    }
  );

  await vTest(
    ' testing manual chained ,  batched transformations , .attrs() method and .transform() method on each Different shapes  ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(100, 40, 10, 10, {
        x1: 15,
        y1: 10,
        x2: 40,
        y2: 20,

        stroke: 'rgba(78 , 30 , 190 , 1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape);
      await delay(time);
      // approch 1 : chain transformation execute one by one independentlly
      const Shape1 = new Shantanu.Shapes.Basic.Line(100, 50, 50, 30, {
        stroke: 'rgba(18 , 130 , 180 , 1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape1);
      await delay(time);
      // manual batching by user
      // approch 2 : chain transformation for batching by .beginT() starts batching .endT() execute batch as composed transformation at end
      const Shape2 = new Shantanu.Shapes.Basic.Line(100, 50, 50, 30, {
        stroke: 'rgba(178 , 30 , 90 , 1)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape2);
      await delay(time);
      // internal batching by sysytem
      // approch 3 : string data as  transformation string it batches internally  and execute batch as composed transformation at end
      const Shape3 = new Shantanu.Shapes.Basic.Line(100, 50, 50, 30, {
        stroke: 'rgba(8 , 130 , 90 , 0.7)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape3);

      // shocking thing is all 3 approch giving extaclly same result visualy for below operations
      await delay(time);
      Shape1.beginT();

      await delay(time);
      Shape.Rotate({ angle: 45, tType: 'p', px: 100, py: 50 });
      Shape1.Rotate({ angle: 45, tType: 'p', px: 100, py: 50 });
      Shape2.Rotate({ angle: 45, tType: 'p', px: 100, py: 50 });

      await delay(time);
      Shape.Rotate({ angle: -45 });
      Shape1.Rotate({ angle: -45 });

      await delay(time);
      Shape.Scale({ sx: 1.5, sy: 1.25 });
      Shape1.Scale({ sx: 1.5, sy: 1.25 });

      await delay(time);
      Shape.Rotate({ angle: 45 });
      Shape1.Rotate({ angle: 45 });

      await delay(time);
      Shape.Translate({ x: 100, y: 50, tType: 'a' });
      Shape1.Translate({ x: 100, y: 50, tType: 'a' });
      Shape1.endT();

      Shape2.attrs({ x1: 75, y1: 40, x2: 100, y2: 50 });

      Shape3.transform('R(45,p,100,100) R(-45) S(1.5 , 1.25) R(45) T(100,50)');
      await visualTest(Canvas, Shape);
      await visualTest(Canvas, Shape1);
      await visualTest(Canvas, Shape2);
      await visualTest(Canvas, Shape3);

      const Shape4 = new Shantanu.Shapes.Basic.Line(100, 50, 50, 30, {
        stroke: 'rgba(8 , 30 , 90 , 0.7)',
        'stroke-width': 2
      });

      Canvas.addTo(Shape4);
    }
  );

  await vTest(
    ' testing .transform() method with chained transformation and batched transformation ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(20, 160, 10, 10, {
        stroke: 'rgba(78 , 30 , 190,1)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape);
      await delay(time);

      const Shape1 = new Shantanu.Shapes.Basic.Line(20, 160, 10, 10, {
        stroke: 'rgba(178 , 130 , 90, 1)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape1);
      await delay(time);
      const Shape2 = new Shantanu.Shapes.Basic.Line(20, 160, 10, 10, {
        stroke: 'rgba(78 , 130 , 90, )',
        'stroke-width': 2
      });
      Canvas.addTo(Shape2);
      await delay(time);
      const Shape3 = new Shantanu.Shapes.Basic.Line(20, 160, 10, 10, {
        stroke: 'rgba(78 , 30 , 0 , 1 )',
        'stroke-width': 2
      });
      Canvas.addTo(Shape3);

      await delay(time);
      Shape.Scale({ sx: 1.5, sy: 1.5 });
      await delay(time);
      Shape.transform('R(60)T(10,10,r)');
      await delay(time);
      Shape.Rotate({ angle: 30, tType: 'p', px: 37.74, py: 164.75 });

      console.log(Shape);

      await delay(time);
      Shape1.Scale({ sx: 1.5, sy: 1.5 })
        .transform('R(60)T(10,10,r)')
        .Rotate({ angle: 30, tType: 'p', px: 37.74, py: 164.75 });
      await delay(time);

      Shape2.beginT(); // start batching
      Shape2.Scale({ sx: 1.5, sy: 1.5 });
      await delay(time);
      Shape2.transform('R(60)T(10,10,r)');
      await delay(time);
      Shape2.Rotate({ angle: 30, tType: 'p', px: 37.74, py: 164.75 });
      Shape2.endT(); // end batching and apply

      await delay(time);

      Shape3.beginT() // start batching
        .Scale({ sx: 1.5, sy: 1.5 })
        .transform('R(60)T(10,10,r)')
        .Rotate({ angle: 30, tType: 'p', px: 37.74, py: 164.75 })
        .endT(); // // end batching and apply

      await delay(time);

      await visualTest(Canvas, Shape);
      await visualTest(Canvas, Shape1);
      await visualTest(Canvas, Shape2);
      await visualTest(Canvas, Shape3);
    }
  );

  await vTest(
    ' testing .attrs() method in between manual transformation ',
    async () => {
      const Shape4 = new Shantanu.Shapes.Basic.Line(10, 50, 30, 40, {
        stroke: 'rgba(178 , 20 , 90,1)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape4);
      await delay(time);

      const Shape5 = new Shantanu.Shapes.Basic.Line(10, 50, 30, 40, {
        stroke: 'rgba(78 , 20 , 90,1)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape5);
      await delay(time);

      Shape5.attrs({ x1: 40, y1: 90 });
      await delay(time);
      Shape4.attrs({ x1: 30, y1: 50, x2: 20, y2: 10 });
      await delay(time);
      Shape5.attrs({ x1: 40, y1: 100 });
      await delay(time);
      Shape5.attrs({ x2: 70 });

      await delay(time);
      Shape4.attrs({ x1: 30, x2: -20, y2: -10 });
      Shape4.toFront();
    }
  );

  await vTest(
    ' testing .attrs() method in between manual transformation ',
    async () => {
      //console.error(' there is something error in attrs method check latter ');
      const Shape = new Shantanu.Shapes.Basic.Line(100, 160, 10, 10, {
        stroke: 'rgba(78 , 130 , 190,0.5)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape);

      await delay(time);

      const Shape1 = new Shantanu.Shapes.Basic.Line(100, 160, 10, 10, {
        stroke: 'rgba(178 , 10 , 190,0.5)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape1);

      const Shape2 = new Shantanu.Shapes.Basic.Line(100, 160, 10, 10, {
        stroke: 'rgba(178 , 200 , 190, 0.85)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape2);

      await delay(time);
      Shape.Scale({ sx: 1.3, sy: 1.5 });
      await delay(time);
      Shape.attrs({ stroke: 'red', x1: 50, y1: 100, x2: 30, y2: 40 });
      await delay(time);
      Shape.transform('R(60)');
      await delay(time);

      Shape.transform('R(30)');

      await delay(time);

      Shape.attrs({ stroke: 'blue', x1: 100, y1: 160, x2: 10, y2: 10 });
      await delay(time);
      Shape.Rotate({ angle: -90, tType: 'p', px: 100, py: 160 });

      await delay(time);
      Shape1.Scale({ sx: 1.3, sy: 1.5 });
      await delay(time);
      Shape1.attrs({ stroke: 'blue', x1: 50, y1: 100, x2: 30, y2: 40 });
      await delay(time);
      Shape1.Rotate({ angle: 60 });

      await delay(time);
      Shape1.Rotate({ angle: 30 });
      await delay(time);
      Shape1.attrs({ stroke: 'green', x1: 100, y1: 160, x2: 10, y2: 10 });
      await delay(time);
      Shape1.Rotate({ angle: -90, tType: 'p', px: 100, py: 160 });

      await delay(time);
      Shape2.Scale({ sx: 1.3, sy: 1.5 });
      await delay(time);
      Shape2.attrs({ stroke: 'blue', x1: 50, y1: 100, x2: 30, y2: 40 });
      await delay(time);
      Shape2.Rotate({ angle: 60 });

      await delay(time);
      Shape2.transform('R(30)');
      await delay(time);
      Shape2.attrs({ stroke: 'purple', x1: 100, y1: 160, x2: 10, y2: 10 });
      await delay(time);
      Shape2.Rotate({ angle: -90, tType: 'p', px: 100, py: 160 });
      await visualTest(Canvas, Shape);
      await visualTest(Canvas, Shape1);
      await visualTest(Canvas, Shape2);
    }
  );

  await toError(
    ' testing .attrs() method in between batch mode .beginT() and .endT() ',
    async () => {
      const Shape = new Shantanu.Shapes.Basic.Line(100, 120, 10, 10, {
        x2: 90,
        y2: 80,

        stroke: 'rgba(78 , 130 , 190,0.5)',
        'stroke-width': 2
      });
      Canvas.addTo(Shape);

      await ThrowError(async () => {
        Shape.beginT().Scale({ sx: 1.3, sy: 1.5 });
        Shape.transform('R(60)T(10,10 ,r)');
        Shape.Rotate({ angle: 30 });
        Shape.attrs({ stroke: 'red', x1: 5 });
        Shape.endT();
      });
    }
  );
}
