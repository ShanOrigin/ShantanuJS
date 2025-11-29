import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 1500;
// Utility function to pick a random element from an array
const choice = function <T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
};
export async function LineFiltersTests() {
  const Canvas = new Shantanu.Canvas('testing', 250, 400);
  Canvas.attrs({
    stroke: 'rgb(201 , 201, 201)',
    'stroke-width': 2
  });

  // 🔹 BLUR
  await vTest('Blur filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 20, 50, 50, {
      stroke: 'rgba(18,130,90,0.9)'
    });
    Canvas.addTo(shape);

    console.log('blur filter');

    shape.click((e) => {
      shape.blur(Math.random());
    });
  });

  // 🔹 GLOW
  await vTest('Blur filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(80, 20, 50, 50, {
      stroke: 'rgba(108,10,90,0.9)'
    });
    Canvas.addTo(shape);

    console.log('glow filter');

    shape.click((e) => {
      shape.glow(Math.random() * 10);
    });
  });

  // 🔹 BOX SHADOW
  await vTest('Box shadow filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(140, 20, 50, 50, {
      stroke: 'rgba(108,10,190,0.7)'
    });
    Canvas.addTo(shape);

    console.log('glow filter');

    shape.click((e) => {
      const x = Math.random() * 10;
      const y = Math.random() * 10;
      console.log(' x ', x, 'y ', y);
      shape.boxShadow({
        offsetX: x,
        offsetY: y,

        opacity: Math.random(),
        color: 'rgb(50,34,12)',
        blur: Math.random() * 10
      });
    });
  });

  // 🔹 INNER SHADOW
  await vTest('inner shadow filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 80, 50, 50, {
      stroke: 'rgba(200, 10,60,0.9)'
    });
    Canvas.addTo(shape);

    shape.click((e) => {
      const x = Math.random() * 20;
      const y = Math.random() * 20;

      shape.innerShadow({
        offsetX: x,
        offsetY: y,

        opacity: Math.random(),
        color: 'rgb(50,34,12)',
        blur: Math.random() * 10
      });
    });
  });

  // 🔹 LINEAR GRADIANT
  await vTest('Linear Gradiant filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(80, 80, 50, 50, {
      stroke: 'rgba(218,200,200,0.9)'
    });
    Canvas.addTo(shape);

    shape.click((e) => {
      console.log(' Linear Gradiant filter');

      shape.linearGradient({
        direction: choice([
          'LR',
          'RL',
          'TB',
          'BT',
          'TLBR',
          'BRTL',
          'TRBL',
          'BLTR'
        ]),

        stops: [
          { color: 'rgb(200, 10, 10)', offset: 0 },
          { color: 'rgb(200, 10, 10)' },
          { color: 'rgb(10, 200, 10)' },
          { color: 'rgb(10, 10, 200)' },
          { color: 'rgb(10, 10, 200)' }
        ]
      });
    });
  });

  // 🔹 RADICAL GRADIANT
  await vTest('Radical Gradiant filter test ', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(140, 80, 50, 50, {
      stroke: 'rgba(150,150,150,0.9)'
    });
    Canvas.addTo(shape);

    shape.click((e) => {
      console.log(' Linear Gradiant filter');

      // BL , BR , TL , TR
      shape.radialGradient({
        direction: choice(['CENTER', 'TL', 'TR', 'BL', 'BR']),
        focalX: 20,
        radius: 50,
        focalY: 100,
        stops: [
          { color: 'red' },
          { color: 'red' },
          { color: 'green' },
          { color: 'blue' },
          { color: 'blue' }
        ]
      });
    });

    // 🔹 LIGHTNING
    await vTest('Lightning filter test ', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(20, 150, 50, 50, {
        stroke: 'rgba(18,10,90,1)'
      });
      Canvas.addTo(shape);

      console.log('Lightning filter');

      shape.click((e) => {
        shape.lightEffect({
          lightingColor: `rgb( ${Math.random() * 255} ,  ${
            Math.random() * 255
          } ,  ${Math.random() * 5} )`,
          intensityOfLight: Math.random() * 255,
          verticalAngleOfLight: Math.random() * 180,
          horizontalAngleOfLight: Math.random() * 180,
          surfaceScale: Math.random()
        });
      });
    });

    // 🔹 DISPLACEMENT
    await vTest('Displacement filter test', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(80, 150, 50, 50, {
        stroke: 'rgba(80,120,170,1)'
      });
      Canvas.addTo(shape);

      console.log('Displacement filter test initialized');

      shape.click((e) => {
        shape.displacementEffect({
          detailLevel: Math.random() * 10,
          randomSeed: Math.random() * 10,
          distortDirectionX: choice(['R', 'G', 'B', 'A']),
          distortDirectionY: choice(['R', 'G', 'B', 'A']),
          distortionAmount: Math.random() * 10,
          waveFrequency: Math.random(),
          patternStyle: choice(['fractalNoise', 'turbulence'])
        });
      });
    });

    // 🔹 NEO OUTER MORPH
    await vTest('Neo Morph filter test', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(250, 20, 50, 50, {
        stroke: '#e6eef6',

        'stroke-width': 2
      });
      Canvas.addTo(shape);

      console.log('neo outer morph  filter test initialized');

      shape.click((e) => {
        shape.neuMorph({
          type: 'outer',
          backgroundColor: '#e6eef6',
          outerShadowColor: '#b8c9db',
          highlightColor: '#ffffff',

          // outer shadow
          outerBlur: 10,
          outerOffsetX: 8,
          outerOffsetY: 8,
          outerShadowOpacity: 0.85,

          // highlight (top-left)
          highlightBlur: 6,
          highlightOffsetX: -6,
          highlightOffsetY: -6,
          highlightOpacity: 0.9,
          innerShadowColor: '#000000',

          // inner shadow
          innerBlur: 6,
          innerOffsetX: 4,
          innerOffsetY: 4,
          innerShadowOpacity: 0.12
        });
      });
    });

    // 🔹 NEO INNER MORPH
    await vTest('Neo Morph filter test', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(250, 100, 50, 50, {
        stroke: '#e6eef6',

        'stroke-width': 2
      });
      Canvas.addTo(shape);

      console.log('neo inner morph  filter test initialized');

      shape.click((e) => {
        shape.neuMorph({
          type: 'inner',
          backgroundColor: '#e6eef6',
          outerShadowColor: '#b8c9db',
          highlightColor: '#ffffff',

          // outer shadow
          outerBlur: 10,
          outerOffsetX: 8,
          outerOffsetY: 8,
          outerShadowOpacity: 0.85,

          // highlight (top-left)
          highlightBlur: 6,
          highlightOffsetX: -6,
          highlightOffsetY: -6,
          highlightOpacity: 0.9,
          innerShadowColor: '#000000',

          // inner shadow
          innerBlur: 6,
          innerOffsetX: 4,
          innerOffsetY: 4,
          innerShadowOpacity: 0.12
        });
      });
    });

    // 🔹 NEO FULL MORPH
    await vTest('Neo Morph filter test', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(250, 180, 50, 50, {
        stroke: '#e6eef6',

        'stroke-width': 2
      });
      Canvas.addTo(shape);

      console.log('neo full morph  filter test initialized');

      shape.click((e) => {
        shape.neuMorph({
          type: 'full',
          backgroundColor: '#e6eef6',
          outerShadowColor: '#b8c9db',
          highlightColor: '#ffffff',

          // outer shadow
          outerBlur: 10,
          outerOffsetX: 8,
          outerOffsetY: 8,
          outerShadowOpacity: 0.85,

          // highlight (top-left)
          highlightBlur: 6,
          highlightOffsetX: -6,
          highlightOffsetY: -6,
          highlightOpacity: 0.9,
          innerShadowColor: '#000000',

          // inner shadow
          innerBlur: 6,
          innerOffsetX: 4,
          innerOffsetY: 4,
          innerShadowOpacity: 0.12
        });
      });
    });

    // 🔹 GLASS MORPH
    await vTest('inner shadow filter test ', async () => {
      const shape = new Shantanu.Shapes.Basic.Line(20, 250, 50, 50, {
        stroke: 'rgba(200, 10,60,0.6)',

        'stroke-width': 2
      });
      Canvas.addTo(shape);

      shape.click((e) => {
        shape.glassMorph({
          blurAmount: 0.4,
          frostOpacity: 0.7
        });
      });
    });
  });
}
