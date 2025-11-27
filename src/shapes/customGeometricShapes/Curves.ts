import { renderer } from '../../core/graphics/providers/graphics.js';
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

import {
  IGraphicalElementProperties,
  StyleForGShapeTag
} from '../../properties/provider/shapeProperties';

import type { Point, CurveType } from '../../types/animation';

import {
  checkParent,
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  autoFixGeometry
  //  computeBBox
} from '../../utils/providers/utils.js';

import { generateCurvePoints } from '../../utils/curve/curveGenerator/generateCurvePoints.js';

export type propsType = Partial<IGraphicalElementProperties['curve']> &
  Partial<StyleForGShapeTag<'polyline'>>;

import type { polylinePropsType, curvePropsType } from '../../types/shapes';

export class Curve extends Shape<'curve', 'polyline'> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style
  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  //  #Animations!: Animation<'polyline'>[]; // for timeline support but not implementated yet

  constructor(
    curveName: CurveType,
    props: polylinePropsType & curvePropsType = {}
  ) {
    super('curve', props?.id ?? '', 'polyline');

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

      if (!continuous) {
      } else {
      }

      const points = generateCurvePoints({
        P1: { x: x1, y: y1 } as Point,
        P2: { x: x2, y: y2 } as Point,

        bend: curvature * -1,
        smoothness,
        curveName: curveName || (props.curveName! as CurveType),
        pointsOnly: true,
        continuous,
        continuousCount
      }) as Point[];
      /*
      parameterTypeValidator(
        //  safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'polyline'
      );
*/
      autoFixGeometry(props, ['stroke-width']);

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
        pointsAttr += `${points[i].x.toFixed(10)},${points[i].y.toFixed(10)}`;
        if (i < points.length - 1) {
          pointsAttr += ' ';
        }
      }

      const safeProps = {
        stroke: props['stroke'] || 'black',
        'stroke-width': props['stroke-width'] || 0.5,
        points: pointsAttr,
        initial: true
      };

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

  public clone(offsetX: number = 10, offsetY: number = 10): Curve {
    checkParent(this.#fig, 'polyline');
    /*
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, points = 'M 10 , 10 L 50 , 50 ' } = this.#geometry;
      const nextCopies = copies + 1;
      const style = { ...this.#style } as StyleForGShapeTag<'polyline'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }
      this.#geometry['copies'] = nextCopies;

      const pl = new Curve(points, style as propsType);
      pl.Translate({ x: offsetX, y: offsetY, type: 'r' });
      return pl;
    }
*/
    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  #validatePolylineCoordinates(path: string) {
    // Match the pattern of "x,y" coordinates separated by spaces
    const oordinateListRegex =
      /^(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)(\s+-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?)*$/;

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
      const pair = rowVertex[i].trim();
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
        sharedBuffer: Float32Array;
        canonicalMatrix: Float32Array[];
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
      const shapeRows = vmat.length / 3;
      const bboxRows = 4;
      const totalLength = (shapeRows + bboxRows) * 3;

      // Allocate once and reuse
      if (!geo.sharedBuffer || geo.sharedBuffer.length !== totalLength) {
        /*
        if (setM && render) {
          // only valid when setSMatrix Frist try went wrong
          this.#geometry.sharedBuffer = vmat as Float32Array;
        } else {
					*/
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

      renderer.render({ el: this });
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
      /*
      const m = this.#geometry?.matrix as Float32Array[];
      if (!this.#geometry || !isValidMatrix(m, m.length, 3)) return;

      // Replacing reduce with traditional loop
      let points = '';
      for (let i = 0; i < m.length; i++) {
        points += `${m[i][0]},${m[i][1]} `;
      }
      this.#geometry.points = points;
			*/
    } catch (e) {
      throw e;
    }
  }
  /*
  public getBBox() {
    return computeBBox(this.#geometry, () => super.getBBox());
  }
	*/
}
