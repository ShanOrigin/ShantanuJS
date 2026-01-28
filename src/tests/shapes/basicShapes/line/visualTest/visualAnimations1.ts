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

export async function LineAnimationTests() {
  // create actual canvas and Shape you want to test

  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    stroke: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  /*

  await vTest(
    ' testing manual chained ,  batched transformations and .attrs() method on Different shape    s   ',
    async () => {
      // 1. Basic attribute animation
      const line1 = new Shantanu.Shapes.Basic.Line(20, 20, 50, 20, {
        stroke: 'red',
        'stroke-width': 2
      });
      Canvas.addTo(line1);
      line1.animate({ stroke: 'blue', 'stroke-width': 5 }, null, 500, 'linear');
      await delay(time);
    }
  );

  const line2 = new Shantanu.Shapes.Basic.Line(20, 20, 20, 40, {
    stroke: 'rgb(120 , 140 , 90)',
    'stroke-width': 2
  });
  Canvas.addTo(line2);

  const line21 = new Shantanu.Shapes.Basic.Line(20, 20, 20, 40, {
    stroke: 'rgb(40 , 70 , 120)',
    'stroke-width': 2
  });
  Canvas.addTo(line21);

  line2.animate(
    { translate: { x: 50, y: 40 } },
    {
      controls: { optimizationTechnique: 'preComputeFrames' },
      pivot: { mode: 'r' }
    },
    800,
    'easeInOutQuad'
  );
  await delay(time);
  line21.Translate({ x: 50, y: 40, tType: 'r' });

  await delay(time);


  const line3 = new Shantanu.Shapes.Basic.Line(20, 20, 20, 40, {
    stroke: 'rgb(140 , 70 , 120)',
    'stroke-width': 2
  });
  Canvas.addTo(line3);

  const line31 = new Shantanu.Shapes.Basic.Line(20, 20, 20, 40, {
    stroke: 'rgb(40 , 170 , 120)',
    'stroke-width': 2
  });
  Canvas.addTo(line31);

  line3.animate(
    { translate: { x: 50, y: 40 }, skew: { sx: 15 } },
    {
      physics: { physicsMotion: false },
      curve: { curvePathMotion: true, curvePath: 'cubic', stepness: 0.7 },
      controls: { optimizationTechnique: 'preComputeFrames' },
      pivot: { skewPivot: 'TL' }
    },
    2000,
    'easeInBounce'
  );
  await delay(time * 3);

  line31
    .beginT()

    .Translate({ x: 50, y: 40, tType: 'r' })
    .Skew({ sx: 15, sy: 0, tType: 'p', px: 20, py: 20 })
    .endT();

		*/

  /* ***IMPORTANT***
	if you create opposite shape and there is a translation available in that animation then the curve formation which is like tracing path will respect shape first point okay which is the starting point of that shape and resolution will respect the bounding box for example from starting point of shape to the translation point and shape will follow the orship rotation and any other is top left of bounding box in relative mode okay which is by default mode

When translation + curvePathMotion is enabled
Curve is generated between:
shape’s first point (local origin)
translation vector
Curve path is correct in shape-local space
Meanwhile, pivot resolution for other transforms (rotate/scale/skew):
Default mode = relative
Relative mode resolves pivot to:
top-left of bounding box
For an “opposite” shape:
bounding-box top-left ≠ shape’s first point


		*/

  const rect21 = new Shantanu.Shapes.Basic.Line(20, 40, 20, 20, {
    stroke: 'rgb(90, 160 , 50)',
    'stroke-width': 2
  });
  Canvas.addTo(rect21);
  rect21.animate(
    { translate: { x: 50, y: 40 }, rotate: { angle: 360 } },
    {
      curve: {
        curvePathMotion: true,
        curvePath: 'quadratic',
        stepness: 0.9
      },
      pivot: { mode: 'r' }
    },
    3500,
    'easeInOutBounce'
  );
  await delay(time * 4);

  const rect22 = new Shantanu.Shapes.Basic.Line(20, 40, 20, 20, {
    stroke: 'rgb(230 , 70 , 50)',
    'stroke-width': 2
  });
  Canvas.addTo(rect22);
  await delay(time);
  rect22.animate(
    { translate: { x: 70, y: 70 } },
    {
      curve: { curvePathMotion: true, curvePath: 'quadratic', stepness: 0.7 },
      pivot: { mode: 'r' },
      physics: { physicsMotion: true, speed: 0.2 }
    },
    3000,
    'easeOutBounce'
  );
  await delay(time * 4);

  const rect23 = new Shantanu.Shapes.Basic.Line(20, 40, 20, 20, {
    stroke: 'rgb(230 , 120 , 50)',
    'stroke-width': 2
  });
  Canvas.addTo(rect23);
  rect23.animate(
    { x2: 40, translate: { x: 0, y: 70 } },
    {
      curve: { curvePathMotion: true, curvePath: 'earc', stepness: 1.7 },
      pivot: { scalePivot: 'C' },
      physics: { physicsMotion: true },
      controls: {
        optimizationTechnique: 'preComputeFrames'
      }
    },
    1400,
    'easeOutBounce'
  );
  await delay(time);

  /*

  // 3. Scale with pivot
  const rect3 = new Shantanu.Shapes.Basic.Line(20, 80, 20, 100, {
    stroke: 'orange',
    'stroke-width': 2
  });
  Canvas.addTo(rect3);

  const rect31 = new Shantanu.Shapes.Basic.Line(20, 80, 20, 100, {
    stroke: 'rgba(170 , 100 , 16 , 0.5)',
    'stroke-width': 2
  });
  Canvas.addTo(rect31);

  await delay(time);
  rect3.animate(
    { scale: { sx: 3, sy: 2 } },
    { pivot: { scalePivot: 'BR' } },
    1000,
    'easeOutBounce'
  );

  await delay(time);
  rect31.beginT().Scale({ sx: 3, sy: 2, tType: 'p', px: 20, py: 100 }).endT();
  // 4. Rotate
  const rect4 = new Shantanu.Shapes.Basic.Line(60, 80, 30, 30, {
    stroke: 'purple',
    'stroke-width': 2
  });
  Canvas.addTo(rect4);

  const rect41 = new Shantanu.Shapes.Basic.Line(60, 80, 30, 30, {
    stroke: 'purple',
    'stroke-width': 2
  });
  Canvas.addTo(rect41);
  await delay(time);
  rect4.animate(
    { rotate: { angle: 180 } },
    { pivot: { rotatePivot: 'RM' } },
    600,
    'easeInOutBounce'
  );
  await delay(time);
  rect41.beginT().Rotate({ angle: 180, tType: 'p', px: 60, py: 55 }).endT();


	
  // 5. Skew
  const rect5 = new Shantanu.Shapes.Basic.Line(150, 80, 30, 30, {
    stroke: 'pink'
  });
  Canvas.addTo(rect5);

  const rect51 = new Shantanu.Shapes.Basic.Line(150, 80, 30, 30, {
    stroke: 'rgba(150 , 70 , 120 , 0.6)'
  });
  Canvas.addTo(rect51);

  rect5.animate(
    { skew: { sx: 20, sy: 10 } },
    { pivot: { mode: 'p', skewPivot: 'TL' } },
    700,
    'easeInQuad'
  );

  await delay(time);
  rect51.Skew({ sx: 20, sy: 10, tType: 'p', px: 30, py: 30 });

  await delay(time);


  // 10. Multiple chained animations
  const rect10 = new Shantanu.Shapes.Basic.Line(20, 130, 30, 30, {
    stroke: 'teal'
  });
  Canvas.addTo(rect10);

  const rect101 = new Shantanu.Shapes.Basic.Line(20, 130, 30, 30, {
    stroke: 'teal'
  });
  Canvas.addTo(rect101);

  rect10.animate(
    { translate: { x: 100, y: 0 }, stroke: 'navy' },
    null,
    500,
    'easeInOutQuad'
  );

  await delay(time);
  rect10.animate(
    { rotate: { angle: 360 }, scale: { sx: 0.5, sy: 2 } },
    { pivot: { rotatePivot: 'C' } },
    800,
    'easeInOutCubic'
  );

  console.log('All test cases completed!');

  // 7. Looping animation
  /*
      const rect7 = new Shantanu.Shapes.Basic.Line(160, 130, 50, 50, { stroke: 'yellow' });
      Canvas.addTo(rect7);
      await rect7.animate(
        {
          translate: { x: 100, y: 0 },
          width: 20,
          height: 25,
          rotate: { angle: 180 }
        },
        { controls: { loop: false, direction: 'reverse' } },
        1000,
        'easeInOutCubic'
      );
      await delay(time);

      const rect11 = new Shantanu.Shapes.Basic.Line(20, 170, 50, 50, {
        stroke: 'rgb(150, 70 , 30)'
      });
      Canvas.addTo(rect11);
      await rect11.animate(
        {
          translate: { x: 100, y: 0 },
          width: 20,
          height: 25,
          rotate: { angle: 180 }
        },
        { controls: { loop: false, direction: 'alternate' } },
        1000,
        'easeInOutCubic'
      );
      await delay(time);

      const rect12 = new Shantanu.Shapes.Basic.Line(20, 220, 30, 30, {
        stroke: 'rgb(150, 70 , 30)'
      });
      Canvas.addTo(rect12);
      const a1 = rect12.animatia(
        {
          translate: { x: 100, y: 0 },
          width: 20,
          height: 25,
          rotate: { angle: 180 }
        },
        { controls: { loop: true, direction: 'alternate' } },
        1000,
        'easeInOutCubic'
      );

      const rect13 = new Shantanu.Shapes.Basic.Line(150, 220, 30, 30, {
        stroke: 'rgb(150, 170 , 30)'
      });
      Canvas.addTo(rect13);
      const a2 = rect13.animatia(
        {
          translate: { x: 100, y: 0 },
          width: 20,
          height: 25,
          rotate: { angle: 180 }
        },
        { controls: { loop: true, direction: 'reverse' } },
        1000,
        'easeInOutCubic'
      );
      await delay(time);
      // await a1.start();

      console.log(a1, a2);
      Promise.all([a1.start(), a2.start()]);
			*/
}
