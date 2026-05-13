import { Shantanu } from '../../../../../index/index.js';
import {
  visualTest,
  vTest,
  delay,
  ThrowError,
  toError
} from '../../../../vTest.js';

const time = 1500;

export async function RectEventsTests() {
  const Canvas = new Shantanu.Canvas('testing', 400, 400);
  Canvas.attrs({
    fill: 'rgb(118 , 30 , 201)',
    'stroke-width': 0
  });

  // 🔹 CLICK
  await vTest('Rect click event', async () => {
    const shape = new Shantanu.Rect(20, 20, 40, 40, {
      fill: 'rgba(18,130,90,0.9)',
      stroke: '#000'
    });
    Canvas.addTo(shape);

    shape.click((e) => {
      console.log('click triggered');
      shape.attrs({ fill: 'red' });
      console.log(shape.getAllEvents());
    });
  });

  // 🔹 DOUBLE CLICK
  await vTest('Rect double click event', async () => {
    const shape = new Shantanu.Rect(70, 20, 40, 40, {
      fill: 'rgb(197,123,190)'
    });
    Canvas.addTo(shape);

    shape.click(() => {
      console.log('click triggered on    ');
      shape.attrs({ fill: 'blue' });
    });

    shape.dblclick(() => {
      console.log('dblclick triggered');
      shape.attrs({ fill: 'yellow' });
      console.log(shape.getAllEvents());
    });

    shape.click(() => {
      console.log('click triggered om second ');
      shape.attrs({ fill: 'rgba(160,23,170,0.7)' });
      console.log(shape.getAllEvents());
    });
  });

  // 🔹 MOUSEDOWN
  await vTest('Rect mouseDown event', async () => {
    const shape = new Shantanu.Rect(120, 20, 40, 40, {
      fill: 'rgba(94 , 120 , 10,0.9)'
    });
    Canvas.addTo(shape);

    shape.mouseDown((e) => {
      console.log('mouseDown triggered');
      shape.attrs({ 'stroke-width': 5, stroke: 'black' });
    });
  });

  // 🔹 MOUSEUP
  await vTest('Rect mouseUp event', async () => {
    const shape = new Shantanu.Rect(170, 20, 40, 40, {
      fill: 'orange'
    });
    Canvas.addTo(shape);

    shape.mouseUp((e) => {
      console.log('mouseUp triggered');
      shape.attrs({ fill: 'pink' });
    });
  });

  // 🔹 MOUSEMOVE
  await vTest('Rect mouseMove event', async () => {
    const shape = new Shantanu.Rect(20, 70, 40, 40, {
      fill: 'cyan'
    });
    Canvas.addTo(shape);

    shape.mouseMove((e) => {
      console.log('mouseMove triggered succesfully');
      shape.attrs({ opacity: Number(Math.random().toFixed(2)) });
    });
  });

  // 🔹 TOUCHSTART
  await vTest('Rect touchStart event', async () => {
    const shape = new Shantanu.Rect(70, 70, 40, 40, {
      fill: 'green'
    });
    Canvas.addTo(shape);

    shape.touchStart((e) => {
      console.log('touchStart triggered');
      shape.attrs({ fill: 'lime' });
    });
  });

  // 🔹 TOUCHEND
  await vTest('Rect touchEnd event', async () => {
    const shape = new Shantanu.Rect(120, 70, 40, 40, {
      fill: 'magenta'
    });
    Canvas.addTo(shape);

    shape.touchEnd((e) => {
      console.log('touchEnd triggered');
      shape.attrs({ fill: 'white' });
    });
  });

  // 🔹 TOUCHMOVE
  await vTest('Rect touchMove event', async () => {
    const shape = new Shantanu.Rect(170, 70, 40, 40, {
      fill: 'gold'
    });
    Canvas.addTo(shape);

    shape.touchMove((e) => {
      console.log('touchMove triggered');
      shape.attrs({
        x: shape?.geometry?.x ?? 0 + 5,
        y: shape?.geometry?.y ?? 0 + 5
      });
    });
  });

  // 🔹 ENTER MOUSE
  await vTest('Rect enterMouse event', async () => {
    const shape = new Shantanu.Rect(20, 120, 40, 40, {
      fill: 'teal'
    });
    Canvas.addTo(shape);

    shape.enterMouse((e) => {
      console.log('enterMouse triggered');
      shape.attrs({ fill: 'violet' });
    });
  });

  // 🔹 LEAVE MOUSE
  await vTest('Rect leaveMouse event', async () => {
    const shape = new Shantanu.Rect(70, 120, 40, 40, {
      fill: 'brown'
    });
    Canvas.addTo(shape);

    shape.leaveMouse((e) => {
      console.log('leaveMouse triggered');
      shape.attrs({ fill: 'gray' });
    });
  });

  // 🔹 HOVER
  await vTest('Rect hover event', async () => {
    const shape = new Shantanu.Rect(120, 120, 40, 40, {
      fill: 'navy'
    });
    Canvas.addTo(shape);

    shape.hover(
      (e) => {
        console.log('hover enter');
        shape.attrs({ fill: 'lightblue' });
      },
      (e) => {
        console.log('hover leave');
        shape.attrs({ fill: 'navy' });
      }
    );
  });

  // 🔹 DRAG
  await vTest('Rect drag event', async () => {
    const shape = new Shantanu.Rect(170, 120, 40, 40, {
      fill: 'olive'
    });
    Canvas.addTo(shape);

    shape.drag(
      (e) => {
        console.log('drag started');
        shape.attrs({ fill: 'green' });
      },
      (e) => {
        console.log('drag moving');
      },
      (e) => {
        console.log('drag ended');
        shape.attrs({ fill: 'olive' });
      }
    );
  });

  // 🔹 POUNTER UP
  await vTest('Rect pointer up  event', async () => {
    const shape = new Shantanu.Rect(20, 170, 40, 40, {
      fill: 'rgb(70,24,102)',
      'stroke-width': 1
    });
    Canvas.addTo(shape);

    shape.pointerup((e) => {
      console.log('pointer up triggered');
      shape.attrs({ fill: 'rgb(167,10,23)' });
    });
  });

  // 🔹 POUNTER DOWN
  await vTest('Rect pointer down  event', async () => {
    const shape = new Shantanu.Rect(70, 170, 40, 40, {
      fill: 'rgb(70,244,102)',
      'stroke-width': 1
    });
    Canvas.addTo(shape);

    shape.pointerdown((e) => {
      console.log('pointer down triggered');
      shape.attrs({ fill: 'rgb(17,10,23)' });
    });
  });

  // 🔹 POUNTER MOVE
  await vTest('Rect pointer move  event', async () => {
    const shape = new Shantanu.Rect(120, 170, 40, 40, {
      fill: 'rgb(250,240,202)',
      'stroke-width': 1
    });
    Canvas.addTo(shape);

    shape.pointermove((e) => {
      console.log('pointer move triggered');
      shape.attrs({ fill: 'rgb(217,100,23)' });
    });
  });
}
