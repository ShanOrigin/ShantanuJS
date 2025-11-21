import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 1000;

// Unit visual testes

export async function TriangleUnitTests() {
  // create actual canvas and Shape you want to test

  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    fill: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  await vTest('create Shape with basic propeties', async () => {
    const Shape = new Shantanu.Shapes.Custom.Triangle(100, 200, 50, 40, 90, 60);

    Canvas.addTo(Shape);

    console.log(Shape, Shape.attrs('points'));

    await visualTest(Canvas, Shape, 1);
  });

  await delay(time);
}
