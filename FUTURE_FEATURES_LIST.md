
MAY BE / NO GUARANTEED FEATURES : 
    
0.    SHAPE  MODULE :
         - PlugIn support.
         - different custom shapes in custom_shapes sub module.( arrow , flexible arrow , cloude , star , etc ).
         - image in media shapes. 
         - maybe path shape will be added with remapping to actual primitive shapes







1.    TRANSFORMATION MODULE :
         - custom matrix module for matrix operations written if C WASM with FLOAT32ARRAY ( if required only ).
         - minimum area rect for hit testing.


/**
 * ---------------------------------------------------------
 * Anchor support (planned for v1.5 / v2)
 * ---------------------------------------------------------
 *
 * Anchors will be resolved relative to the OBB (oriented
 * bounding box) of the shape.
 *
 * Anchor resolution is only applied when `tType === 'p'`
 * (pivot mode). All anchors ultimately resolve to a concrete
 * pivot point `(px, py)` in absolute coordinates.
 */

/**
 * AnchorType defines semantic pivot selectors.
 *
 * All string-based anchors are case-insensitive.
 * Examples:
 *   'c', 'C', 'center'
 *   'rm', 'RIGHT-MID'
 *   'top-left', 'TL'
 */
type AnchorType =
  | 'tl' | 'top-left'
  | 'tm' | 'top-mid'
  | 'tr' | 'top-right'

  | 'rm' | 'right-mid'

  | 'br' | 'bottom-right'
  | 'bm' | 'bottom-mid'
  | 'bl' | 'bottom-left'

  | 'lm' | 'left-mid'

  | 'c'  | 'center'

  /**
   * Normalized anchor expressed as a relative point
   * inside the shape's OBB.
   *
   * The values are normalized in the range [0, 1]:
   *   x = 0 → left edge
   *   x = 1 → right edge
   *   y = 0 → top edge
   *   y = 1 → bottom edge
   *
   * Example:
   *   { x: 0.4, y: 0.6 }
   *
   * This resolves to:
   *   px = obb.x + 0.4 * obb.width
   *   py = obb.y + 0.6 * obb.height
   */
  | { x: number; y: number };


/**
 * ---------------------------------------------------------
 * Pivot resolution model
 * ---------------------------------------------------------
 *
 * All anchors (string-based or object-based) are internally
 * converted to a normalized `{ x, y }` form.
 *
 * A single pivot resolver maps normalized coordinates to
 * absolute `(px, py)` using the OBB.
 *
 * Example:
 *
 *   OBB:
 *     x      = 50
 *     y      = 50
 *     width  = 100
 *     height = 100
 *
 *   Anchor:
 *     { x: 0.4, y: 0.4 }
 *
 *   Resolution:
 *     px = 50 + 0.4 * 100 = 90
 *     py = 50 + 0.4 * 100 = 90
 */


/**
 * ---------------------------------------------------------
 * Core transform metadata
 * ---------------------------------------------------------
 */
interface BaseTransformMeta {
  /**
   * Transformation space:
   *   'r' → relative (canvas space)
   *   'a' → absolute (shape-local default)
   *   'p' → pivot-based
   */
  tType?: 'r' | 'a' | 'p';

  /**
   * Semantic anchor used to compute pivot.
   *
   * Valid only when `tType === 'p'`.
   * All anchors are resolved relative to the shape's OBB.
   */
  anchor?: AnchorType;

  /**
   * Absolute, fully resolved pivot coordinates.
   *
   * When provided, `px` / `py` override `anchor`.
   */
  px?: number;
  py?: number;

  /**
   * Optional lifecycle callback.
   */
  callback?: Function;
}




/**
 * ---------------------------------------------------------
 * Canonical anchor mapping
 * ---------------------------------------------------------
 *
 * All string-based anchors are mapped to normalized
 * `{ x, y }` coordinates relative to the shape's OBB.
 *
 * These values are geometry-agnostic and are later resolved
 * to absolute `(px, py)` using the OBB dimensions.
 *
 * NOTE:
 * - Keys are expected to be normalized (lowercase, trimmed)
 *   before lookup.
 * - Case-insensitivity is handled outside this map.
 */
const ANCHOR_MAP: Record<string, { x: number; y: number }> = {
  // Top row
  'tl':         { x: 0.0, y: 0.0 },
  'top-left':   { x: 0.0, y: 0.0 },

  'tm':         { x: 0.5, y: 0.0 },
  'top-mid':    { x: 0.5, y: 0.0 },

  'tr':         { x: 1.0, y: 0.0 },
  'top-right':  { x: 1.0, y: 0.0 },

  // Middle row
  'lm':         { x: 0.0, y: 0.5 },
  'left-mid':   { x: 0.0, y: 0.5 },

  'c':          { x: 0.5, y: 0.5 },
  'center':     { x: 0.5, y: 0.5 },

  'rm':         { x: 1.0, y: 0.5 },
  'right-mid':  { x: 1.0, y: 0.5 },

  // Bottom row
  'bl':         { x: 0.0, y: 1.0 },
  'bottom-left':{ x: 0.0, y: 1.0 },

  'bm':         { x: 0.5, y: 1.0 },
  'bottom-mid': { x: 0.5, y: 1.0 },

  'br':         { x: 1.0, y: 1.0 },
  'bottom-right':{ x: 1.0, y: 1.0 }
};


function resolveAnchor(
  anchor: AnchorType,
  obb: { x: number; y: number; width: number; height: number }
): { px: number; py: number } {
  const norm =
    typeof anchor === 'string'
      ? ANCHOR_MAP[normalize(anchor)]
      : anchor;

  return {
    px: obb.x + norm.x * obb.width,
    py: obb.y + norm.y * obb.height
  };
}






2.    ANIMATION MODULE :

         - continuous phase shifting like sin wave in any curve like cubic , quadratic ,  arc  and elliptical arc with custom continuousCount and continuity flag.
         ex . { curvePath : 'cubic' ,
                stiffness : 0.7 ,
                smoothness : 60 , 
                continuousCount : 4 , 
                continuity : true 
                }
         so it will create a cubic path with curvature of 0.7 as a amplitude and poor phase smoothness sampling point is 60 and it will continue four phases up down up down


         - synchrony in animation

         ex . { synchrony : true }

         so when there are multiple transformations given in animation with different different pivot or without pivot so if synchrony is true no matter how much transformation is small or big compare to each other all will start at the same time and at the same time

         and if synchrony is false then each transformation in animation will start at the same time but it will finish independence day each other smaller finish first larger finish last







3.    FILTER MODULE :
         - maybe new different type of filter get added







4.    CURVE MODULE : 
         - maybe different type of curve get added
         - maybe allow different curvature for different phase in a continuous curve
         - maybe allowed dynamic creation based on user input



THERE WILL BE OPTIMISATION FOR EACH MODULE IN THE FUTURE IF REQUIRED OR IF NECESSARY

