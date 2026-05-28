// aur type which create deep partial of a nested object for example below 1
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

export const dimensions = {
  rect: [4, 3],
  circle: [2, 3],
  ellipse: [3, 3],
  dot: [1, 3],
  line: [2, 3],
  polyline: [Infinity, 3],
  polygon: [Infinity, 3],
  //  path: [4, 3],
  text: [1, 3],
  image: [4, 3],
  g: [4, 3]
};

export const GraphicalElementProperties = Object.seal({
  scene: { x: 0, y: 0, width: 0, height: 0 },
  dot: { cx: 0, cy: 0, r: 0 },
  line: { x1: 0, y1: 0, x2: 0, y2: 0 },
  polyline: { points: '' },
  polygon: { points: '' },
  rect: { x: 0, y: 0, width: 0, height: 0, rx: 0, ry: 0 },
  circle: { cx: 0, cy: 0, r: 0 },
  ellipse: { cx: 0, cy: 0, rx: 0, ry: 0 },
  path: { d: '' },
  text: {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    text: '',
    rotate: '',
    textLength: 0,
    lengthAdjust: '' // 'spacing' , 'spacingAndGlyphs' , none
  },

  image: { href: '', x: 0, y: 0, width: 0, height: 0 },
  g: {},
  triangle: { a: 0, b: 0, c: 0, A: 0, B: 0, C: 0 },
  curve: {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    curvature: 0,
    smoothness: 0,
    continuous: false,
    continuousCount: 0,
    curveName: '',
    points: ''
  }
});

// Correct helper for graphical
type _IGraphicalElementPropertiesHelper = DeepPartial<
  typeof GraphicalElementProperties
>;
export interface IGraphicalElementProperties
  extends _IGraphicalElementPropertiesHelper {}
