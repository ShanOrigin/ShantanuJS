import Canvas from '../core/graphics/providers/canvas.js';
import { Circle } from '../shapes/basicGeometricShapes/Circle.js';
import { Ellipse } from '../shapes/basicGeometricShapes/Ellipse.js';
import { Line } from '../shapes/basicGeometricShapes/Line.js';
import { Path } from '../shapes/basicGeometricShapes/Path.js';
import { Point } from '../shapes/basicGeometricShapes/Point.js';
import { Polygon } from '../shapes/basicGeometricShapes/Polygon.js';
import { Polyline } from '../shapes/basicGeometricShapes/Polyline.js';
import { Rect } from '../shapes/basicGeometricShapes/Rectangle.js';

import { Text } from '../shapes/textMediaElements/Text.js';

export const Shantanu = {
  Canvas,
  Rect,
  Circle,
  Line,
  Ellipse,
  Point,
  Polyline,
  Polygon,
  Path,
  // media elements
  Text
} as const;

// Now export types that map cleanly
export namespace Shantanu {
  export type Canvas = InstanceType<typeof Shantanu.Canvas>;
  export type Rect = InstanceType<typeof Shantanu.Rect>;
  export type Circle = InstanceType<typeof Shantanu.Circle>;
  export type Line = InstanceType<typeof Shantanu.Line>;
  export type Ellipse = InstanceType<typeof Shantanu.Ellipse>;
  export type Point = InstanceType<typeof Shantanu.Point>;
  export type Polyline = InstanceType<typeof Shantanu.Polyline>;
  export type Polygon = InstanceType<typeof Shantanu.Polygon>;
  export type Path = InstanceType<typeof Shantanu.Path>;

  export type Text = InstanceType<typeof Shantanu.Text>;
}
