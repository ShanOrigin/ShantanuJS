// Utility type for deep partial
//type which create deep partial or deep interface of a nested object like the below ones

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

/**
 * common geometry property object for reference
 */

export const CommonGeometricProperties = Object.seal({
  geometry: {
    sharedBuffer: new Float32Array(0), // shape + OBB matrix in 1d combined
    shape: '', // shape which shape
    matrix: [] as Float32Array[], // view to sharedBuffer on shape data
    Obbox: [] as Float32Array[], // view to OBB on sharedBuffer data
    TList: [
      // transformations list
      {
        MatrixType: '', //transformations name
        type: '', // types like relative , absolute , pivot , batched , compose
        TMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) // [a, b , g = 0 , c , d, h =  0 , e , f , i =  1 ] // column major
        // array to store each transformations appled on shape in 1d as column major and 0 index is composed matrix for all matrix from 1 to n
      }
    ],
    copies: 0, // copy count
    rotation: 0, // rotation factor
    skweX: 0, // skew factors
    skweY: 0
    // area : 0 ,
    // equation : ''
  }
});

// A  helper type first for creating interface

type _ICommonGeometricPropsHelper = DeepPartial<
  typeof CommonGeometricProperties
>;

// an actual interface
export interface ICommonGeometricProperties
  extends _ICommonGeometricPropsHelper {}

/*
 * common style property object for reference
 */

export type ICommonStylePropertie = typeof CommonStylePropertie;

export const CommonStylePropertie = Object.seal({
  roleOfSVG: '', // Custom semantic property
  inside: '', // Custom layout property
  id: '', // Unique identifier
  name: '', // Optional name (non-standard)
  selectable: '', // Controls element selection (CSS-like)
  display: '', // Show/hide or render type
  visibility: 'visible', // Visibility (but keeps layout)
  transform: '', // Translate, rotate, scale, etc.
  cursor: '', // Mouse cursor style
  opacity: 1, // Transparency level (0 to 1)
  'pointer-events': '', // Whether pointer events are enabled
  filter: '', // Visual filter effects
  mask: '', // Applies mask to shape or image
  'clip-path': '', // Clips content using shape or path
  'clip-rule': 'nonzero', // How the clip-path is interpreted
  'vector-effect': 'none', // e.g., 'non-scaling-stroke'
  'stroke-dasharray': '', // Stroke pattern: dashes/gaps
  'stroke-dashoffset': '' // Start offset for stroke dashes
});

export const ShapeStyleProperties = Object.seal({
  d: '', // Path data for <path>
  fill: 'none', // Fill color or gradient
  stroke: 'none', // Stroke color or gradient
  'stroke-width': 0, // Stroke width
  'stroke-linecap': 'butt', // Line cap: 'butt', 'round', 'square'
  'stroke-linejoin': 'miter', // Join type: 'miter', 'round', 'bevel'
  'stroke-miterlimit': 4, // Miter join limit
  'fill-rule': 'nonzero', // Filling rule: 'nonzero' or 'evenodd'
  'marker-start': '', // Reference to start marker
  'marker-mid': '', // Reference to mid marker
  'marker-end': '' // Reference to end marker
});

export type IShapeStyleProperties = typeof ShapeStyleProperties;

export const TextStyleProperties = Object.seal({
  'font-family': 'arial', // Font name
  'font-size': '16', // Font size
  'font-size-adjust': 1, // Adjust size based on x-height
  'font-stretch': '0', // Width stretching
  'font-style': 'normal', // Italic, normal, oblique
  'font-variant': 'small', // Small caps, etc.
  'font-weight': 'bold', // Thickness (normal, bold, 100–900)
  'letter-spacing': '0', // Character spacing
  'word-spacing': '0', // Word spacing
  'text-anchor': 'middle', // Horizontal alignment
  'alignment-baseline': 'middle', // Vertical alignment
  'dominant-baseline': '', // Dominant line alignment
  kerning: '', // Pairwise spacing
  'baseline-shift': '', // Baseline offset (e.g., superscript)
  'writing-mode': '', // Horizontal/vertical layout
  direction: 'ltr', // Text direction: 'ltr', 'rtl'
  'glyph-orientation-vertical': '' // Glyph orientation in vertical text
});

