import type {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../properties/provider/shapeProperties';

// Point propsTypes
type pointGeoTypes = IGraphicalElementProperties['dot'];
type pointStyleTypes = StyleForGShapeTag<'dot'>;
type pointPropsType = Partial<pointGeoTypes> & Partial<pointStyleTypes>;

// Line propsTypes
type lineGeoTypes = IGraphicalElementProperties['line'];
type lineStyleTypes = StyleForGShapeTag<'line'>;
type linePropsType = Partial<lineGeoTypes> & Partial<lineStyleTypes>;

// Polyline propsTypes
type polylineGeoTypes = IGraphicalElementProperties['polyline'];
type polylineStyleTypes = StyleForGShapeTag<'polyline'>;
type polylinePropsType = Partial<polylineGeoTypes> &
  Partial<polylineStyleTypes>;

// Polygon propsTypes
type polygonGeoTypes = IGraphicalElementProperties['polygon'];
type polygonStyleTypes = StyleForGShapeTag<'polygon'>;
type polygonPropsType = Partial<polygonGeoTypes> & Partial<polygonStyleTypes>;

// Circle propsTypes
type circleGeoTypes = IGraphicalElementProperties['circle'];
type circleStyleTypes = StyleForGShapeTag<'circle'>;
type circlePropsType = Partial<circleGeoTypes> & Partial<circleStyleTypes>;

// Ellipse propsTypes
type ellipseGeoTypes = IGraphicalElementProperties['ellipse'];
type ellipseStyleTypes = StyleForGShapeTag<'ellipse'>;
type ellipsePropsType = Partial<ellipseGeoTypes> & Partial<ellipseStyleTypes>;

// Path propsTypes
type pathGeoTypes = IGraphicalElementProperties['path'];
type pathStyleTypes = StyleForGShapeTag<'path'>;
type pathPropsType = Partial<pathGeoTypes> & Partial<pathStyleTypes>;

// Curve propsTypes
type curveGeoTypes = IGraphicalElementProperties['curve'];
type curveStyleTypes = StyleForGShapeTag<'curve'>;
type curvePropsType = Partial<curveGeoTypes> & Partial<curveStyleTypes>;

// Rectangle propsTypes
type rectGeoTypes = IGraphicalElementProperties['rect'];
type rectStyleTypes = StyleForGShapeTag<'rect'>;
type rectPropsType = Partial<rectGeoTypes> & Partial<rectStyleTypes>;

type shapesPropsType =
  | pointPropsType
  | linePropsType
  | polygonPropsType
  | polylinePropsType
  | pathPropsType
  | circlePropsType
  | ellipsePropsType
  | rectPropsType
  | curvePropsType
  | (curvePropsType & polylinePropsType);
