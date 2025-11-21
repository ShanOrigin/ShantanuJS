import { Polygon } from '../basicGeometricShapes/Polygon.js';

type triangleCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
};

export class Triangle extends Polygon {
  // Overload 1: x, y, height, base, angleB, optional props
  constructor(
    x: number,
    y: number,
    height: number,
    base: number,
    angleB: number,
    props?: Record<string, string | number>
  );

  // Overload 2: x, y, height, base, angleB, angleC, optional props
  constructor(
    x: number,
    y: number,
    height: number,
    base: number,
    angleB: number,
    angleC: number,
    props?: Record<string, string | number>
  );

  // Overload 3: points, optional props
  constructor(
    points: triangleCoordinates,
    props?: Record<string, string | number>
  );

  // Unified implementation
  constructor(
    xorpoints: number | triangleCoordinates,
    yorprops?: number | Record<string, string | number>,
    height?: number,
    base?: number,
    angleB?: number,
    angleCOrProps?: number | Record<string, string | number>,
    maybeProps?: Record<string, string | number>
  ) {
    let points!: number[][];
    let finalProps: Record<string, string | number> = {};

    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const lengthFromAngle = (height: number, angle: number) =>
      height / Math.tan(toRadians(angle));

    if (typeof xorpoints == 'object') {
      ['x1', 'y1', 'x2', 'y2', 'x3', 'y3'].forEach((c) => {
        if (!(c in xorpoints))
          throw new Error(
            `The ${c} Co-ordinate is not present in given Co-ordinates...`
          );
      });
      const p = xorpoints;
      points = [
        [p.x1, p.y1],
        [p.x2, p.y2],
        [p.x3, p.y3]
      ];
      if (typeof yorprops === 'object') {
        finalProps = yorprops;
      }
    } else {
      const x = xorpoints;
      const y = typeof yorprops === 'number' ? yorprops : 0;
      const angleC = typeof angleCOrProps === 'number' ? angleCOrProps : 0;

      if (typeof angleCOrProps === 'object') {
        finalProps = angleCOrProps;
      } else if (maybeProps) {
        finalProps = maybeProps;
      }

      if (height === undefined || base === undefined || angleB === undefined) {
        throw new Error(
          'Missing required parameters for triangle construction.'
        );
      }

      points = [[x, y]];
      if (angleB > 0 && angleB >= 180) {
        throw new Error(
          ' one Amgle of Triangle cannot be more than 179 degree'
        );
      }
      if (angleC > 0 && angleB + angleC >= 180) {
        throw new Error('Two Angles of Triangle sum cannot exceed 179');
      }
      if (!angleC) {
        const n = lengthFromAngle(height, angleB);
        const m = base - n;
        points.push([x + m, y + height]);
        points.push([x - n, y + height]);
      } else if (angleB > 0 && angleB < 180 && angleC > 0 && angleC < 180) {
        const n = lengthFromAngle(height, angleB);
        const m = lengthFromAngle(height, angleC);
        points.push([x + m, y + height]);
        points.push([x - n, y + height]);
      } else {
        throw new Error(
          `Invalid angles for triangle. Got angleB: ${angleB}, angleC: ${angleC}`
        );
      }
    }

    super(points, finalProps);
  }
}
