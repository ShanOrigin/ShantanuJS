// basic geometry shapes
//
import { Point } from '../basicGeometricShapes/Point.js';
import { Rect } from '../basicGeometricShapes/Rectangle.js';
import { Circle } from '../basicGeometricShapes/Circle.js';
import { Ellipse } from '../basicGeometricShapes/Ellipse.js';
import { Line } from '../basicGeometricShapes/Line.js';
import { Polyline } from '../basicGeometricShapes/Polyline.js';
import { Polygon } from '../basicGeometricShapes/Polygon.js';
import { Path } from '../basicGeometricShapes/Path.js';

//composite geometry shapes
import { Triangle } from '../customGeometricShapes/Triangle.js';
//export { Line, Path, Polyline, Polygon, Rect, Ellipse, Circle };

export {
  Point,
  Line,
  Path,
  Polyline,
  Polygon,
  Rect,
  Circle,
  Ellipse,
  Triangle
};

/*
export const shapeRegistry = new Map<string, any>();
export function registerShape(name: string, shape: any) {
  shapeRegistry.set(name, shape);
}




import { registerShape } from '../provider/shapeRegistry.ts';

class Circle {  ...  }

registerShape('Circle', Circle);

 */
