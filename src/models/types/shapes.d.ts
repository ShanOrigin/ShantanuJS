import { I } from 'vitest/dist/chunks/reporters.d.BFLkQcL6';
import type {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../../property-definitions/common/common-properties';
import { ValidGraphicsShapes } from './graphics-model';

// Point propsTypes
type PointGeoTypes = IGraphicalElementProperties['dot'];
type PointStyleTypes = StyleForGShapeTag<'dot'>;
export type PointPropsType = Partial<PointGeoTypes> & Partial<PointStyleTypes>;

// Line propsTypes
type LineGeoTypes = IGraphicalElementProperties['line'];
type LineStyleTypes = StyleForGShapeTag<'line'>;
export type LinePropsType = Partial<LineGeoTypes> & Partial<LineStyleTypes>;

// Polyline propsTypes
type PolylineGeoTypes = IGraphicalElementProperties['polyline'];
type PolylineStyleTypes = StyleForGShapeTag<'polyline'>;
export type PolylinePropsType = Partial<PolylineGeoTypes> &
  Partial<PolylineStyleTypes>;

// Polygon propsTypes
type PolygonGeoTypes = IGraphicalElementProperties['polygon'];
type PolygonStyleTypes = StyleForGShapeTag<'polygon'>;
export type PolygonPropsType = Partial<PolygonGeoTypes> &
  Partial<PolygonStyleTypes>;

// Circle propsTypes
type CircleGeoTypes = IGraphicalElementProperties['circle'];
type CircleStyleTypes = StyleForGShapeTag<'circle'>;
export type CirclePropsType = Partial<CircleGeoTypes> &
  Partial<CircleStyleTypes>;

// Ellipse propsTypes
type EllipseGeoTypes = IGraphicalElementProperties['ellipse'];
type EllipseStyleTypes = StyleForGShapeTag<'ellipse'>;
export type EllipsePropsType = Partial<EllipseGeoTypes> &
  Partial<EllipseStyleTypes>;

// Path propsTypes
type PathGeoTypes = IGraphicalElementProperties['path'];
type PathStyleTypes = StyleForGShapeTag<'path'>;
export type PathPropsType = Partial<PathGeoTypes> & Partial<PathStyleTypes>;

// Curve propsTypes
type CurveGeoTypes = IGraphicalElementProperties['curve'];
type CurveStyleTypes = StyleForGShapeTag<'curve'>;
export type CurvePropsType = Partial<CurveGeoTypes> & Partial<CurveStyleTypes>;

// Rectangle propsTypes
type RectGeoTypes = IGraphicalElementProperties['rect'];
type RectStyleTypes = StyleForGShapeTag<'rect'>;
export type RectPropsType = Partial<RectGeoTypes> & Partial<RectStyleTypes>;

type TextPropsType = Partial<IGraphicalElementProperties['text']> &
  Partial<StyleForGShapeTag<'text'>>;

type ImagePropsType = Partial<IGraphicalElementProperties['image']> &
  Partial<StyleForGShapeTag<'image'>>;

export type GroupPropsType = Partial<IGraphicalElementProperties['group']> &
  Partial<StyleForGShapeTag<'g'>>;

export type AllShapesPropsTypes =
  | PointPropsType
  | LinePropsType
  | PolygonPropsType
  | PolylinePropsType
  | PathPropsType
  | CirclePropsType
  | EllipsePropsType
  | RectPropsType
  | CurvePropsType
  | TextPropsType
  | ImagePropsType
  | (CurvePropsType & PolylinePropsType);

export type AllShapesPropertiesTypes = Omit<
  AllShapesPropsTypes,
  | 'id'
  | 'localDirty'
  | 'worldDirty'
  | 'shape'
  | 'zIndex'
  | 'buffer'
  | 'parentMatrix'
  | 'localMatrix'
  | 'transformStack'
  | 'bounds'
  | 'renderUpdateType'
>;
