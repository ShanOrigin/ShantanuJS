import type { ConstructorPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class QuadraticCurve extends Curve {
  constructor(props: Omit<ConstructorPropsTypes<'curve'>, 'curveName'>) {
    super({
      ...props,
      curveName: 'quadratic',
      curvature: props.curvature || 0.5
    });
  }
}
