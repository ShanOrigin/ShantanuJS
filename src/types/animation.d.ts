/*
  Top Left  , Top Middle , Top Right , Right Middle , Bottem Right , Botten Middle , Bottem Left , Left Middle , Center of Shape                                                         
                                                                                           
  All Above anchors are provided by default with respect to Orianted bounding box
 */

import { ty } from '../utils/animations/preBuilds/helpers/helpers';

export type EasingType =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeOutBounce'
  | 'easeInBounce'
  | 'easeInOutBounce';

export type EasingFunction = (t: number) => number;

// animation module

export type IcommonGeometryAnimatableProperties = {
  translate?: { x?: number; y?: number };
  scale?: {
    sx?: number;
    sy?: number;
  };
  rotate?: {
    angle?: number;
  };
  skew?: {
    sx?: number;
    sy?: number;
  };
};

export type anchors =
  | 'TL'
  | 'TM'
  | 'TR'
  | 'RM'
  | 'BR'
  | 'BM'
  | 'BL'
  | 'LM'
  | 'C'; // according to OOBB
export type modes = 'r' | 'c' | 'p' | 'relative' | 'pivot' | 'center';
export type curvePaths = string | 'linear' | 'quadratic' | 'cubic' | 'arc';
export type directions = 'normal' | 'reverse' | 'alternate';
export type opt = 'fitPolynomialCofficient' | 'preComputeFrames';
export type physicsParams = { physicsMotion?: boolean; speed?: number };

export type pivotOptions = [number, number] | anchors;

export type curveParams = {
  curvePathMotion?: boolean;
  curvePath?: curvePaths;
  stepness?: number;
  smoothness?: number;
};
// new
export type pivotParams = {
  mode?: modes; //1- only for 'r' or 'relative' , 'c' or 'center' for translate ( note : if translate availabe and mode not given or mode is given 'p' or 'pivot' by default 'c' is mode set by system and all other user pivots will be override and system will decide which pivot would be goining to give other transform expect translate  )

  // 2 - 'p' or 'pivot' mode is given  and translate not availabe then all transform respect pivot works if not given CommonPivot will work

  // all below can take either [ number | undefined , number | undefined ] or  anchors
  scalePivot?: pivotOptions;
  skewPivot?: pivotOptions;
  rotatePivot?: pivotOptions;
  commonPivot?: pivotOptions;
};

export type controlsParams = {
  loop?: boolean;
  direction?: directions;
  optimizationTechnique?: opt;
};

// new version

export type deltasParams = {
  synchrony?: boolean; // by default synchrony is true so all start at onece and end at once
  commonDelta?: number;
  skew?: number[];
  scale?: number[];
  rotate?: number;
  translate?: number[];
};

// these are advance propes taken by animation module method animate from user you want control lets take not only control but control itself
export type IadvanceProps = {
  //  animationMode?: 'deltas-based' | 'time-based'; // by default it is 'time-based' experimental
  physics?: physicsParams;
  curve?: curveParams;
  pivot?: pivotParams;
  controls?: controlsParams;
  // deltas?: deltasParams;
};

/*
// old version
export type advanceProps = {
  physics?: physicsParams;
  curve?: curveParams;
  pivot?: pivotParams;
  loop?: boolean;
  direction?: directions;
  optimizationTechnique?: opt;
};
*/

export interface Geometry {
  Skew?: number[];
  Scale?: number[];
  Rotate?: number;
  Translate?: number[];
}

export type NumberType = [number, number];

export type TransformGeometry = {
  Translate: NumberType; // x, y
  Scale: NumberType; // x, y
  Skew: NumberType; // x, y (radians)
  Rotate: number; // radians
};

export type TransformGeometryWithPivot = TransformGeometry & {
  Pivot?: NumberType;
  scalePivot?: pivotOptions;
  skewPivot?: pivotOptions;
  rotatePivot?: pivotOptions;
  CommonPivot?: pivotOptions;
};

export type TGWPkeys = keyof TransformGeometryWithPivot;

export type Point = { x: number; y: number };
export type CurveType = 'linear' | 'quadratic' | 'cubic' | 'arc' | 'earc';
export type CurveInfo = {
  qcx?: number;
  qcy?: number;
  c1?: Point;
  c2?: Point;
  arcCurveSign?: number;
};
export type ArcTableEntry = { t: number; distance: number };

interface TrajectoryOptions {
  /** Show or hide the trajectory line */
  show: boolean; // default: false

  /** Type of trajectory visualization */
  type: 'line' | 'dashed' | 'dotted' | 'curve' | 'custom';

  /** Stroke color of trajectory */
  stroke: string; // e.g. '#000', 'red', 'rgba(0,0,0,0.5)'

  /** Width of trajectory stroke */
  strokeWidth: number; // default: 1

  /** Dash pattern (if type is 'dashed' or 'dotted') */
  dashArray?: string; // e.g. "5,5" or "2,6"

  /** Opacity of trajectory */
  opacity: number; // 0 to 1

  /** Whether trajectory should animate as motion progresses */
  progressiveReveal: boolean; // default: false

  /** If true, trajectory disappears after animation finishes */
  hideOnComplete: boolean; // default: false
}

interface TrajectoryStyleOptions {
  /** Optional stroke gradient along path */
  gradient?: {
    type: 'linear' | 'radial';
    stops: { offset: number; color: string; opacity?: number }[];
  };

  /** End markers for trajectory */
  marker?: {
    start?: 'arrow' | 'circle' | 'none';
    mid?: 'dot' | 'none';
    end?: 'arrow' | 'circle' | 'none';
  };

  /** Glow effect (blur filter) */
  glow?: {
    color: string;
    intensity: number; // e.g. blur radius
  };

  /** Trajectory z-index priority */
  zIndex?: number; // layering in SVG
}

interface TrajectoryMotionOptions {
  /** Show trajectory only for forward motion */
  onlyForward?: boolean;

  /** Show trajectory only for backward motion */
  onlyBackward?: boolean;

  /** Reverse trajectory drawing direction */
  reverse?: boolean;

  /** Loop behavior (trajectory resets or accumulates) */
  loopMode?: 'reset' | 'accumulate';
}
