/* -------------------------------------------------------------------------- */
/*                             Geometry Properties                            */
/* -------------------------------------------------------------------------- */

/**
 * Common geometry property object shared across graphical entities.
 *
 * Purpose:
 * - Provides a centralized baseline structure for transformation,
 *   matrix handling, geometry state tracking, and render ordering.
 * - Used as the foundational reference object for generating
 *   geometry-related interfaces and internal geometry state.
 *
 * Architectural Notes:
 * - Matrices are stored in column-major order.
 * - Designed primarily for internal rendering pipeline usage.
 * - Sealed to prevent accidental structural mutation.
 *
 * Matrix Layout:
 *
 * [ m00, m10, 0,
 *   m01, m11, 0,
 *   tx,  ty,  1 ]
 */
export const CommonGeometricProperties = Object.seal({
  geometry: {
    /**
     * Shape identifier representing the graphical entity type.
     */
    shape: "",

    /**
     * Indicates whether the local transformation matrix
     * requires recomputation.
     */
    localDirty: true,

    /**
     * Indicates whether the world transformation matrix
     * requires recomputation.
     */
    worldDirty: true,

    /**
     * Local transformation matrix.
     *
     * Represents the entity's transformation relative
     * to its direct parent.
     */
    localMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),

    /**
     * World transformation matrix.
     *
     * Represents the fully resolved transformation
     * in world coordinate space.
     */
    worldMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),

    /**
     * Cached inverse world transformation matrix.
     *
     * Primarily used for coordinate conversions,
     * hit testing, and inverse transform calculations.
     */
    inverseWorldMatrix: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),

    /**
     * Internal reusable geometry buffer.
     *
     * Used for temporary geometry calculations
     * and rendering pipeline optimizations.
     */
    buffer: new Float32Array(0),

    /**
     * Transformation stack container.
     *
     * Maintains transformation hierarchy state
     * during scene graph traversal operations.
     */
    transformStack: {
      /**
       * Matrix stack storage.
       */
      stack: [new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])],

      /**
       * Stack skip counter used for optimized
       * traversal operations.
       */
      skip: 0,
    },

    /**
     * Rendering order index.
     *
     * Higher values are rendered above lower values.
     */
    zIndex: 0,

    /**
     * Cached geometric axis-aligned bounding box (AABB).
     *
     * Represents the minimum rectangular region that fully
     * encloses the underlying geometry in world coordinate space.
     *
     * Storage layout:
     *
     * [ minX, minY, maxX, maxY ]
     *
     * Where:
     * - minX is the smallest x-coordinate.
     * - minY is the smallest y-coordinate.
     * - maxX is the largest x-coordinate.
     * - maxY is the largest y-coordinate.
     *
     * This bounding box describes only the geometric extent
     * of the entity and does not include visual expansions
     * such as stroke width, filters, shadows, masks, or
     * other rendering effects.
     *
     * The value is cached to reduce repeated extent
     * calculations during geometry processing, hit testing,
     * spatial queries, and scene graph operations.
     */
    bounds: new Float32Array([0, 0, 0, 0]),
    /**
     * Describes which renderer update path should be executed
     * during the next render pass.
     *
     * Semantics:
     * - GEOMETRY:
     *   Geometry properties changed.
     *   Renderer should resolve geometry property updates.
		 *   if shape requires bounds update , bounds updation.
		 *   if shape requires canonical matrix update , specially shapes like text and etc , matrix updation.
     *
     * - STYLE:
     *   Style properties changed.
     *   Renderer should resolve style property updates.

     * - TRANSFORM:
     *   Transform state changed.
     *   Renderer should resolve transform updates.
     *
     * Notes:
     * - This is not a traditional dirty flag.
     * - It acts as an update classification mechanism
     *   used by the renderer to select the appropriate
     *   synchronization path.
     */
    renderUpdateType: "TRANSFORM",
  },
});

/* -------------------------------------------------------------------------- */
/*                              Style Properties                              */
/* -------------------------------------------------------------------------- */

/**
 * Common style properties shared by all graphical entities.
 *
 * Purpose:
 * - Defines universal styling attributes used across
 *   multiple graphical shapes and elements.
 * - Contains rendering, masking, clipping, opacity,
 *   and interaction-related styling properties.
 *
 * Architectural Notes:
 * - Shared as a reusable style base object.
 * - Sealed to preserve stable property structure.
 */
