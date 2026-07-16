import { ShantanuJS } from "./index.js";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    //
    const canvas = new ShantanuJS.Canvas({
      width: 250,
      height: 400,
      id: "testing",
      fill: "white",
      stroke: "green",
      "stroke-width": 2,
    });

    canvas.engine.stop();
    canvas.engine.update();

    const line = new ShantanuJS.Shapes.Line({
      x1: 10,
      y1: 40,
      x2: 100,
      y2: 50,
      stroke: "green",
      "stroke-width": 2,
    });

    const point = new ShantanuJS.Shapes.Point({
      cx: 100,
      cy: 100,
      r: 3,
      fill: "blue",
      stroke: "purple",
    });

    const circle = new ShantanuJS.Shapes.Circle({
      cx: 170,
      cy: 60,
      r: 30,
      fill: "brown",
    });

    const ellipse = new ShantanuJS.Shapes.Ellipse({
      cx: 50,
      cy: 110,
      rx: 30,
      ry: 20,
      fill: "yellow",
    });

    const rect = new ShantanuJS.Shapes.Rect({
      x: 30,
      y: 140,
      width: 50,
      height: 60,
      rx: 5,
      fill: "lightblue",
    });

    const rect1 = new ShantanuJS.Shapes.Rect({
      x: 30,
      y: 140,
      width: 50,
      height: 60,
      rx: 5,
      fill: "purple",
    });

    const arcCurve = new ShantanuJS.Shapes.ArcCurve({
      x1: 40,
      y1: 170,
      x2: 230,
      y2: 170,
      smoothness: 40,
      curvature: -0.7,
      stroke: "red",
    });

    const cubicCurve = new ShantanuJS.Shapes.CubicCurve({
      x1: 40,
      y1: 170,
      x2: 230,
      y2: 170,
      smoothness: 70,
      curvature: -0.7,
      stroke: "green",
    });

    const quadraticCurve = new ShantanuJS.Shapes.QuadraticCurve({
      x1: 40,
      y1: 170,
      x2: 230,
      y2: 170,
      smoothness: 40,
      curvature: -0.7,
      stroke: "blue",
    });

    const earcCurve = new ShantanuJS.Shapes.EarcCurve({
      x1: 40,
      y1: 170,
      x2: 230,
      y2: 170,
      smoothness: 40,
      curvature: -0.7,
      stroke: "purple",
    });

    const text = new ShantanuJS.Media.Text({ x: 50, y: 100, text: "Queen" });

    const img = new ShantanuJS.Media.Image({
      x: 10,
      y: 250,
      width: 200,
      height: 150,
      href: "../../deps.png",
    });

    canvas.add(
      line,
      point,
      circle,
      ellipse,
      rect,
      rect1,
      arcCurve,
      cubicCurve,
      quadraticCurve,
      earcCurve,
      text,
      img,
    );

    const gr = new ShantanuJS.Group("g1");
    canvas.add(gr);
    gr.add(line, circle, ellipse);

    canvas.engine.update();
    setTimeout(() => {
      rect.translate({ x: 50, y: 0 });
      canvas.engine.update();
    }, 5000);

    canvas.engine.update();

    setTimeout(() => canvas.engine.stop(), 1000);
  }, 5000);
});
