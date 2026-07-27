import { ShantanuJS } from "../../index";

/**
 * Creates the default testing canvas and populates it with one instance of
 * every available built-in shape and media object.
 *
 * All created objects are stored in the shared test context for reuse by
 * individual test cases. Shapes are positioned with consistent spacing so
 * they do not overlap and remain visually distinguishable.
 *
 * Created objects can be accessed using:
 *
 * ```ts
 * ctx.canvas;
 * ctx.shapes.line;
 * ctx.shapes.circle;
 * ctx.shapes.rect;
 * // ...
 * ```
 *
 * @param API ShantanuJS public API.
 * @param ctx Shared testing context.
 */
export function initializeCanvasAndShapes(
  API: typeof ShantanuJS,
  ctx: any,
): void {
  const canvas = new API.Canvas({
    id: "testing",
    width: 420,
    height: 520,
    fill: "white",
    stroke: "green",
    "stroke-width": 2,
  });

  canvas.engine.stop();
  canvas.engine.update();

  ctx.canvas = canvas;
  ctx.shapes = {};

  // ----------------------------------------------------------
  // Row 1
  // ----------------------------------------------------------

  const line = new API.Shapes.Line({
    x1: 20,
    y1: 40,
    x2: 100,
    y2: 40,
    stroke: "crimson",
    "stroke-width": 2,
  });

  const point = new API.Shapes.Point({
    cx: 170,
    cy: 40,
    r: 4,
    fill: "dodgerblue",
    stroke: "navy",
  });

  const circle = new API.Shapes.Circle({
    cx: 310,
    cy: 40,
    r: 28,
    fill: "orange",
  });

  // ----------------------------------------------------------
  // Row 2
  // ----------------------------------------------------------

  const ellipse = new API.Shapes.Ellipse({
    cx: 70,
    cy: 140,
    rx: 30,
    ry: 20,
    fill: "gold",
  });

  const rect = new API.Shapes.Rect({
    x: 145,
    y: 110,
    width: 55,
    height: 60,
    rx: 6,
    fill: "skyblue",
  });

  // ----------------------------------------------------------
  // Row 3 (Curves)
  // ----------------------------------------------------------

  const arcCurve = new API.Shapes.ArcCurve({
    x1: 20,
    y1: 250,
    x2: 120,
    y2: 250,
    smoothness: 40,
    curvature: -0.7,
    stroke: "red",
  });

  const cubicCurve = new API.Shapes.CubicCurve({
    x1: 150,
    y1: 250,
    x2: 250,
    y2: 250,
    smoothness: 70,
    curvature: -0.7,
    stroke: "green",
  });

  const quadraticCurve = new API.Shapes.QuadraticCurve({
    x1: 280,
    y1: 250,
    x2: 380,
    y2: 250,
    smoothness: 40,
    curvature: -0.7,
    stroke: "blue",
  });

  // ----------------------------------------------------------
  // Row 4
  // ----------------------------------------------------------

  const earcCurve = new API.Shapes.EarcCurve({
    x1: 20,
    y1: 360,
    x2: 120,
    y2: 360,
    smoothness: 40,
    curvature: -0.7,
    stroke: "purple",
  });

  const text = new API.Media.Text({
    x: 170,
    y: 365,
    text: "Queen",
    fill: "black",
  });

  const image = new API.Media.Image({
    x: 260,
    y: 320,
    width: 120,
    height: 90,
    href: "../../deps.png",
  });

  canvas.add(
    line,
    point,
    circle,
    ellipse,
    rect,
    arcCurve,
    cubicCurve,
    quadraticCurve,
    earcCurve,
    text,
    image,
  );

  ctx.shapes.line = line;
  ctx.shapes.point = point;
  ctx.shapes.circle = circle;
  ctx.shapes.ellipse = ellipse;
  ctx.shapes.rect = rect;
  ctx.shapes.arcCurve = arcCurve;
  ctx.shapes.cubicCurve = cubicCurve;
  ctx.shapes.quadraticCurve = quadraticCurve;
  ctx.shapes.earcCurve = earcCurve;
  ctx.shapes.text = text;
  ctx.shapes.image = image;
}
