import { ShantanuJS } from "../../index";
/**
 * Geometry configuration for all default testing shapes.
 *
 * This object contains only geometry-related properties used to position
 * and size the default testing scene. Style properties (fill, stroke, etc.)
 * should be supplied when constructing each shape.
 */
export const shapeGeometry = {
  // ------------------------------------------------------------------------
  // Row 1
  // ------------------------------------------------------------------------

  line: {
    x1: 20,
    y1: 40,
    x2: 110,
    y2: 40,
  },

  point: {
    cx: 170,
    cy: 40,
    r: 4,
  },

  circle: {
    cx: 310,
    cy: 40,
    r: 28,
  },

  // ------------------------------------------------------------------------
  // Row 2
  // ------------------------------------------------------------------------

  ellipse: {
    cx: 70,
    cy: 140,
    rx: 30,
    ry: 20,
  },

  rect: {
    x: 145,
    y: 110,
    width: 55,
    height: 60,
    rx: 6,
  },

  text: {
    x: 285,
    y: 145,
  },

  // ------------------------------------------------------------------------
  // Row 3
  // ------------------------------------------------------------------------

  arcCurve: {
    x1: 20,
    y1: 250,
    x2: 110,
    y2: 250,
    smoothness: 40,
    curvature: -0.7,
  },

  cubicCurve: {
    x1: 150,
    y1: 250,
    x2: 240,
    y2: 250,
    smoothness: 70,
    curvature: -0.7,
  },

  quadraticCurve: {
    x1: 280,
    y1: 250,
    x2: 370,
    y2: 250,
    smoothness: 40,
    curvature: -0.7,
  },

  // ------------------------------------------------------------------------
  // Row 4
  // ------------------------------------------------------------------------

  earcCurve: {
    x1: 20,
    y1: 360,
    x2: 110,
    y2: 360,
    smoothness: 40,
    curvature: -0.7,
  },

  polyline: {
    points: [
      [145, 385],
      [165, 345],
      [190, 370],
      [215, 335],
      [240, 380],
    ],
  },

  polygon: {
    points: [
      [295, 335],
      [345, 350],
      [360, 395],
      [325, 425],
      [280, 395],
    ],
  },

  // ------------------------------------------------------------------------
  // Row 5
  // ------------------------------------------------------------------------

  image: {
    x: 20,
    y: 445,
    width: 120,
    height: 90,
  },
};

/**
 * Creates the default testing canvas and one instance of every built-in
 * shape/media object used throughout the visual test suite.
 *
 * The created canvas is stored in `ctx.canvas` and every created object is
 * registered in `ctx.shapes` using its corresponding shape name.
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
    height: 560,
    fill: "white",
    stroke: "green",
    "stroke-width": 2,
  });

  // --------------------------------------------------------------------------
  // Create Shapes
  // --------------------------------------------------------------------------

  const line = new API.Shapes.Line({
    ...shapeGeometry.line,
    stroke: "crimson",
    "stroke-width": 2,
  });

  const point = new API.Shapes.Point({
    ...shapeGeometry.point,
    fill: "dodgerblue",
    stroke: "navy",
  });

  const circle = new API.Shapes.Circle({
    ...shapeGeometry.circle,
    fill: "orange",
  });

  const ellipse = new API.Shapes.Ellipse({
    ...shapeGeometry.ellipse,
    fill: "gold",
  });

  const rect = new API.Shapes.Rect({
    ...shapeGeometry.rect,
    fill: "skyblue",
  });

  const text = new API.Media.Text({
    ...shapeGeometry.text,
    text: "Queen",
    fill: "black",
  });

  const arcCurve = new API.Shapes.ArcCurve({
    ...shapeGeometry.arcCurve,
    stroke: "red",
  });

  const cubicCurve = new API.Shapes.CubicCurve({
    ...shapeGeometry.cubicCurve,
    stroke: "green",
  });

  const quadraticCurve = new API.Shapes.QuadraticCurve({
    ...shapeGeometry.quadraticCurve,
    stroke: "blue",
  });

  const earcCurve = new API.Shapes.EarcCurve({
    ...shapeGeometry.earcCurve,
    stroke: "purple",
  });

  const polyline = new API.Shapes.Polyline({
    ...shapeGeometry.polyline,
    fill: "none",
    stroke: "deeppink",
    "stroke-width": 2,
  });

  const polygon = new API.Shapes.Polygon({
    ...shapeGeometry.polygon,
    fill: "limegreen",
    stroke: "darkgreen",
    "stroke-width": 2,
  });

  const image = new API.Media.Image({
    ...shapeGeometry.image,
    href: "../../deps.png",
  });

  // --------------------------------------------------------------------------
  // Add Shapes
  // --------------------------------------------------------------------------

  canvas.add(
    line,
    point,
    circle,
    ellipse,
    rect,
    text,

    arcCurve,
    cubicCurve,
    quadraticCurve,
    earcCurve,
    polyline,
    polygon,
    image,
  );

  // --------------------------------------------------------------------------
  // Store Context
  // --------------------------------------------------------------------------

  ctx.canvas = canvas;

  ctx.shapes = {
    line,
    point,
    circle,
    ellipse,
    rect,
    text,

    arcCurve,
    cubicCurve,
    quadraticCurve,
    earcCurve,
    polyline,
    polygon,
    image,
  };
}
