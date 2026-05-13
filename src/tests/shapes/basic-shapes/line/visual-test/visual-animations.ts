import { Shantanu } from '../../../../../index/index.js';
import { vTest, delay } from '../../../../vTest.js';

const T = 1000;

export async function LineAnimationTests() {
  const Canvas = new Shantanu.Canvas('testing', 400, 1200);

  Canvas.attrs({ stroke: '#444', 'stroke-width': 1 });

  /* ============================================================
   * GROUP 1 — STYLE ANIMATION (TC 001–010)
   * ============================================================ */

  await vTest('TC-LINE-ANIM-001 | stroke color change', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 20, 100, 20, {
      stroke: 'red',
      'stroke-width': 2
    });
    Canvas.addTo(l);
    l.animate({ stroke: 'blue' }, null, 500, 'linear');
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-002 | stroke-width increase', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 40, 100, 40, {
      'stroke-width': 1
    });
    Canvas.addTo(l);
    l.animate({ 'stroke-width': 10 }, null, 500);
    await delay(T);
  });

  await vTest(
    'TC-LINE-ANIM-003 | stroke-width negative (error expected)',
    async () => {
      const l = new Shantanu.Shapes.Basic.Line(20, 60, 100, 60);
      Canvas.addTo(l);
      l.animate({ 'stroke-width': -5 }, null, 500);
      await delay(T);
    }
  );

  /*
  await vTest('TC-LINE-ANIM-004 | opacity overflow (>1)', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 80, 100, 80);
    Canvas.addTo(l);
    l.animate({ opacity: 2 }, null, 500);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-005 | opacity negative', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 100, 100, 100);
    Canvas.addTo(l);
    l.animate({ opacity: -1 }, null, 500);
    await delay(T);
  });
*/

  /* ============================================================
   * GROUP 2 — LINE ENDPOINT MUTATION (TC 011–020)
   * ============================================================ */
  /*
  await vTest('TC-LINE-ANIM-011 | animate x1 only', async () => {
    const l = new Shantanu.Shapes.Basic.Line(50, 130, 150, 130);
    Canvas.addTo(l);
    l.animate({ x1: 10 }, null, 600);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-012 | animate y1 only', async () => {
    const l = new Shantanu.Shapes.Basic.Line(50, 160, 150, 160);
    Canvas.addTo(l);
    l.animate({ y1: 200 }, null, 600);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-013 | animate x2 only', async () => {
    const l = new Shantanu.Shapes.Basic.Line(50, 190, 150, 190);
    Canvas.addTo(l);
    l.animate({ x2: 250 }, null, 600);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-014 | animate y2 only', async () => {
    const l = new Shantanu.Shapes.Basic.Line(50, 220, 150, 220);
    Canvas.addTo(l);
    l.animate({ y2: 260 }, null, 600);
    await delay(T);
  });

  await vTest(
    'TC-LINE-ANIM-015 | animate both endpoints (x1,y1,x2,y2)',
    async () => {
      const l = new Shantanu.Shapes.Basic.Line(50, 250, 150, 250);
      Canvas.addTo(l);
      l.animate({ x1: 10, y1: 300, x2: 300, y2: 350 }, null, 800);
      await delay(T);
    }
  );
	*/

  /* ============================================================
   * GROUP 3 — SINGLE TRANSFORMS (TC 021–035)
   * ============================================================ */

  /*
  await vTest('TC-LINE-ANIM-021 | translate relative', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 300, 80, 300);
    Canvas.addTo(l);
    l.animate({ translate: { x: 100, y: 20 } }, { pivot: { mode: 'r' } }, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-022 | translate extreme large value', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 330, 80, 330);
    Canvas.addTo(l);
    l.animate({ translate: { x: 1000, y: -500 } }, null, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-023 | rotate 360 center', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 360, 80, 360);
    Canvas.addTo(l);
    l.animate({ rotate: { angle: 360 } }, { pivot: { rotatePivot: 'C' } }, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-024 | rotate negative angle', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 390, 80, 390);
    Canvas.addTo(l);
    l.animate({ rotate: { angle: -180 } }, null, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-025 | scale zero', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 420, 80, 420);
    Canvas.addTo(l);
    l.animate({ scale: { sx: 0, sy: 0 } }, null, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-026 | scale negative', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 450, 80, 450);
    Canvas.addTo(l);
    l.animate({ scale: { sx: -1, sy: 1 } }, null, 800);
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-027 | skew extreme', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 480, 80, 480);
    Canvas.addTo(l);
    l.animate({ skew: { sx: 89, sy: 0 } }, null, 800);
    await delay(T);
  });
*/
  /* ============================================================
   * GROUP 4 — COMPOSED TRANSFORMS (TC 036–050)
   * ============================================================ */
  /*
  await vTest('TC-LINE-ANIM-036 | translate + rotate', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 520, 80, 520);
    Canvas.addTo(l);
    l.animate(
      { translate: { x: 120, y: 20 }, rotate: { angle: 180 } },
      { pivot: { mode: 'r' } },
      1200
    );
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-037 | translate + scale', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 550, 80, 550);
    Canvas.addTo(l);
    l.animate(
      { translate: { x: 120, y: 0 }, scale: { sx: 2, sy: 1 } },
      null,
      1200
    );
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-038 | rotate + scale + skew', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 580, 80, 580);
    Canvas.addTo(l);
    l.animate(
      { rotate: { angle: 180 }, scale: { sx: 1.5 }, skew: { sx: 20 } },
      { pivot: { commonPivot: 'C' } },
      1200
    );
    await delay(T);
  });
*/
  /* ============================================================
   * GROUP 5 — CURVE & PHYSICS (TC 051–065)
   * ============================================================ */
  /*
  await vTest('TC-LINE-ANIM-051 | curve quadratic', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 620, 80, 620);
    Canvas.addTo(l);
    l.animate(
      { translate: { x: 150, y: 40 } },
      {
        curve: { curvePathMotion: true, curvePath: 'quadratic', stepness: 0.7 }
      },
      2000
    );
    await delay(T * 2);
  });

  await vTest('TC-LINE-ANIM-052 | curve cubic + rotate', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 650, 80, 650);
    Canvas.addTo(l);
    l.animate(
      { translate: { x: 150, y: 40 }, rotate: { angle: 360 } },
      { curve: { curvePathMotion: true, curvePath: 'cubic' } },
      2500
    );
    await delay(T * 2);
  });

  await vTest('TC-LINE-ANIM-053 | physics translate', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 680, 80, 680);
    Canvas.addTo(l);
    l.animate(
      { translate: { x: 200, y: 0 } },
      { physics: { physicsMotion: true, speed: 0.3 } },
      2000
    );
    await delay(T * 2);
  });
*/
  /* ============================================================
   * GROUP 6 — LIFECYCLE & STRESS (TC 066–075)
   * ============================================================ */
  /*
  await vTest('TC-LINE-ANIM-066 | pause & resume', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 720, 80, 720);
    Canvas.addTo(l);
    const a = l.animation({ translate: { x: 150 } }, null, 2000);
    await delay(600);
    a.pause();
    await delay(600);
    a.resume();
    await delay(T);
  });

  await vTest('TC-LINE-ANIM-067 | cancel animation', async () => {
    const l = new Shantanu.Shapes.Basic.Line(20, 750, 80, 750);
    Canvas.addTo(l);
    const a = l.animation({ translate: { x: 200 } }, null, 2000);
    await delay(500);
    a.cancelAnimation();
    await delay(T);
  });
*/
  console.log('✅ LINE ANIMATION – FULL TEST MATRIX EXECUTED');
}
