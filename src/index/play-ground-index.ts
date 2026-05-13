/*
import { ShantanuJS as s } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try {

      const xyA: s.Line[] = [];
      const xyB: s.Line[] = [];
      const yzA: s.Line[] = [];
      const yzB: s.Line[] = [];
      const zxA: s.Line[] = [];
      const zxB: s.Line[] = [];
      const spacing = 15;
      let ang = 25;
      const rotationSpeed = 0.8;

      function rotatePoint(x: number, y: number, angle: number) {
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return [x * cos - y * sin, x * sin + y * cos];
      }

      const expectedCountxyA = Math.ceil(W / spacing);
      const expectedCountxyB = Math.ceil(H / spacing);

      function drawXYGrid() {
        let indexA = 0;
        let x1 = 0,
          y1 = 0;
        for (let x = 0; x < W; x += spacing) {
          for (let y = 0; y < H; y += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(x - W / 2, y - H / 2, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }

          if (xyA.length < expectedCountxyA) {
            const l = new s.Line(x, 0, x1, y1);
            xyA.push(l);
            canvas.addTo(l);
          } else {
            console.log('seting');
            xyA[indexA].setSMatrix([
              [x, 0],
              [x1, y1]
            ]);
          }
          indexA++;
        }

        let indexB = 0;

        for (let y = 0; y < H; y += spacing) {
          [0, y];
          for (let x = 0; x < H; x += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(x - W / 2, y - H / 2, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }
          if (xyB.length < expectedCountxyB) {
            const l = new s.Line(0, y, x1, y1);
            xyB.push(l);
            canvas.addTo(l);
          } else {
            console.log('seting');
            xyB[indexB].setSMatrix([
              [0, y],
              [x1, y1]
            ]);
          }

          indexB++;
        }
      }

      const expectedCountyzA = Math.ceil((2 * W) / spacing);
      const expectedCountyzB = Math.ceil((2 * H) / spacing);

      function drawYZGrid() {
        let x1 = 0,
          y1 = 0;
        let indexA = 0,
          indexB = 0;

        for (let i = -W; i < W; i += spacing) {
          let [x0, y0] = [W / 2 + i, 0];
          for (let j = -H; j < H; j += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(i, j, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }
          if (yzA.length < expectedCountyzA) {
            const l = new s.Line(x0, y0, x1, y1);
            yzA.push(l);
            canvas.addTo(l);
          } else {
            yzA[indexA].setSMatrix([
              [x0, y0],
              [x1, y1]
            ]);
          }
          indexA++;
        }

        for (let j = -H; j < H; j += spacing) {
          let [x0, y0] = [W / 2, j];
          for (let i = -W; i < W; i += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(i, j, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }

          if (yzB.length < expectedCountyzB) {
            const l = new s.Line(x0, y0, x1, y1);
            yzB.push(l);
            canvas.addTo(l);
          } else {
            yzB[indexB].setSMatrix([
              [x0, y0],
              [x1, y1]
            ]);
          }
          indexB++;
        }
      }

      function drawZXGrid() {
        let x1 = 0,
          y1 = 0;
        let indexB = 0,
          indexA = 0;
        for (let i = -W; i < W; i += spacing) {
          let [x0, y0] = [W / 2 + i, 0];
          for (let j = -H; j < H; j += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(i, j, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }

          if (zxA.length < expectedCountyzA) {
            const l = new s.Line(x0, y0, x1, y1);
            zxA.push(l);
            canvas.addTo(l);
          } else {
            zxA[indexA].setSMatrix([
              [x0, y0],
              [x1, y1]
            ]);
          }
          indexA++;
        }

        for (let j = -H; j < H; j += spacing) {
          let [x0, y0] = [W / 2, H / 2 + j];
          for (let i = -W; i < W; i += spacing) {
            const [rotatedX, rotatedY] = rotatePoint(i, j, ang);
            [x1, y1] = [rotatedX + W / 2, rotatedY + H / 2];
          }

          if (zxB.length < expectedCountyzB) {
            const l = new s.Line(x0, y0, x1, y1);
            zxB.push(l);
            canvas.addTo(l);
          } else {
            zxB[indexB].setSMatrix([
              [x0, y0],
              [x1, y1]
            ]);
          }
          indexB++;
        }
      }

      function drawAllGrids() {
        drawXYGrid();
        drawYZGrid();
        drawZXGrid();
      }

      function animate() {
        ang += rotationSpeed;

        requestAnimationFrame(animate);

        drawAllGrids();
      }
      //  animate();
			//
			//
		*/
