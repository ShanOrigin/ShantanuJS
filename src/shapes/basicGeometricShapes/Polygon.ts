import {
  Shape,
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../baseShape/Shape.js';
import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

import { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  autoFixGeometry
  //  computeBBox
} from '../../utils/providers/utils.js';

import type { polygonPropsType } from '../../types/shapes';

export class Polygon extends Shape<'polygon'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);
  //  #Animations!: Animation<'polygon'>[]; // for timeline support but not implementated yet

  // Constructor 1: points as string
  constructor(points: string, props?: polygonPropsType);
  // Constructor 2: points as 2D array
  constructor(points: number[][], props?: polygonPropsType);

  constructor(points: string | number[][], props: polygonPropsType = {}) {
    super('polygon', props?.id ?? '');

    try {
      let pointsAttr: string = '';

      if (typeof points === 'string') {
        // Form: "x1,y1 x2,y2 x3,y3 ..."
        pointsAttr = points.trim();
      } else {
        // Form: [[x1, y1], [x2, y2], ...]
        if (
          (points && !Array.isArray(points)) ||
          !points.every(
            (row) =>
              Array.isArray(row) &&
              row.length === 2 &&
              typeof row[0] == 'number' &&
              typeof row[1] == 'number'
          )
        ) {
          throw new Error(
            'Invalid matrix: must be an array of [x, y] coordinates.'
          );
        }

        for (let i = 0; i < points.length; i++) {
          pointsAttr += points[i]![0] + ',' + points[i]![1];
          if (i < points.length - 1) {
            pointsAttr += ' ';
          }
        }
        pointsAttr += ' Z';
      }

      if (pointsAttr[pointsAttr.length - 1]!.toLowerCase() !== 'z') {
        throw new Error("Given Path is Not Closed please close path with 'Z'");
      }

      const safeProps = {
        initial: true,
        points: pointsAttr,
        ...props
      };

      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'polygon'
      );

      autoFixGeometry(props, ['stroke-width']);

      this.attrs(safeProps);
    } catch (e) {
      throw e;
    }
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'polygon'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Polygon {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, buffer } = this.#geometry;
      const nextCopies = copies + 1;

      const newPoints = [];
      for (let i = 0; i < buffer!.length!; i += 3) {
        const x = buffer![i]!;
        const y = buffer![i + 1]!;
        newPoints.push([x + offsetX, y + offsetY]);
      }

      const style = { ...this.#style } as StyleForGShapeTag<'polyline'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }
      this.#geometry['copies'] = nextCopies;

      const pl = new Polygon(newPoints, style as polygonPropsType);
      //  pl.Translate({ x: offsetX, y: offsetY, type: 'r' });
      return pl;
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  #validatePolygonCoordinates(path: string) {
    // Match the pattern of "x,y" coordinates separated by spaces

    const coordinateListRegex =
      /^(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)(\s+-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)*(?:\s+[Zz])?$/;

    // Check if the path matches the valid polyline format
    if (!coordinateListRegex.test(path)) {
      throw new Error('Given Path is not correct please check');
    }

    const rowVertex = path
      .trim()

      .split(/\s+/);
    const Vertex = new Float32Array((rowVertex.length - 1) * 3); // 3 floats per vertex: x, y, 1

    for (let i = 0; i < rowVertex.length - 1; i++) {
      const pair = rowVertex[i]!.trim();
      const s = pair.indexOf(',');
      const x = parseFloat(pair.slice(0, s));
      const y = parseFloat(pair.slice(s + 1));

      if (isNaN(x) || isNaN(y)) {
        throw new Error('X or Y are not numbers');
      }

      const offset = i * 3;
      Vertex[offset] = x;
      Vertex[offset + 1] = y;
      Vertex[offset + 2] = 1; // homogeneous coordinate
    }

    // Optional validation
    // const totalCoordinates = Vertex.length;
    return Vertex;
  }

  // specially for polyline because throught .attrs() , .setSMatrix() user can change acutual shape matrix if he/she gives less or more coordinates than original size

  protected override generateMatrix(
    accessKey: symbol,
    setM?: Float32Array
  ): void {
    try {
      assertAccess(accessKey);

      const geo = this.#geometry as {
        points: string;
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
      };

      if (!geo) return;
      let vmat: Float32Array;

      if (setM && setM instanceof Float32Array) {
        vmat = setM as Float32Array;
      } else {
        const rawPoints = this.attrs('points') as string;
        vmat = this.#validatePolygonCoordinates(rawPoints);
        if (!(vmat instanceof Float32Array)) {
          throw new Error(
            'Invalid point data: could not generate transformation matrix.'
          );
        }
      }
      const shapeRows = vmat.length / 3;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        geo.sharedBuffer = new Float32Array(totalLength);
      }

      const sb = geo.sharedBuffer as Float32Array;
      sb.set(vmat, 0);

      // Only recreate views if buffer was reallocated
      if (
        !geo.canonicalMatrix ||
        totalLength - 12 != geo.canonicalMatrix.length * 3
      ) {
        const mat = [];

        for (let i = 0; i < shapeRows; i++) {
          mat.push(new Float32Array(sb.buffer, i * 3 * 4, 3));
        }
        geo.canonicalMatrix = mat;
      }
      // only when setM comming throught setSMatrix
      if (setM) return; // only assing array not rendering

      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override validateShapeMatrix(
    accessKey: symbol,
    m: Float32Array[]
  ): boolean {
    assertAccess(accessKey);
    return isValidMatrix(m, m.length, 3);
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ) {
    try {
      assertAccess(accessKey);
      const m = temporaryState;
      if (!this.#geometry) return;

      // Replacing reduce with traditional loop

      let points = '';
      for (let i = 0; i < m.length; i += 3) {
        points += `${m[i]!},${m[i + 1]!} `;
      }
      this.#geometry!.points = points;
    } catch (e) {
      throw e;
    }
  }
}
