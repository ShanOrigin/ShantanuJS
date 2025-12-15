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
  canvas: { x: 0, y: 0, width: 0, height: 0 },
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
  /*
  tspan: {
    dx: 0,
    dy: 0,
    text: '',
    rotate: '',
    textLength: 0,
    lengthAdjust: '' // 'spacing' , 'spacingAndGlyphs' , none
  },
*/
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

export const NonGraphicalElementProperties = Object.seal({
  // === Container Elements ===

  // <defs>: Container for reusable elements
  defs: {
    // No attributes
  },
  // <use>: Reuse an element defined elsewhere
  use: {
    // href: string (Namespaced: xlink:href in SVG1.1)
    href: '', // string (Namespaced in older SVG versions)
    x: 0, // number
    y: 0 // number
  },

  // === Gradients ===

  // <linearGradient>: Defines a linear gradient
  linearGradient: {
    x1: 0, // number or string (percent)
    y1: 0, // number or string
    x2: 0, // number or string
    y2: 0, // number or string
    gradientUnits: '', // string: 'userSpaceOnUse' | 'objectBoundingBox'
    gradientTransform: '', // string (transform list)
    spreadMethod: '' // string: 'pad' | 'reflect' | 'repeat'
  },

  // <radialGradient>: Defines a radial gradient
  radialGradient: {
    cx: 0, // number or string
    cy: 0, // number or string
    r: 0, // number or string
    fx: 0, // number or string
    fy: 0, // number or string
    gradientUnits: '', // string
    gradientTransform: '', // string
    spreadMethod: '' // string
  },

  // <stop>: Color stop inside gradients
  stop: {
    offset: 0, // number or string (percent)
    'stop-color': '', // string (color)
    'stop-opacity': 1 // number (0 to 1)
  },

  // === Filters ===

  // <filter>: Defines a filter effect
  filter: {
    id: '', // string
    filterUnits: '', // string
    primitiveUnits: '', // string
    x: 0, // number or string
    y: 0, // number or string
    width: 0, // number or string
    height: 0, // number or string
    filterRes: '', // string (resolution)
    href: '' // string (xlink:href in older versions)
  },

  feBlend: {
    in: '', // string (input source)
    in2: '', // string
    mode: '', // string ('normal', 'multiply', etc.)
    result: '' // string (result name)
  },

  feColorMatrix: {
    in: '', // string
    type: '', // string ('matrix', 'saturate', etc.)
    values: '', // string (matrix values)
    result: '' // string
  },

  feComponentTransfer: {
    in: '', // string
    result: '' // string
    // Children: <feFuncR>, <feFuncG>, <feFuncB>, <feFuncA>
  },

  feComposite: {
    in: '',
    in2: '', // string
    operator: '', // string ('over', 'in', 'out', etc.)
    k1: 0,
    k2: 0,
    k3: 0,
    k4: 0, // number
    result: '' // string
  },

  feConvolveMatrix: {
    in: '', // string
    order: '', // string or number
    kernelMatrix: '', // string (comma-separated values)
    divisor: 1, // number
    bias: 0, // number
    targetX: 0,
    targetY: 0, // number
    edgeMode: '', // string ('duplicate', 'wrap', 'none')
    kernelUnitLength: '', // string or number
    preserveAlpha: false, // boolean
    result: '' // string
  },

  feDiffuseLighting: {
    in: '', // string
    surfaceScale: 1, // number
    diffuseConstant: 1, // number
    kernelUnitLength: '', // string or number
    lightingColor: '', // string (color)
    result: '' // string
    // Children: <feDistantLight>, <fePointLight>, <feSpotLight>
  },

  feDisplacementMap: {
    in: '',
    in2: '', // string
    scale: 0, // number
    xChannelSelector: '', // string ('R', 'G', 'B', 'A')
    yChannelSelector: '', // string
    result: '' // string
  },

  feFlood: {
    'flood-color': '', // string (color)
    'flood-opacity': 1, // number (0 to 1)
    result: '' // string
  },

  feGaussianBlur: {
    in: '', // string
    stdDeviation: 0, // number
    edgeMode: '', // string
    result: '' // string
  },

  feImage: {
    href: '', // string (image URL or ID)
    preserveAspectRatio: '', // string
    result: '' // string
  },

  feMerge: {
    result: '' // string
    // Children: <feMergeNode>
  },

  feMergeNode: {
    in: '' // string
  },

  feMorphology: {
    in: '', // string
    operator: '', // string ('erode', 'dilate')
    radius: '', // number or string
    result: '' // string
  },

  feOffset: {
    in: '', // string
    dx: 0,
    dy: 0, // number
    result: '' // string
  },

  feSpecularLighting: {
    in: '', // string
    surfaceScale: 1, // number
    specularConstant: 1, // number
    specularExponent: 1, // number
    kernelUnitLength: '', // string or number
    lightingColor: '', // string (color)
    result: '' // string
    // Children: <feDistantLight>, <fePointLight>, <feSpotLight>
  },

  feTile: {
    in: '', // string
    result: '' // string
  },

  feTurbulence: {
    baseFrequency: '', // string or number
    numOctaves: 1, // number
    seed: 0, // number
    stitchTiles: '', // string ('stitch' | 'noStitch')
    type: '', // string ('turbulence' | 'fractalNoise')
    result: '' // string
  },

  // === Clip Path & Mask ===

  clipPath: {
    id: '', // string
    clipPathUnits: '', // string
    transform: '' // string (transform list)
  },

  mask: {
    id: '', // string
    x: 0,
    y: 0, // number
    width: 0,
    height: 0, // number
    maskUnits: '', // string
    maskContentUnits: '' // string
  },

  // === Pattern ===

  pattern: {
    id: '', // string
    x: 0,
    y: 0, // number
    width: 0,
    height: 0, // number
    patternUnits: '', // string
    patternContentUnits: '', // string
    patternTransform: '' // string (transform list)
  },

  // === Marker ===

  marker: {
    id: '', // string
    viewBox: '', // string
    refX: 0,
    refY: 0, // number
    markerWidth: 0,
    markerHeight: 0, // number
    orient: '', // string ('auto', angle)
    markerUnits: '', // string
    preserveAspectRatio: '' // string
  },

  // === Style ===

  style: {
    type: 'text/css', // string
    media: '', // string
    title: '' // string
  },

  // === Script ===

  script: {
    type: 'application/ecmascript', // string
    href: '', // string (URL)
    crossorigin: '' // string ('anonymous', 'use-credentials')
  },

  // === Metadata ===

  metadata: {
    // No attributes, raw content only
  },

  // === Title & Description ===

  title: {
    // No attributes
  },

  desc: {
    // No attributes
  }
});