/*
      let i = 0,
        j = 0;
      setInterval(() => {
        if (i < xAxis.length) {
          const e = xAxis[i];
          e.Rotate({ angle: 45, type: 'p', px: 125, py: 200 });
          i++;
        }
        if (j < yAxis.length) {
          const e = yAxis[j];
          e.Rotate({ angle: 45, type: 'p', px: 125, py: 200 });
          j++;
        }
      }, 16.66);
*/
/*
      setTimeout(() => {
        yAxis.forEach((e) => {
          console.log(e);
          e.Rotate({ angle: 45, type: 'p', px: 125, py: 200 });
        });
      }, 1200);

    } catch (e) {
      throw e;
    }
  }, 5000);
});
*/

import { Log } from '../utils/helpers/helpers.js';
import { DEV_INTERNAL_ACCESS } from '../utils/internals/accessKeys.js';
import { ShantanuJS } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const canvas = new ShantanuJS.Canvas('testing', 250, 400);

    const point = new ShantanuJS.Shapes.Basic.Point(20, 20, 5, {
      stroke: 'green',
      fill: 'red'
    });

    canvas.addTo(point);

    const line = new ShantanuJS.Shapes.Basic.Line(10, 20, 20, 50, {
      stroke: 'blue'
    });

    canvas.addTo(line);

    const circle = new ShantanuJS.Shapes.Basic.Circle(70, 60, 10, {
      stroke: 'yellow',
      fill: 'brown'
    });
    const ellipse = new ShantanuJS.Shapes.Basic.Ellipse(50, 100, 12, 15, {
      stroke: 'brown',
      fill: 'pink'
    });

    canvas.addTo(circle, ellipse);

    const polyline = new ShantanuJS.Shapes.Basic.Polyline(
      // '30,35 45,50 60,20',
      [
        [30, 35],
        [45, 50],
        [60, 20]
      ],

      { stroke: 'purple' }
    ); // also supports path like '30 , 35 '

    const polygon = new ShantanuJS.Shapes.Basic.Polygon(
      '80,50 67,12 76,120 99,140',

      /*      [
        [10, 5],
        [70, 33],
        [90, 67]
      ],
			*/
      { stroke: 'lightblue' }
    );

    canvas.addTo(polyline, polygon);

    const rect = new ShantanuJS.Shapes.Basic.Rect(90, 80, 60, 50, {
      rx: 5,
      ry: 7,
      stroke: 'green',
      fill: 'red'
    });

    canvas.addTo(rect);

    const text = new ShantanuJS.Shapes.Media.Text(78, 100, 'Queen', {
      stroke: 'white',
      fill: 'black'
    });
    canvas.addTo(text);

    const img = new ShantanuJS.Shapes.Media.Image(
      40,
      170,
      160,
      120,
      '../../deps.png'
    );

    canvas.addTo(img);

    const cubicCurve = new ShantanuJS.Shapes.Custom.CubicCurve({
      x1: 20,
      y1: 100,
      x2: 130,
      y2: 140,
      curvature: 0.6,
      smoothness: 80
    });

    canvas.addTo(cubicCurve);

    const quadraticCurve = new ShantanuJS.Shapes.Custom.QuadraticCurve({
      x1: 20,
      y1: 100,
      x2: 130,
      y2: 140,
      curvature: -0.6,
      smoothness: 80
    });

    canvas.addTo(quadraticCurve);

    const arcCurve = new ShantanuJS.Shapes.Custom.ArcCurve({
      x1: 20,
      y1: 100,
      x2: 130,
      y2: 140,
      curvature: 0.6,
      smoothness: 80
    });

    canvas.addTo(arcCurve);

    const earcCurve = new ShantanuJS.Shapes.Custom.EarcCurve({
      x1: 20,
      y1: 100,
      x2: 130,
      y2: 140,
      curvature: -0.6,
      smoothness: 80
    });

    canvas.addTo(earcCurve);

    const group = new ShantanuJS.Semantics.Group('newgroup');
    canvas.addTo(group);

    group.add(rect, ellipse);

    line.toFront();

    //  rect.Rotate({ angle: 45 });

    //   group.Rotate({ angle: 45 });
    rect.on('click', (e) => {
      Log('click once on rect');
    });
  }, 7000);
});