export type ITextStyleProperties = typeof TextStyleProperties;

export const ImageStyleProperties = Object.seal({
  opacity: 1, // Transparency
  filter: '', // Filter effects
  mask: '', // Applied mask
  'clip-path': '', // Clipping path
  'pointer-events': '', // Pointer interaction
  display: '', // Visibility toggle
  visibility: '1', // Visibility without layout effect
  transform: '', // Positioning/rotation
  cursor: '' // Cursor type
});

export type IImageStyleProperties = typeof ImageStyleProperties;

export const GradientAndPatternProperties = Object.seal({
  'gradient-transform': '', // Transform on gradient space
  'gradient-units': 'userSpaceOnUse', // Coordinate space for gradient
  'spread-method': 'pad', // Fill outside gradient bounds
  'pattern-transform': '', // Transform for pattern space
  'pattern-units': 'userSpaceOnUse', // Pattern space definition
  'pattern-content-units': 'userSpaceOnUse' // Coordinate space for pattern contents
});

export type IGradientAndPatternProperties = typeof GradientAndPatternProperties;

export const FilterPrimitiveProperties = Object.seal({
  'flood-color': '', // Color used in flooding filter
  'flood-opacity': 1, // Opacity for flood
  'lighting-color': '', // Light source color in lighting filters
  'stop-color': '', // Color in gradient stop
  'stop-opacity': 1 // Opacity at gradient stop
});

export type IFilterPrimitiveProperties = typeof FilterPrimitiveProperties;

const shapeStyle = { ...ShapeStyleProperties, ...CommonStylePropertie };

export const AllStyleProperties = {
  ...ShapeStyleProperties,
  ...CommonStylePropertie,
  ...TextStyleProperties,
  ...ImageStyleProperties,
  ...GradientAndPatternProperties,
  ...FilterPrimitiveProperties
};

export interface IAllStyleProperties
  extends IShapeStyleProperties,
    ICommonStylePropertie,
    ITextStyleProperties,
    IImageStyleProperties,
    IGradientAndPatternProperties,
    IFilterPrimitiveProperties {}

export const AllGShapeStyleProperties = {
  svg: shapeStyle,
  dot: shapeStyle,
  line: shapeStyle,
  polyline: shapeStyle,
  polygon: shapeStyle,
  rect: shapeStyle,
  ellipse: shapeStyle,
  circle: shapeStyle,
  path: shapeStyle,
  g: shapeStyle,
  text: { ...shapeStyle, ...TextStyleProperties },
  image: { ...shapeStyle, ...ImageStyleProperties }
};

export interface IAllGShapeStyleProperties {
  svg: IShapeStyleProperties & ICommonStylePropertie;
  dot: IShapeStyleProperties & ICommonStylePropertie;
  line: IShapeStyleProperties & ICommonStylePropertie;
  polyline: IShapeStyleProperties & ICommonStylePropertie;
  polygon: IShapeStyleProperties & ICommonStylePropertie;
  rect: IShapeStyleProperties & ICommonStylePropertie;
  ellipse: IShapeStyleProperties & ICommonStylePropertie;
  circle: IShapeStyleProperties & ICommonStylePropertie;
  path: IShapeStyleProperties & ICommonStylePropertie;
  g: IShapeStyleProperties & ICommonStylePropertie;
  text: IShapeStyleProperties & ITextStyleProperties & ICommonStylePropertie;
  image: IShapeStyleProperties & IImageStyleProperties & ICommonStylePropertie;

  curve: IShapeStyleProperties & ICommonStylePropertie;
  triangle: IShapeStyleProperties & ICommonStylePropertie;
}

export type TagToGShapeStyleKeyMap = {
  dot: 'dot';
  rect: 'rect';
  circle: 'circle';
  ellipse: 'ellipse';
  line: 'line';
  polyline: 'polyline';
  polygon: 'polygon';
  text: 'text';
  image: 'image';
  svg: 'svg';
  path: 'dot';
  tspan: 'text';
  g: 'g';
  triangle: 'triangle';
  curve: 'curve';
};

export type StyleForGShapeTag<T extends keyof TagToGShapeStyleKeyMap> =
  IAllGShapeStyleProperties[Extract<
    TagToGShapeStyleKeyMap[T],
    keyof IAllGShapeStyleProperties
  >];

