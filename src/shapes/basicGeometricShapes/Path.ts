//import { GSVGElements, randerer } from '../../core/svg/svgManager/svg.js';
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
import {
  validProps,
  parameterTypeValidator,
  autoFixGeometry,
  //  computeBBox,
  //  assignBBoxMatrix,
  isValidMatrix
} from '../../utils/providers/utils.js';

type propsType = Partial<IGraphicalElementProperties['path']> &
  Partial<StyleForGShapeTag<'path'>>;

export class Path extends Shape<'path'> {
  //  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  #style = this.getIStyle(DEV_INTERNAL_ACCESS); // reference to  base class original style

  #classProp = this.getClassProps(DEV_INTERNAL_ACCESS);

  //#Animations!: Animation<'path'>[]; // for timeline support but not implementated yet
  // Constructor 1: path as string (e.g., "M10 10 L50 50 L90 10 Z")
  constructor(d: string, props?: propsType) {
    super('path', props?.id?.toString() ?? '');

    try {
      props && 'id' in props && delete props.id;

      props && 'd' in props && (d = props.d as string);

      const safeProps = {
        initial: true,
        d,
        ...props
      };
      parameterTypeValidator(
        safeProps,
        GraphicalElementProperties,
        AllGShapeStyleProperties,
        this.#classProp,
        'path'
      );
      autoFixGeometry(safeProps, ['stroke-width']);

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
      'path'
    );
  }

  public clone(offsetX: number = 10, offsetY: number = 10): Path {
    if (
      this.#geometry &&
      typeof this.#geometry === 'object' &&
      this.#geometry !== null &&
      this.#style &&
      typeof this.#style === 'object' &&
      this.#style !== null
    ) {
      const { copies = 0, d = `M${offsetX},${offsetY} L 100, 100` } =
        this.#geometry;
      const nextCopies = copies + 1;
      const style = { ...this.#style } as StyleForGShapeTag<'path'>;
      if ('id' in style && style.id !== '') {
        style.id = `${style.id}-c${nextCopies}`;
      }
      this.#geometry['copies'] = nextCopies;
      const p = new Path(d, style as propsType);

      //    p.Translate({ x: offsetX, y: offsetY, type: 'r' });
      return p;
    }

    throw new Error('Cannot clone: geometry or style is invalid.');
  }

  // returning a transformation Matrix applied by user

  protected override generateMatrix(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }

  protected override validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[]
  ): boolean {
    assertAccess(accessKeys);
    return isValidMatrix(matrix, 4, 3);
  }

  protected override restoreDimension(accessKeys: symbol): void {
    assertAccess(accessKeys);
  }

  /*
  public getBBox() {
    const g = () => super.getBBox();
    assignBBoxMatrix(this.#geometry, g, 'both');
    return computeBBox(this.#geometry, g);
  }

  public override getOBBox(): Object | undefined {
    try {
      if (!this.#geometry) return undefined;
      const g = () => super.getOBBox();

      (!('matrix' in this.#geometry) || !('Obbox' in this.#geometry)) &&
        assignBBoxMatrix(this.#geometry, g, 'both');
      const box = super.getOBBox() as Object;
      return typeof box === 'object' ? box : undefined;
    } catch (e) {
      throw e;
    }
  }
	*/
}