// Correct helper for graphical
type _IGraphicalElementPropertiesHelper = DeepPartial<
  typeof GraphicalElementProperties
>;
export interface IGraphicalElementProperties
  extends _IGraphicalElementPropertiesHelper {}

export type ipRect = keyof (typeof GraphicalElementProperties)['rect'];
export type ipCircle = keyof (typeof GraphicalElementProperties)['circle'];
export type ipEllipse = keyof (typeof GraphicalElementProperties)['ellipse'];
export type ipDot = keyof (typeof GraphicalElementProperties)['dot'];
export type ipLine = keyof (typeof GraphicalElementProperties)['line'];
export type ipPolyline = keyof (typeof GraphicalElementProperties)['polyline'];
export type ipPolygon = keyof (typeof GraphicalElementProperties)['polygon'];
export type ipPath = keyof (typeof GraphicalElementProperties)['path'];

export type ipCanvas = keyof (typeof GraphicalElementProperties)['canvas'];
export type ipText = keyof (typeof GraphicalElementProperties)['text'];
export type ipImage = keyof (typeof GraphicalElementProperties)['image'];

// Correct helper for non-graphical
type _INonGraphicalElementPropertiesHelper = DeepPartial<
  typeof NonGraphicalElementProperties
>;
export interface INonGraphicalElementProperties
  extends _INonGraphicalElementPropertiesHelper {}

// above interface something look like the below commented one