/*
  gradient: IGradientAndPatternProperties;
  filter: IFilterPrimitiveProperties;
}

*/

/*

export const CommonStyleProperties = Object.seal({
  style: {
    'role-of-el': '',
    inside: '',
    name: '',
    selectable: '',
    d: '', // may be deleted in future
    id: '',

    fill: '',
    stroke: '',
    'stroke-width': 0,
    opacity: 1,
    transform: '',
    display: '',
    visibility: '',
    'clip-path': '',
    cursor: '',
    'pointer-events': '',
    'marker-start': '',
    'marker-mid': '',
    'marker-end': '',
    'font-family': '',
    'font-size': '',
    'font-size-adjust': 0,
    'font-stretch': '',
    'font-style': '',
    'font-variant': '',
    'font-weight': '',
    'letter-spacing': '',
    'word-spacing': '',
    'text-anchor': '',
    'alignment-baseline': '',
    'dominant-baseline': '',
    kerning: '',
    'baseline-shift': '',
    'writing-mode': '',
    direction: '',
    'glyph-orientation-vertical': '',
    'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter',
    'stroke-miterlimit': 4,
    'fill-rule': 'nonzero',
    'stop-color': '',
    'stop-opacity': 1,
    filter: '',
    'flood-color': '',
    'flood-opacity': 1,
    'lighting-color': '',
    'gradient-transform': '',
    'gradient-units': 'userSpaceOnUse',
    'spread-method': 'pad',
    'pattern-transform': '',
    'pattern-units': 'userSpaceOnUse',
    'pattern-content-units': 'userSpaceOnUse',
    mask: '',
    'clip-rule': 'nonzero',
    'vector-effect': 'none' //   'non-scaling-stroke' helps in whether stroke scale or not
  }
});

export const CommonStyleProperties__ = Object.seal({
  style: {
    // ===== Common Properties =====
    roleOfSVG: '', // Custom property (semantic role, not standard SVG)
    inside: '', // Custom property (possibly a layout container or internal grouping)
    id: '', // Element identifier (for referencing)
    name: '', // Optional name attribute (non-SVG standard)
    selectable: '', // Controls whether element can be selected (usually CSS)
    display: '', // Controls rendering (e.g. 'inline', 'none', 'block')
    visibility: '', // Visibility without affecting layout ('visible', 'hidden')
    transform: '', // Applies transformation (rotate, translate, scale, etc.)
    cursor: '', // Sets the mouse cursor (e.g. 'pointer', 'move')
    opacity: 1, // Overall transparency (0 to 1)
    'pointer-events': '', // Enables or disables mouse events on the element
    filter: '', // Applies graphic filters (e.g. blur, drop shadow)
    mask: '', // Applies a mask to the element (another element used for masking)
    'clip-path': '', // Crops an element using a shape or path
    'clip-rule': 'nonzero', // Rule to determine inside of clipping path (nonzero/evenodd)
    'vector-effect': 'none', // Controls stroke scaling; 'non-scaling-stroke' disables stroke scaling

    // ===== Shape Properties =====
    d: '', // Defines the path data for <path> elements
    fill: '', // Fill color or pattern
    stroke: '', // Stroke (border) color or pattern
    'stroke-width': 0, // Width of the stroke
    'stroke-linecap': 'butt', // End shape of open paths ('butt', 'round', 'square')
    'stroke-linejoin': 'miter', // Corner shape for path joins ('miter', 'round', 'bevel')
    'stroke-miterlimit': 4, // Limit for miter joins
    'fill-rule': 'nonzero', // Rule for determining interior regions ('nonzero', 'evenodd')
    'marker-start': '', // Reference to marker (e.g. arrowhead) at the start of a path
    'marker-mid': '', // Marker on the middle of the path
    'marker-end': '', // Marker on the end of the path
    'stroke-dasharray': '', // Creates dashed or dotted strokes (e.g., '5,5' = dash of 5px + gap of 5px)
    'stroke-dashoffset': '', // Offset the start of dash pattern (useful for animations)

    // ===== Text Properties =====
    'font-family': '', // Font used for text
    'font-size': '', // Size of the text
    'font-size-adjust': 0, // Adjusts text size based on x-height
    'font-stretch': '', // Controls font width (e.g. 'condensed', 'expanded')
    'font-style': '', // Italic, normal, oblique
    'font-variant': '', // Small caps or other typographic features
    'font-weight': '', // Font thickness (normal, bold, 100–900)
    'letter-spacing': '', // Space between characters
    'word-spacing': '', // Space between words
    'text-anchor': '', // Horizontal alignment of text ('start', 'middle', 'end')
    'alignment-baseline': '', // Vertical alignment of text baseline
    'dominant-baseline': '', // Alignment of dominant baseline in multi-line text
    kerning: '', // Space adjustment between specific character pairs
    'baseline-shift': '', // Shifts the text baseline up or down (e.g. superscript)
    'writing-mode': '', // Text direction (horizontal-tb, vertical-rl, etc.)
    direction: '', // Left-to-right or right-to-left text ('ltr', 'rtl')
    'glyph-orientation-vertical': '', // Orientation of individual glyphs in vertical mode

    // ===== Gradient and Pattern Properties (Used in shapes like <rect>, <path>, etc.) =====
    'gradient-transform': '', // Transform applied to the gradient
    'gradient-units': 'userSpaceOnUse', // Defines coordinate system for gradient ('objectBoundingBox' or 'userSpaceOnUse')
    'spread-method': 'pad', // How gradient behaves outside bounds ('pad', 'reflect', 'repeat')
    'pattern-transform': '', // Transform applied to the pattern fill
    'pattern-units': 'userSpaceOnUse', // Coordinate system for the pattern container
    'pattern-content-units': 'userSpaceOnUse', // Coordinate system for content inside the pattern

    // ===== Filter Primitive Properties =====
    'flood-color': '', // Fill color used in filter operations
    'flood-opacity': 1, // Opacity of flood fill
    'lighting-color': '', // Light color used in lighting filters
    'stop-color': '', // Used in gradients to define stop color
    'stop-opacity': 1 // Opacity of gradient stop
  }
});

//  helper type first for creating interface
type _ICommonStyleProperties = DeepPartial<typeof CommonStyleProperties>;

//  an  actual interface
export interface ICommonStyleProperties extends _ICommonStyleProperties {}

*/
// above common style property interface something look like below commented one
/*

  export interface CommonStyleProperties {
  style: {
    id?: string;
    fill?: string;
    stroke?: string;
    'stroke-width'?: number;
    opacity?: number;
    transform?: string;
    display?: string;
    visibility?: string;
    'clip-path'?: string;
    cursor?: string;
    'pointer-events'?: string;
    'marker-start'?: string;
    'marker-mid'?: string;
    'marker-end'?: string;
    'font-family'?: string;
    'font-size'?: string;
    'font-size-adjust'?: number;
    'font-stretch'?: string;
    'font-style'?: string;
    'font-variant'?: string;
    'font-weight'?: string;
    'letter-spacing'?: string;
    'word-spacing'?: string;
    'text-anchor'?: string;
    'alignment-baseline'?: string;
    'dominant-baseline'?: string;
    kerning?: string;
    'baseline-shift'?: string;
    'writing-mode'?: string;
    direction?: string;
    'glyph-orientation-vertical'?: string;
    'stroke-linecap'?: 'butt' | 'round' | 'square' | string;
    'stroke-linejoin'?: 'miter' | 'round' | 'bevel' | string;
    'stroke-miterlimit'?: number;
    'fill-rule'?: 'nonzero' | 'evenodd' | string;
    'stop-color'?: string;
    'stop-opacity'?: number;
    filter?: string;
    'flood-color'?: string;
    'flood-opacity'?: number;
    'lighting-color'?: string;
    'gradient-transform'?: string;
    'gradient-units'?: 'userSpaceOnUse' | 'objectBoundingBox' | string;
    'spread-method'?: 'pad' | 'reflect' | 'repeat' | string;
    'pattern-transform'?: string;
    'pattern-units'?: 'userSpaceOnUse' | 'objectBoundingBox' | string;
    'pattern-content-units'?: 'userSpaceOnUse' | 'objectBoundingBox' | string;
    mask?: string;
    'clip-rule'?: 'nonzero' | 'evenodd' | string;
  };
}

*/
