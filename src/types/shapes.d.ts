import type {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../properties/provider/shapeProperties';

// Point propsTypes
type pointGeoTypes = IGraphicalElementProperties['dot'];
type pointStyleTypes = StyleForGShapeTag<'dot'>;
export type pointPropsType = Partial<pointGeoTypes> & Partial<pointStyleTypes>;

// Line propsTypes
type lineGeoTypes = IGraphicalElementProperties['line'];
type lineStyleTypes = StyleForGShapeTag<'line'>;
export type linePropsType = Partial<lineGeoTypes> & Partial<lineStyleTypes>;

// Polyline propsTypes
type polylineGeoTypes = IGraphicalElementProperties['polyline'];
type polylineStyleTypes = StyleForGShapeTag<'polyline'>;
export type polylinePropsType = Partial<polylineGeoTypes> &
  Partial<polylineStyleTypes>;

// Polygon propsTypes
type polygonGeoTypes = IGraphicalElementProperties['polygon'];
type polygonStyleTypes = StyleForGShapeTag<'polygon'>;
export type polygonPropsType = Partial<polygonGeoTypes> &
  Partial<polygonStyleTypes>;

// Circle propsTypes
type circleGeoTypes = IGraphicalElementProperties['circle'];
type circleStyleTypes = StyleForGShapeTag<'circle'>;
export type circlePropsType = Partial<circleGeoTypes> &
  Partial<circleStyleTypes>;

// Ellipse propsTypes
type ellipseGeoTypes = IGraphicalElementProperties['ellipse'];
type ellipseStyleTypes = StyleForGShapeTag<'ellipse'>;
export type ellipsePropsType = Partial<ellipseGeoTypes> &
  Partial<ellipseStyleTypes>;

// Path propsTypes
type pathGeoTypes = IGraphicalElementProperties['path'];
type pathStyleTypes = StyleForGShapeTag<'path'>;
export type pathPropsType = Partial<pathGeoTypes> & Partial<pathStyleTypes>;

// Curve propsTypes
type curveGeoTypes = IGraphicalElementProperties['curve'];
type curveStyleTypes = StyleForGShapeTag<'curve'>;
export type curvePropsType = Partial<curveGeoTypes> & Partial<curveStyleTypes>;

// Rectangle propsTypes
type rectGeoTypes = IGraphicalElementProperties['rect'];
type rectStyleTypes = StyleForGShapeTag<'rect'>;
export type rectPropsType = Partial<rectGeoTypes> & Partial<rectStyleTypes>;

type textPropsType = Partial<IGraphicalElementProperties['text']> &
  Partial<StyleForGShapeTag<'text'>>;

type imagePropsType = Partial<IGraphicalElementProperties['image']> &
  Partial<StyleForGShapeTag<'image'>>;

export type shapesPropsType =
  | pointPropsType
  | linePropsType
  | polygonPropsType
  | polylinePropsType
  | pathPropsType
  | circlePropsType
  | ellipsePropsType
  | rectPropsType
  | curvePropsType
  | textPropsType
  | imagePropsType
  | (curvePropsType & polylinePropsType);
