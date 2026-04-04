import { GraphicsEntity } from '../graphicsEntity/graphicsEntity.js';
import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/provider/accesskeys.js';

import {
  GraphicalElementProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import { StyleForGShapeTag } from '../../properties/provider/shapeProperties';

import {
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  autoFixGeometry
  //  computeBBox
} from '../../utils/provider/utils.js';

import type { polylinePropsType } from '../../types/shapes';

export class Polyline extends GraphicsEntity<'polyline'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  // Constructor 1: points as string
  constructor(points: string, props?: polylinePropsType);
  // Constructor 2: points as 2D array
  constructor(points: number[][], props?: polylinePropsType);
  constructor(points: string | number[][], props: polylinePropsType = {}) {
    super('polyline', props?.id ?? '');

    try {
      'id' in props && delete props.id;
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
        'polyline'
      );

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
      'polyline'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Polyline {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const {
        copies = 0,

        buffer
      } = this.#geometry;
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

      const pl = new Polyline(newPoints, style as polylinePropsType);
      //   pl.Translate({ x: offsetX, y: offsetY, type: 'r' });
      return pl;
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  #validatePolylineCoordinates(path: string) {
    // Match the pattern of "x,y" coordinates separated by spaces
    const coordinateListRegex =
      /^(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)(\s+-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)*$/;

    // Check if the path matches the valid polyline format
    if (!coordinateListRegex.test(path)) {
      throw new Error('given path or coordinate are not valid ');
    }

    // Split the path into individual coordinates (by spaces), then split each pair by comma
    const rowVertex = path.trim().split(/\s+/);
    const Vertex = new Float32Array(rowVertex.length * 3); // 3 floats per vertex: x, y, 1

    for (let i = 0; i < rowVertex.length; i++) {
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
    //  const totalCoordinates = Vertex.length;
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
        buffer: Float32Array;
      };

      if (!geo) return;
      let vmat: Float32Array;

      if (setM && setM instanceof Float32Array) {
        vmat = setM as Float32Array;
      } else {
        const rawPoints = this.attrs('points') as string;
        vmat = this.#validatePolylineCoordinates(rawPoints);
        if (!(vmat instanceof Float32Array)) {
          throw new Error(
            'Invalid point data: could not generate transformation matrix.'
          );
        }
      }
      const m = vmat.length / 3;

      // Retrieve expected matrix dimensions for a line
      const [_, n] = dimensions['polyline'] as [number, number];

      // Compute total buffer length based on dimensions
      const totalLength = m * n;

      // Allocate the buffer once or reallocate only if the size has changed
      if (!geo.buffer || geo.buffer.length !== totalLength) {
        geo.buffer = new Float32Array(totalLength);
      }

      const sb = geo.buffer as Float32Array;
      sb.set(vmat, 0);

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
