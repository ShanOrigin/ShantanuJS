import { rotate } from 'happy-dom/lib/PropertySymbol.js';
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

export async function RectAnimationTests() {
  // create actual canvas and Shape you want to test

  const Canvas = new Shantanu.Canvas('testing', 200, 400);

  Canvas.attrs({
    fill: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  await vTest(
    ' testing manual chained ,  batched transformations and .attrs() method on Different shape    s   ',
    async () => {
      // 1. Basic attribute animation
      const rect1 = new Shantanu.Rect(150, 20, 20, 20, {
        fill: 'red',
        'stroke-width': 2
      });
      Canvas.addTo(rect1);
      await rect1.animate(
        { fill: 'blue', 'stroke-width': 5 },
        null,
        500,
        'linear'
      );
      await delay(time);
      // 2. Translate rectangle
      //
      //

      const rect00 = new Shantanu.Rect(20, 40, 20, 20, {
        fill: 'rgb(120 , 140 , 90)'
      });
      Canvas.addTo(rect00);
      await rect00.animate(
        { translate: { x: 70, y: 40 } },
        null,
        800,
        'easeInOutQuad'
      );
      await delay(time);

      const rect2 = new Shantanu.Rect(20, 40, 20, 20, {
        fill: 'rgb(40 , 70 , 120)'
      });
      Canvas.addTo(rect2);
      await rect2.animate(
        { translate: { x: 70, y: 40 }, skew: { sx: 30 } },
        {
          physics: { physicsMotion: false },
          curve: { curvePathMotion: true, curvePath: 'cubic', stepness: 0.7 },
          pivot: { skewPivot: [20, 20] }
        },
        800,
        'easeInBounce'
      );
      await delay(time);

      const rect21 = new Shantanu.Rect(20, 40, 20, 20, {
        fill: 'rgb(90, 160 , 50)'
      });
      Canvas.addTo(rect21);
      await rect21.animate(
        { translate: { x: 70, y: 40 }, rotate: { angle: 360 } },
        {
          curve: {
            curvePathMotion: true,
            curvePath: 'quadratic',
            stepness: 0.9
          },
          pivot: { rotatePivot: [20, 20] }
        },
        800,
        'easeInOutBounce'
      );
      await delay(time);

      const rect22 = new Shantanu.Rect(20, 40, 20, 20, {
        fill: 'rgb(230 , 70 , 50)'
      });
      Canvas.addTo(rect22);
      await rect22.animate(
        { width: 30, height: 30, opacity: 0.4, translate: { x: 70, y: 40 } },
        {
          curve: { curvePathMotion: true, curvePath: 'arc', stepness: 0.7 },
          pivot: { scalePivot: 'C' },
          physics: { physicsMotion: true }
        },
        800,
        'easeOutBounce'
      );
      await delay(time);

      const rect23 = new Shantanu.Rect(20, 40, 20, 20, {
        fill: 'rgb(230 , 120 , 50)'
      });
      Canvas.addTo(rect23);
      await rect23.animate(
        { translate: { x: 70, y: 40 } },
        {
          curve: { curvePathMotion: true, curvePath: 'earc', stepness: 1.7 },
          pivot: { scalePivot: 'C' },
          //        physics: { physicsMotion: true },
          controls: {
            optimizationTechnique: 'preComputeFrames'
          }
        },
        800,
        'easeOutBounce'
      );
      await delay(time);

      // 3. Scale with pivot
      const rect3 = new Shantanu.Rect(20, 80, 10, 15, { fill: 'orange' });
      Canvas.addTo(rect3);
      await rect3.animate(
        { scale: { sx: 3, sy: 2 } },
        { pivot: { scalePivot: 'BR' } },
        1000,
        'easeOutBounce'
      );
      await delay(time);
      // 4. Rotate
      const rect4 = new Shantanu.Rect(60, 80, 30, 30, { fill: 'purple' });
      Canvas.addTo(rect4);
      await rect4.animate(
        { rotate: { angle: 180 } },
        { pivot: { rotatePivot: 'RM' } },
        600,
        'easeInOutBounce'
      );
      await delay(time);

      // 5. Skew
      const rect5 = new Shantanu.Rect(150, 80, 30, 30, { fill: 'pink' });
      Canvas.addTo(rect5);
      await rect5.animate(
        { skew: { sx: 20, sy: 10 } },
        { pivot: { mode: 'p', skewPivot: 'TL' } },
        700,
        'easeInQuad'
      );

      await delay(time);

      await delay(time);
      // 10. Multiple chained animations
      const rect10 = new Shantanu.Rect(20, 130, 30, 30, { fill: 'teal' });
      Canvas.addTo(rect10);
      await rect10.animate(
        { translate: { x: 100, y: 0 }, fill: 'navy' },
        null,
        500,
        'easeInOutQuad'
      );
      await delay(time);
      await rect10.animate(
        { rotate: { angle: 360 }, scale: { sx: 0.5, sy: 2 } },
        { pivot: { rotatePivot: 'C' } },
        800,
        'easeInOutCubic'
      );

      console.log('All test cases completed!');

      // 7. Looping animation

      const rect7 = new Shantanu.Rect(160, 130, 50, 50, { fill: 'yellow' });
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

      const rect11 = new Shantanu.Rect(20, 170, 50, 50, {
        fill: 'rgb(150, 70 , 30)'
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

      const rect12 = new Shantanu.Rect(20, 220, 30, 30, {
        fill: 'rgb(150, 70 , 30)'
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

      const rect13 = new Shantanu.Rect(150, 220, 30, 30, {
        fill: 'rgb(150, 170 , 30)'
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
    }
  );
}
