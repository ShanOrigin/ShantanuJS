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

export type CommonGeometryAnimatableProperties = {
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

export type Anchors =
  | 'TL'
  | 'TM'
  | 'TR'
  | 'RM'
  | 'BR'
  | 'BM'
  | 'BL'
  | 'LM'
  | 'C'; // according to OOBB

type PivotOptions = [number, number] | anchors;

export type Modes = 'r' | 'c' | 'p' | 'relative' | 'pivot' | 'center';
type CurvePaths = string | 'linear' | 'quadratic' | 'cubic' | 'arc';
type Directions = 'normal' | 'reverse' | 'alternate';
export type OptimizationTechniques =
  | 'fitPolynomialCofficient'
  | 'preComputeFrames';
export type PhysicsParams = { physicsMotion?: boolean; speed?: number };

export type CurveParams = {
  curvePathMotion?: boolean;
  curvePath?: CurvePaths;
  stepness?: number;
  smoothness?: number;
};
// new
export type PivotParams = {
  mode?: Modes; //1- only for 'r' or 'relative' , 'c' or 'center' for translate ( note : if translate availabe and mode not given or mode is given 'p' or 'pivot' by default 'c' is mode set by system and all other user pivots will be override and system will decide which pivot would be goining to give other transform expect translate  )

  // 2 - 'p' or 'pivot' mode is given  and translate not availabe then all transform respect pivot works if not given CommonPivot will work

  // all below can take either [ number | undefined , number | undefined ] or  anchors
  scalePivot?: PivotOptions;
  skewPivot?: PivotOptions;
  rotatePivot?: PivotOptions;
  commonPivot?: PivotOptions;
};

export type ControlsParams = {
  loop?: boolean;
  direction?: Directions;
  optimizationTechnique?: OptimizationTechniques;
};

// new version

// these are advance propes taken by animation module method animate from user you want control lets take not only control but control itself
export type AdvanceProps = {
  //  animationMode?: 'deltas-based' | 'time-based'; // by default it is 'time-based' experimental
  physics?: PhysicsParams;
  curve?: CurveParams;
  pivot?: PivotParams;
  controls?: ControlsParams;
};

export type NumberType = [number, number];

export type TransformGeometry = {
  Translate: NumberType; // x, y
  Scale: NumberType; // x, y
  Skew: NumberType; // x, y (radians)
  Rotate: number; // radians
};

export type TransformGeometryWithPivot = TransformGeometry & {
  Pivot?: NumberType;
  scalePivot?: PivotOptions;
  skewPivot?: PivotOptions;
  rotatePivot?: PivotOptions;
  CommonPivot?: PivotOptions;
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
