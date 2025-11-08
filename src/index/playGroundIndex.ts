import { Shantanu as s } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    try {
      /*
 *
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
*/
    } catch (e) {
      throw e;
    }
  }, 5000);
});
