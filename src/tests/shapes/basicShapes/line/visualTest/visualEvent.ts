import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 1500;

export async function LineEventsTests() {
  const Canvas = new Shantanu.Canvas('testing', 250, 400);
  Canvas.attrs({
    stroke: 'rgba(255 , 255 , 255 , 0.6)',
    'stroke-width': 0
  });

  // 🔹 CLICK
  await vTest('Shapes.Basic.Line click event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 20, 40, 40, {
      stroke: 'rgba(18,130,90,0.9)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.click((e) => {
      console.log('click triggered');
      shape.attrs({ stroke: 'red' });
      console.log(shape.getAllEvents());
    });
  });

  // 🔹 DOUBLE CLICK
  await vTest('Shapes.Basic.Line double click event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(70, 20, 40, 40, {
      stroke: 'rgb(197,123,190)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.click(() => {
      console.log('click triggered on    ');
      shape.attrs({ stroke: 'blue' });
    });

    shape.dblclick(() => {
      console.log('dblclick triggered');
      shape.attrs({ stroke: 'yellow' });
      console.log(shape.getAllEvents());
    });

    shape.click(() => {
      console.log('click triggered om second ');
      shape.attrs({ stroke: 'rgba(160,23,170,0.7)' });
      console.log(shape.getAllEvents());
    });
  });

  // 🔹 MOUSEDOWN
  await vTest('Shapes.Basic.Line mouseDown event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(120, 20, 40, 40, {
      stroke: 'rgba(94 , 120 , 10,0.9)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.mouseDown((e) => {
      console.log('mouseDown triggered');
      shape.attrs({ 'stroke-width': 5, stroke: 'black' });
    });
  });

  // 🔹 MOUSEUP
  await vTest('Shapes.Basic.Line mouseUp event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(170, 20, 40, 40, {
      stroke: 'orange',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.mouseUp((e) => {
      console.log('mouseUp triggered');
      shape.attrs({ stroke: 'pink' });
    });
  });

  // 🔹 MOUSEMOVE
  await vTest('Shapes.Basic.Line mouseMove event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 70, 40, 40, {
      stroke: 'cyan',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.mouseMove((e) => {
      console.log('mouseMove triggered succesfully');
      shape.attrs({ opacity: Number(Math.random().toFixed(2)) });
    });
  });

  // 🔹 TOUCHSTART
  await vTest('Shapes.Basic.Line touchStart event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(70, 70, 40, 40, {
      stroke: 'green',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.touchStart((e) => {
      console.log('touchStart triggered');
      shape.attrs({ stroke: 'lime' });
    });
  });

  // 🔹 TOUCHEND
  await vTest('Shapes.Basic.Line touchEnd event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(120, 70, 40, 40, {
      stroke: 'magenta',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.touchEnd((e) => {
      console.log('touchEnd triggered');
      shape.attrs({ stroke: 'white' });
    });
  });

  // 🔹 TOUCHMOVE
  await vTest('Shapes.Basic.Line touchMove event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(170, 70, 40, 40, {
      stroke: 'gold',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.touchMove((e) => {
      console.log('touchMove triggered');
      shape.attrs({ x: shape.x + 5, y: shape.y + 5 });
    });
  });

  // 🔹 ENTER MOUSE
  await vTest('Shapes.Basic.Line enterMouse event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 120, 40, 40, {
      stroke: 'teal',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.enterMouse((e) => {
      console.log('enterMouse triggered');
      shape.attrs({ stroke: 'violet' });
    });
  });

  // 🔹 LEAVE MOUSE
  await vTest('Shapes.Basic.Line leaveMouse event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(70, 120, 40, 40, {
      stroke: 'brown',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.leaveMouse((e) => {
      console.log('leaveMouse triggered');
      shape.attrs({ stroke: 'gray' });
    });
  });

  // 🔹 HOVER
  await vTest('Shapes.Basic.Line hover event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(120, 120, 40, 40, {
      stroke: 'navy',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.hover(
      (e) => {
        console.log('hover enter');
        shape.attrs({ stroke: 'lightblue' });
      },
      (e) => {
        console.log('hover leave');
        shape.attrs({ stroke: 'navy' });
      }
    );
  });

  // 🔹 DRAG
  await vTest('Shapes.Basic.Line drag event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(170, 120, 40, 40, {
      stroke: 'olive',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.drag(
      (e) => {
        console.log('drag started');
        shape.attrs({ stroke: 'green' });
      },
      (e) => {
        console.log('drag moving');
      },
      (e) => {
        console.log('drag ended');
        shape.attrs({ stroke: 'olive' });
      }
    );
  });

  // 🔹 POUNTER UP
  await vTest('Shapes.Basic.Line pointer up  event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(20, 170, 40, 40, {
      stroke: 'rgb(70,24,102)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.pointerup((e) => {
      console.log('pointer up triggered');
      shape.attrs({ stroke: 'rgb(167,10,23)' });
    });
  });

  // 🔹 POUNTER DOWN
  await vTest('Shapes.Basic.Line pointer down  event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(70, 170, 40, 40, {
      stroke: 'rgb(70,244,102)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.pointerdown((e) => {
      console.log('pointer down triggered');
      shape.attrs({ stroke: 'rgb(17,10,23)' });
    });
  });

  // 🔹 POUNTER MOVE
  await vTest('Shapes.Basic.Line pointer move  event', async () => {
    const shape = new Shantanu.Shapes.Basic.Line(120, 170, 40, 40, {
      stroke: 'rgb(250,240,202)',
      'stroke-width': 4
    });
    Canvas.addTo(shape);

    shape.pointermove((e) => {
      console.log('pointer move triggered');
      shape.attrs({ stroke: 'rgb(217,100,23)' });
    });
  });
}
