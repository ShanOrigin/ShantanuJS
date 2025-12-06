/*
import type {
  Point,
  Line,
  Polyline,
  Polygon,
  Rect,
  Circle,
  Ellipse,
  Path
} from './shapes';

type iPoint = InstanceType<typeof Point>;
type iLine = InstanceType<typeof Line>;
type iPolyline = InstanceType<typeof Polyline>;
type iPolygon = InstanceType<typeof Polygon>;
type iRect = InstanceType<typeof Rect>;
type iCircle = InstanceType<typeof Circle>;
type iEllipse = InstanceType<typeof Ellipse>;
type iPath = InstanceType<typeof Path>;

export type {
  iPoint,
  iLine,
  iPolyline,
  iPolygon,
  iRect,
  iCircle,
  iEllipse,
  iPath
};
*/
// src/shapes/provider/shapesTypes.d.ts

export type iShape = InstanceType<typeof import('./../baseShape/Shape').Shape>;
export type iPoint = InstanceType<typeof import('./shapes').Point>;
export type iLine = InstanceType<typeof import('./shapes').Line>;
export type iPolyline = InstanceType<typeof import('./shapes').Polyline>;
export type iPolygon = InstanceType<typeof import('./shapes').Polygon>;
export type iRect = InstanceType<typeof import('./shapes').Rect>;
export type iCircle = InstanceType<typeof import('./shapes').Circle>;
export type iEllipse = InstanceType<typeof import('./shapes').Ellipse>;
export type iPath = InstanceType<typeof import('./shapes').Path>;