export const CommonStyleProperties = Object.seal({
  /**
   * Unique graphical entity identifier.
   */
  id: "",

  /**
   * Cursor style used during pointer interaction.
   */
  cursor: "",

  /**
   * Opacity value ranging from 0 to 1.
   */
  opacity: 1,

  /**
   * Visual filter effects.
   */
  filter: "",

  /**
   * Mask definition reference.
   */
  mask: "",

  /**
   * Clipping path definition reference.
   */
  "clip-path": "",

  /**
   * Stroke dash pattern definition.
   */
  "stroke-dasharray": "",

  /**
   * Stroke dash offset value.
   */
  "stroke-dashoffset": "",
});

/**
 * Shape-specific rendering style properties.
 *
 * Purpose:
 * - Defines visual appearance properties
 *   related specifically to vector shapes.
 * - Used by all primitive graphical entities.
 */
export const ShapeStyleProperties = Object.seal({
  /**
   * Fill color or fill paint source.
   */
  fill: "none",

  /**
   * Stroke color or stroke paint source.
   */
  stroke: "none",

  /**
   * Stroke thickness.
   */
  "stroke-width": 0,

  /**
   * Stroke line ending style.
   */
  "stroke-linecap": "butt",

  /**
   * Stroke line join style.
   */
  "stroke-linejoin": "miter",

  /**
   * Stroke miter limit.
   */
  "stroke-miterlimit": 4,

  /**
   * Fill algorithm rule.
   */
  "fill-rule": "nonzero",
});

/**
 * Text-specific rendering style properties.
 *
 * Purpose:
 * - Defines typography-related styling attributes
 *   for text rendering entities.
 * - Used exclusively by text-based graphical elements.
 */

/*
 // Possible different values of text properties
 
font-weight:
[
  'normal',
  'bold',
  'bolder',
  'lighter'
]

font-style:
[
  'normal',
  'italic',
  'oblique'
]

text-anchor:
[
  'start',
  'middle',
  'end'
]

alignment-baseline:
[
  'baseline',
  'middle',
  'central',
  'hanging',
  'top',
  'bottom',
  'text-top',
  'text-bottom'
]

dominant-baseline:
[
  '',
  'auto',
  'middle',
  'central',
  'hanging',
  'alphabetic',
  'mathematical',
  'ideographic'
]

	 */

export const TextStyleProperties = Object.seal({
  /**
   * Font family name.
   */
  "font-family": "arial",

  /**
   * Font size.
   */
  "font-size": 16,

  /**
   * Font style definition.
   */
  "font-style": "normal",

  /**
   * Font weight definition.
   */
  "font-weight": "bold",

  /**
   * Character spacing value.
   */
  "letter-spacing": "0",

  /**
   * Word spacing value.
   */
  "word-spacing": "0",

  /**
   * Horizontal text alignment.
   */
  "text-anchor": "middle",

  /**
   * Vertical alignment baseline.
   */
  "alignment-baseline": "middle",

  /**
   * Dominant baseline definition.
   */
  "dominant-baseline": "",

  /**
   * Text direction mode.
   */
  direction: "ltr",
});

/* -------------------------------------------------------------------------- */
/*                           Combined Style Objects                           */
/* -------------------------------------------------------------------------- */

/**
 * Shared reusable shape style object.
 *
 * Purpose:
 * - Combines common style properties
 *   with primitive shape style properties.
 */
export const ShapeStyle = {
  ...ShapeStyleProperties,
  ...CommonStyleProperties,
};

/**
 * Flat combined style property registry.
 *
 * Purpose:
 * - Provides access to every available
 *   style property in a single object.
 * - Useful for validation systems,
 *   parsers, serializers, and style inheritance.
 */
export const AllStyleProperties = {
  ...ShapeStyleProperties,
  ...CommonStyleProperties,
  ...TextStyleProperties,
};

/**
 * Shape-to-style configuration registry.
 *
 * Purpose:
 * - Maps each graphical entity type
 *   to its associated style property object.
 * - Used for style resolution and initialization.
 */
