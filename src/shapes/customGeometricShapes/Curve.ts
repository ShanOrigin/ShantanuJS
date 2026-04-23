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

import {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../../properties/provider/shapeProperties';

import type { Point, CurveType } from '../../types/animation';

import { isValidMatrix, validProps } from '../../utils/provider/utils.js';

import { generateCurvePoints } from '../../utils/curve/curveGenerator/generateCurvePoints.js';

export type propsType = Partial<IGraphicalElementProperties['curve']> &
  Partial<StyleForGShapeTag<'polyline'>>;

import type { polylinePropsType, curvePropsType } from '../../types/shapes';
import type { attrsMethodReturnTypes } from '../../types/index';

export class Curve extends GraphicsEntity<'curve'> {
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry

  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  constructor(
    curveName: CurveType,
    props: polylinePropsType & curvePropsType = {}
  ) {
    super('curve', props?.id ?? '');

    try {
      const {
        x1,
        y1,
        x2,
        y2,
        curvature = 0.5,
        smoothness,
        continuous = false,
        continuousCount = 1
      } = props;

      const safeProps = {
        stroke: props['stroke'] || 'black',
        'stroke-width': props['stroke-width'] || 0.5,
        x1,
        y1,
        x2,
        y2,
        curvature,
        smoothness,
        continuous,
        continuousCount,
        curveName,
        initial: true,
        ...props
      };

      this.attrs(safeProps);
    } catch (e) {
      throw e;
    }
  }

  public override attrs(
    props: (curvePropsType & polylinePropsType) | string
  ): attrsMethodReturnTypes {
    try {
      const isObject = typeof props == 'object';

      if (isObject) {
        const isCurveName = 'curveName' in props;

        const isIntial = 'initial' in props;

        !isIntial &&
          (console.warn(`Curve Name Cannot be Changed `),
          (props['curveName'] = this.#geometry?.curveName));

        const needRecalculatePath =
          'x1' in props ||
          'y1' in props ||
          'x2' in props ||
          'y2' in props ||
          'curvature' in props ||
          'smoothness' in props ||
          'continuous' in props ||
          'continuousCount' in props ||
          isCurveName;

        if (needRecalculatePath) {
          const {
            x1,
            y1,
            x2,
            y2,
            curvature = 0.5,
            smoothness,
            continuous = false,
            continuousCount = 1,
            curveName = 'linear'
          } = props;

          if (!continuous) {
          } else {
          }

          const points = generateCurvePoints({
            P1: { x: x1, y: y1 } as Point,
            P2: { x: x2, y: y2 } as Point,
            bend: (curvature * -1) as number,
            smoothness: smoothness as number,
            curveName: curveName as CurveType,
            pointsOnly: true,
            continuous: continuous as boolean,
            continuousCount: continuousCount as number
          }) as Point[];

          let pointsAttr = '';
          if (
            (points && !Array.isArray(points)) ||
            !points.every(
              (row) =>
                typeof row == 'object' &&
                typeof row.x == 'number' &&
                typeof row.y == 'number'
            )
          ) {
            throw new Error(
              'Invalid matrix: must be an array of [x, y] coordinates.'
            );
          }

          for (let i = 0; i < points.length; i++) {
            pointsAttr += `${points[i]!.x.toFixed(10)},${points[i]!.y.toFixed(
              10
            )}`;
            if (i < points.length - 1) {
              pointsAttr += ' ';
            }
          }

          props['points'] = pointsAttr;

          super.attrs(props);
          return;
        }
      } else if (typeof props == 'string') {
        const val = super.attrs(props);

        return val;
      }

      return;
    } catch (e) {}
  }

  static validProps() {
    return validProps(
      AllGShapeStyleProperties,
      CommonGeometricProperties,
      GraphicalElementProperties,
      'polyline'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Curve {
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

        x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0,
        curvature = 0.5,
        smoothness = 0.5,
        continuous = false,
        continuousCount = 1,
        curveName = 'cubic',

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

      const pl = new Curve(curveName as CurveType, {
        x1,
        x2,
        y1,
        y2,
        curvature,
        smoothness,
        continuous,
        continuousCount,
        curveName,
        ...(style as polylinePropsType)
      });
      //   pl.Translate({ x: offsetX, y: offsetY, type: 'r' });
      return pl;
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  #validatePolylineCoordinates(path: string) {
    // Match the pattern of "x,y" coordinates separated by spaces
    const coordinateListRegex =
      /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?)*$/;

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
        buffer: Float32Array;

        points: string;
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

      //     renderer.render({ el: this });
      this.restoreDimension(DEV_INTERNAL_ACCESS, sb);
    } catch (e) {
      throw e;
    }
  }

  protected override restoreDimension(
    accessKey: symbol,
    temporaryState: Float32Array
  ) {
    try {
      assertAccess(accessKey);

      const m = temporaryState;
      //  if (!this.#geometry || !isValidMatrix(m, m.length, 3)) return;

      // Replacing reduce with traditional loop
      let points = '';
      for (let i = 0; i < m.length; i += 3) {
        points += `${m[i]},${m[i + 1]} `;
      }
      this.#geometry!.points = points;
    } catch (e) {
      throw e;
    }
  }
}
