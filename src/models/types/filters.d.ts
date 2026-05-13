export interface SVGFiltersParams {
  filter?: SVGElement;
  filterComp?: object;
}

export interface boxShadowBase {
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface boxShadowProps extends boxShadowBase {
  opacity?: number;
  color: string;
}

export interface innerShadowProps extends boxShadowBase {
  opacity?: number;
  color: string;
}

export interface colorMatrixProps {
  type: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
  values?: number[] | number;
  inSource?: string;
}

export interface displacementEffectProps {
  patternStyle?: 'turbulence' | 'fractalNoise';
  waveFrequency?: number | string;
  detailLevel?: number;
  randomSeed?: number;
  distortionAmount?: number;
  distortDirectionX?: 'R' | 'G' | 'B' | 'A';
  distortDirectionY?: 'R' | 'G' | 'B' | 'A';
}

export interface lightEffectProps {
  lightingColor: string;
  surfaceScale?: number;
  intensityOfLight: number;
  horizontalAngleOfLight?: number;
  verticalAngleOfLight?: number;
}

export type stops = { color: string; offset?: number }[];
export interface linearGradientProps {
  direction: GradientDirection;
  stops: stops;
}
export type GradientDirection =
  | 'LR' // Left → Right
  | 'RL' // Right → Left
  | 'TB' // Top → Bottom
  | 'BT' // Bottom → Top
  | 'TLBR' // Top-Left → Bottom-Right
  | 'BRTL' // Bottom-Right → Top-Left
  | 'TRBL' // Top-Right → Bottom-Left
  | 'BLTR'; // Bottom-Left → Top-Right

export type RadialPosition =
  | 'CENTER'
  | 'TL' // Top-Left
  | 'TR' // Top-Right
  | 'BL' // Bottom-Left
  | 'BR'; // Bottom-Right

export interface radialGradientProps {
  direction: RadialPosition;
  radius?: number;
  focalX?: number;
  focalY?: number;
  stops: stops;
}
export interface neuMorphProps {
  type?: 'outer' | 'inner' | 'full';
  backgroundColor: string; // the "base" fill color of the card
  outerShadowColor: string;
  highlightColor: string;
  innerShadowColor: string;

  outerBlur: number;
  outerOffsetX: number;
  outerOffsetY: number;
  outerShadowOpacity?: number;

  highlightBlur: number;
  highlightOffsetX: number;
  highlightOffsetY: number;
  highlightOpacity?: number;

  innerBlur: number;
  innerOffsetX: number;
  innerOffsetY: number;
  innerShadowOpacity?: number;
}

export interface glassMorphProps {
  blurAmount: number;
  frostOpacity: number;
  edgeBlur?: number;
  edgeHighlightOpacity?: number;
}