export const AllGShapeStyleProperties = {
  scene: ShapeStyle,
  dot: ShapeStyle,
  line: ShapeStyle,
  polyline: ShapeStyle,
  polygon: ShapeStyle,
  rect: ShapeStyle,
  ellipse: ShapeStyle,
  circle: ShapeStyle,
  path: ShapeStyle,
  g: ShapeStyle,
  curve: ShapeStyle,
  text: {
    ...ShapeStyle,
    ...TextStyleProperties,
  },
  image: ShapeStyle,
};

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * Utility type that recursively converts
 * all nested properties into optional properties.
 *
 * Purpose:
 * - Enables creation of deeply partial structures.
 * - Useful for patch systems, partial updates,
 *   configuration overrides, and optional interfaces.
 *
 * Behavior:
 * - Recursively traverses nested objects.
 * - Preserves function signatures without modification.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

/**
 * Internal helper type generated from
 * the common geometry property object.
 *
 * Purpose:
 * - Produces a deeply optional geometry structure
 *   derived directly from the reference object.
 */
type _ICommonGeometricPropsHelper = DeepPartial<
  typeof CommonGeometricProperties
>;

/**
 * Common geometry interface.
 *
 * Purpose:
 * - Represents the public geometry contract
 *   shared across graphical entities.
 * - Generated from the geometry reference object
 *   using deep partial transformation.
 */
export interface ICommonGeometricProperties extends _ICommonGeometricPropsHelper {}

/**
 * Common style property interface.
 *
 * Purpose:
 * - Represents shared styling attributes
 *   available across graphical entities.
 */
export type ICommonStyleProperties = typeof CommonStyleProperties;

/**
 * Primitive shape style interface.
 *
 * Purpose:
 * - Represents styling attributes
 *   specific to graphical shapes.
 */
export type IShapeStyleProperties = typeof ShapeStyleProperties;

/**
 * Text style interface.
 *
 * Purpose:
 * - Represents typography-related
 *   graphical styling properties.
 */
export type ITextStyleProperties = typeof TextStyleProperties;

/**
 * Combined global style property interface.
 *
 * Purpose:
 * - Aggregates all supported style interfaces
 *   into a unified style contract.
 */
export interface IAllStyleProperties
  extends IShapeStyleProperties, ICommonStyleProperties, ITextStyleProperties {}

/**
 * Graphical shape style registry interface.
 *
 * Purpose:
 * - Defines style contracts for each
 *   graphical entity type.
 */
export interface IAllGShapeStyleProperties {
  scene: IShapeStyleProperties & ICommonStyleProperties;

  dot: IShapeStyleProperties & ICommonStyleProperties;

  line: IShapeStyleProperties & ICommonStyleProperties;

  polyline: IShapeStyleProperties & ICommonStyleProperties;

  polygon: IShapeStyleProperties & ICommonStyleProperties;

  rect: IShapeStyleProperties & ICommonStyleProperties;

  ellipse: IShapeStyleProperties & ICommonStyleProperties;

  circle: IShapeStyleProperties & ICommonStyleProperties;

  path: IShapeStyleProperties & ICommonStyleProperties;

  g: IShapeStyleProperties & ICommonStyleProperties;

  text: IShapeStyleProperties & ITextStyleProperties & ICommonStyleProperties;

  image: IShapeStyleProperties & ICommonStyleProperties;

  curve: IShapeStyleProperties & ICommonStyleProperties;

  triangle: IShapeStyleProperties & ICommonStyleProperties;
}

/**
 * Tag-to-style-key mapping type.
 *
 * Purpose:
 * - Maps graphical tag names
 *   to internal style registry keys.
 * - Used for resolving style interfaces
 *   from graphical entity tags.
 */
export type TagToGShapeStyleKeyMap = {
  dot: "dot";
  rect: "rect";
  circle: "circle";
  ellipse: "ellipse";
  line: "line";
  polyline: "polyline";
  polygon: "polygon";
  text: "text";
  image: "image";
  scene: "scene";
  path: "dot";
  tspan: "text";
  g: "g";
  triangle: "triangle";
  curve: "curve";
};

/**
 * Resolves the style interface associated
 * with a graphical tag type.
 *
 * Purpose:
 * - Provides automatic style interface inference
 *   based on graphical entity tag names.
 *
 * Generic Parameters:
 * - T:
 *   Graphical tag name.
 */
export type StyleForGShapeTag<T extends keyof TagToGShapeStyleKeyMap> =
  IAllGShapeStyleProperties[Extract<
    TagToGShapeStyleKeyMap[T],
    keyof IAllGShapeStyleProperties
  >];
