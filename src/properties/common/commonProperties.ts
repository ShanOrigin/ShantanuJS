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
    buffer: new Float32Array(0), // shape + OBB matrix in 1d combined
    //	sharedBuffer: new Float32Array(0), // shape + OBB matrix in 1d combined
    shape: '', // shape which shape
    // canonicalMatrix: [] as Float32Array[], // view to sharedBuffer on shape data
    // obbox: [] as Float32Array[], // view to OBB on sharedBuffer data
    transformStack: {
      stack: [
        // transformations list
        {
          transformName: '', //transformations name
          transformType: '', // types like relative , absolute , pivot , batched , compose
          transformMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) // [a, b , g = 0 , c , d, h =  0 , e , f , i =  1 ] // column major
          // array to store each transformations appled on shape in 1d as column major and 0 index is composed matrix for all matrix from 1 to n
        }
      ],
      skip: 0 //for redu , undo
    },
    copies: 0 // copy count
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
  curve: shapeStyle,
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
